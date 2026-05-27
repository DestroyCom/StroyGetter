"use client";

import { Disc3, Download, Film, Music } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVideoInfos } from "@/functions/fetchVideoinfos";
import { useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { TIKTOK_ITAG } from "@/lib/types";
import type { VideoData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VideoLoading } from "./VideoLoading";

const extractYtId = (url: string): string => url.match(/[?&]v=([^&]+)/)?.[1] ?? "";

type YoutubeFmt = "mp4" | "mp3" | "library-ready";
type TikTokFmt = "tiktok-watermark" | "tiktok-no-watermark" | "tiktok-audio";
type Fmt = YoutubeFmt | TikTokFmt;

interface Props {
  source: "youtube" | "tiktok";
}

export const VideoSelect = ({ source }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");
  const t = useTranslations("videoSelect");

  const YOUTUBE_TABS: { id: YoutubeFmt; label: string; sub: string; Icon: typeof Film }[] = [
    { id: "library-ready", label: t("formatLibraryReady"),    sub: t("formatLibraryReadySub"), Icon: Disc3 },
    { id: "mp4",           label: t("formatMp4"),             sub: t("formatMp4Sub"),          Icon: Film },
    { id: "mp3",           label: t("formatMp3"),             sub: t("formatMp3Sub"),          Icon: Music },
  ];

  const TIKTOK_TABS: { id: TikTokFmt; label: string; sub: string; Icon: typeof Film }[] = [
    { id: "tiktok-no-watermark", label: t("formatTiktokNoWatermark"), sub: t("formatTiktokNoWatermarkSub"), Icon: Film },
    { id: "tiktok-watermark",    label: t("formatTiktokWatermark"),   sub: t("formatTiktokWatermarkSub"),   Icon: Film },
    { id: "tiktok-audio",        label: t("formatTiktokAudio"),       sub: t("formatTiktokAudioSub"),       Icon: Music },
  ];

  const FORMAT_TABS = source === "tiktok" ? TIKTOK_TABS : YOUTUBE_TABS;

  const EDU_CARDS = [
    { title: t("eduCard1Title"), desc: t("eduCard1Desc") },
    { title: t("eduCard2Title"), desc: t("eduCard2Desc") },
    { title: t("eduCard3Title"), desc: t("eduCard3Desc") },
  ];

  const defaultFmt: Fmt = source === "tiktok" ? "tiktok-no-watermark" : "library-ready";

  const [videoData, setVideoData] = useState<VideoData["video_details"] | null>(null);
  const [formats, setFormats] = useState<VideoData["format"] | null>(null);
  const [fmt, setFmt] = useState<Fmt>(defaultFmt);
  const [selectedItag, setSelectedItag] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) router.push("/");
  }, [videoUrl, router]);

  useEffect(() => {
    if (!videoUrl) return;
    setError(null);
    setDownloadError(null);
    setIsLoading(true);
    setFmt(defaultFmt);

    getVideoInfos(videoUrl)
      .then((value) => {
        if (value.error) {
          const errorMessage =
            value.error === "AGE_RESTRICTED" ? t("errorAgeRestricted") : value.error;
          track("error_displayed", { type: "video_load_error", message: value.error });
          setError(errorMessage);
          setIsLoading(false);
          return;
        }
        setVideoData(value.video_details);
        setFormats(value.format);
        if (source === "youtube" && value.format?.[0]?.itag) {
          setSelectedItag(value.format[0].itag.toString());
        }
        setIsLoading(false);
        track("video_loaded", {
          source,
          title:         value.video_details.title,
          author:        value.video_details.author,
          duration_s:    Number(value.video_details.duration),
          format_count:  value.format?.length ?? 0,
          ...(source === "youtube" && { video_id: extractYtId(videoUrl as string) }),
        });
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : "fetch_failed";
        track("error_displayed", { type: "fetch_error", message });
        setError(t("errorFetch"));
        setIsLoading(false);
      });
  }, [videoUrl, t, source, defaultFmt]);

  useEffect(() => {
    if (!isDownloading) return;
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setLoadProgress(90 * (1 - Math.exp(-elapsed / 10000)));
    }, 25);
    return () => clearInterval(iv);
  }, [isDownloading]);

  const handleFmtChange = (next: Fmt) => {
    if (next === fmt) return;
    track("format_changed", { from: fmt, to: next, source });
    setFmt(next);
  };

  const handleDownload = async () => {
    if (!videoUrl || !videoData) return;
    setDownloadError(null);
    setIsDownloading(true);
    setLoadProgress(0);

    const videoId = source === "youtube" ? extractYtId(videoUrl) : videoUrl;
    const quality =
      fmt === "mp4"
        ? (formats?.find((f) => f.itag.toString() === selectedItag)?.qualityLabel ?? selectedItag)
        : fmt;

    track("download_started", { video_id: videoId, title: videoData.title, format: fmt, quality, source });

    if (fmt === "library-ready") {
      track("library_ready_used", { video_id: videoId, title: videoData.title });
    }

    try {
      const encoded = encodeURIComponent(videoUrl);
      let apiUrl: string;

      if (fmt === "mp3")                apiUrl = `/api/download/audio?url=${encoded}`;
      else if (fmt === "library-ready") apiUrl = `/api/download/audio-library-ready?url=${encoded}`;
      else if (fmt === "mp4")           apiUrl = `/api/download/video?url=${encoded}&quality=${selectedItag}`;
      else if (fmt === "tiktok-watermark")    apiUrl = `/api/download/tiktok-video?url=${encoded}&quality=${TIKTOK_ITAG.WATERMARK}`;
      else if (fmt === "tiktok-no-watermark") apiUrl = `/api/download/tiktok-video?url=${encoded}&quality=${TIKTOK_ITAG.NO_WATERMARK}`;
      else /* tiktok-audio */                 apiUrl = `/api/download/tiktok-audio?url=${encoded}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Download failed");

      setLoadProgress(100);

      const ext = ["mp4", "tiktok-watermark", "tiktok-no-watermark"].includes(fmt) ? "mp4" : "mp3";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoData.title}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      const reason = e instanceof Error ? e.message : "unknown";
      track("download_failed", { video_id: videoId, reason, source });
      track("error_displayed", { type: "download_error", message: t("errorDownload") });
      setDownloadError(t("errorDownload"));
    }
    setIsDownloading(false);
  };

  if (isLoading) return <VideoLoading />;

  if (error || !videoData) {
    return (
      <div className="mx-auto flex min-h-48 w-full max-w-5xl items-center justify-center rounded-2xl border-2 border-dashed border-stroy-800">
        <p className="text-center font-bold text-white">ERROR: {error ?? "An error occurred"}</p>
      </div>
    );
  }

  const currentFmt = FORMAT_TABS.find((tab) => tab.id === fmt) ?? FORMAT_TABS[0];

  return (
    <div className="mx-auto max-w-270">
      {/* ── Result card ── */}
      <div className="overflow-hidden rounded-2xl border border-white/6 bg-stroy-800 md:grid md:grid-cols-[440px_1fr]">
        {/* Thumbnail */}
        <div className="relative flex min-h-70 items-center justify-center bg-stroy-900">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.025)_0_14px,transparent_14px_28px)]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {videoData.thumbnail ? (
            <img
              src={videoData.thumbnail}
              alt={t("thumbnailAlt", { title: videoData.title })}
              className="relative z-10 h-full w-full object-cover"
            />
          ) : (
            <Film size={48} className="relative z-10 text-stroy-400" />
          )}
          {videoData.author && (
            <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px]">
              <span className="size-4.5 rounded-full bg-white/20" />
              <span>{videoData.author}</span>
            </div>
          )}
          {videoData.duration && (
            <div className="absolute bottom-3.5 right-3.5 z-20 rounded bg-black/70 px-2 py-1 font-mono text-xs tracking-wider">
              {videoData.duration}s
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-8">
          <div>
            <h2 className="mb-2 text-xl font-bold leading-snug tracking-tight line-clamp-2">
              {videoData.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/60">
              <span className="font-medium">{videoData.author}</span>
            </div>
          </div>

          <div className="h-px bg-white/8" />

          {/* Format picker */}
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
              {t("chooseFormat")}
            </p>
            <div className="flex gap-2 rounded-2xl border border-white/6 bg-stroy-950 p-1.5">
              {FORMAT_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFmtChange(tab.id)}
                  className={cn(
                    "flex flex-1 flex-col items-start justify-center gap-1 rounded-xl px-2 py-2.5 text-left transition-all sm:px-3.5 sm:py-3",
                    fmt === tab.id
                      ? "bg-stroy-500 text-white"
                      : "text-white/65 hover:bg-white/4 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-[12px] font-bold sm:gap-2 sm:text-[13px]">
                    <tab.Icon size={13} />
                    {tab.label}
                  </span>
                  <span className="hidden font-mono text-[11px] opacity-75 sm:block">
                    {tab.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* MP4 quality selector — YouTube only */}
          {fmt === "mp4" && formats && formats.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                {t("videoQuality")}
              </p>
              <Select
                value={selectedItag}
                onValueChange={(value) => {
                  const label =
                    formats?.find((f) => f.itag.toString() === value)?.qualityLabel ?? value;
                  track("quality_changed", { quality_label: label });
                  setSelectedItag(value);
                }}
                disabled={isDownloading}
              >
                <SelectTrigger className="w-full border-white/10 bg-stroy-950 text-white">
                  <SelectValue placeholder={t("selectQuality")} />
                </SelectTrigger>
                <SelectContent>
                  {formats
                    .filter((f) => f.qualityLabel && f.itag)
                    .map((f) => (
                      <SelectItem key={f.itag} value={f.itag.toString()}>
                        {f.qualityLabel}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Library Ready callout — YouTube only */}
          {fmt === "library-ready" && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-stroy-700 p-4 sm:grid sm:grid-cols-[56px_1fr_auto] sm:items-center sm:gap-4">
              <div className="hidden size-14 items-center justify-center rounded-lg border border-white/10 bg-stroy-900 text-2xl text-white/40 sm:flex">
                ♪
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">{t("libraryReadyCalloutTitle")}</p>
                <p className="text-xs leading-snug text-white/70">{t("libraryReadyCalloutDesc")}</p>
              </div>
              <div className="flex flex-row gap-3 font-mono text-[10px] text-white/55 sm:flex-col sm:gap-1 sm:whitespace-nowrap">
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  {t("libraryReadyCoverArt")}
                </span>
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  {t("libraryReadyId3")}
                </span>
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  {t("libraryReadyLyrics")}
                </span>
              </div>
            </div>
          )}

          {/* Download button / progress */}
          {isDownloading ? (
            <div className="flex flex-col gap-3">
              <Progress value={loadProgress} className="h-2" />
              <p className="text-center text-xs text-white/55 italic">
                {loadProgress < 100 ? t("converting") : t("saving")}
              </p>
            </div>
          ) : downloadError ? (
            <div className="flex flex-col gap-3">
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-white/90">
                {downloadError}
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/6 px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                <Download size={18} />
                {t("retryButton", { format: currentFmt.label })}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-stroy-500 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-stroy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Download size={18} />
              {t("downloadButton", { format: currentFmt.label })}
            </button>
          )}

          <p className="text-center text-xs italic text-white/50">{t("disclaimer")}</p>
        </div>
      </div>

      {/* ── Educational cards ── */}
      <div className="mt-10 grid max-w-270 gap-4 md:grid-cols-3">
        {EDU_CARDS.map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/8 bg-white/[0.025] p-6">
            <h4 className="mb-2 text-sm font-bold tracking-tight">{c.title}</h4>
            <p className="text-sm leading-relaxed text-white/70">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
