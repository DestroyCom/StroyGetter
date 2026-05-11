"use client";

import { Disc3, Download, Film, Music } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { VideoData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VideoLoading } from "./VideoLoading";

type Fmt = "mp4" | "mp3" | "library-ready";

const FORMAT_TABS: { id: Fmt; label: string; sub: string; Icon: typeof Film }[] = [
  { id: "mp4", label: "MP4 video", sub: "H.264 · source resolution", Icon: Film },
  { id: "mp3", label: "MP3 audio", sub: "190 kbps", Icon: Music },
  { id: "library-ready", label: "Library Ready", sub: "MP3 + tags + lyrics", Icon: Disc3 },
];

const EDU_CARDS = [
  {
    title: "What's Library Ready?",
    desc: "MP3 with embedded cover art, ID3 tags (title, artist, album, year) and synced lyrics. Drops cleanly into Apple Music, Plex, Rekordbox.",
  },
  {
    title: "Conversion taking a while?",
    desc: "We fetch the source from YouTube live and tag it on the fly. Library Ready adds 15–25s because we look up metadata and high-res cover art.",
  },
  {
    title: "MP4 vs MP3 vs Library Ready",
    desc: "MP4 keeps the picture. MP3 keeps only the sound. Library Ready is MP3 + everything your music app needs to display the track properly.",
  },
];

export const VideoSelect = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");

  const [videoData, setVideoData] = useState<VideoData["video_details"] | null>(null);
  const [formats, setFormats] = useState<VideoData["format"] | null>(null);
  const [fmt, setFmt] = useState<Fmt>("library-ready");
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

    getVideoInfos(videoUrl)
      .then((value) => {
        if (value.error) {
          setError(value.error);
          setIsLoading(false);
          return;
        }
        setVideoData(value.video_details);
        setFormats(value.format);
        if (value.format?.[0]?.itag) setSelectedItag(value.format[0].itag.toString());
        setIsLoading(false);
      })
      .catch(() => {
        setError("An error occurred while fetching video info.");
        setIsLoading(false);
      });
  }, [videoUrl]);

  useEffect(() => {
    if (!isDownloading) return;
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      setLoadProgress(90 * (1 - Math.exp(-elapsed / 10000)));
    }, 25);
    return () => clearInterval(iv);
  }, [isDownloading]);

  const handleDownload = async () => {
    if (!videoUrl || !videoData) return;
    setDownloadError(null);
    setIsDownloading(true);
    setLoadProgress(0);

    try {
      const encoded = encodeURIComponent(videoUrl);
      let apiUrl: string;
      if (fmt === "mp3") apiUrl = `/api/download/audio?url=${encoded}`;
      else if (fmt === "library-ready") apiUrl = `/api/download/audio-library-ready?url=${encoded}`;
      else apiUrl = `/api/download/video?url=${encoded}&quality=${selectedItag}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Download failed");

      // Server done — jump to 100% while the blob transfers to the browser
      setLoadProgress(100);

      const ext = fmt === "mp4" ? "mp4" : "mp3";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${videoData.title}.${ext}`;
      a.click();
      // Give the browser 1 s to start the download before releasing the object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError("An error occurred while downloading. Please try again.");
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

  const currentFmt = FORMAT_TABS.find((t) => t.id === fmt)!;

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
              alt={`Thumbnail of ${videoData.title}`}
              className="relative z-10 h-full w-full object-cover"
            />
          ) : (
            <Film size={48} className="relative z-10 text-stroy-400" />
          )}
          {/* Channel pill */}
          {videoData.author && (
            <div className="absolute left-3.5 top-3.5 z-20 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px]">
              <span className="size-4.5 rounded-full bg-white/20" />
              <span>{videoData.author}</span>
            </div>
          )}
          {/* Duration badge */}
          {videoData.duration && (
            <div className="absolute bottom-3.5 right-3.5 z-20 rounded bg-black/70 px-2 py-1 font-mono text-xs tracking-wider">
              {videoData.duration}s
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-8">
          {/* Video info */}
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
              Choose format
            </p>
            <div className="flex gap-2 rounded-2xl border border-white/6 bg-stroy-950 p-1.5">
              {FORMAT_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFmt(t.id)}
                  className={cn(
                    "flex flex-1 flex-col items-start gap-1 rounded-xl px-3.5 py-3 text-left transition-all",
                    fmt === t.id
                      ? "bg-stroy-500 text-white"
                      : "text-white/65 hover:bg-white/4 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2 text-[13px] font-bold">
                    <t.Icon size={14} />
                    {t.label}
                  </span>
                  <span className="font-mono text-[11px] opacity-75">{t.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* MP4 quality selector */}
          {fmt === "mp4" && formats && formats.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
                Video quality
              </p>
              <Select value={selectedItag} onValueChange={setSelectedItag} disabled={isDownloading}>
                <SelectTrigger className="w-full border-white/10 bg-stroy-950 text-white">
                  <SelectValue placeholder="Select quality" />
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

          {/* Library Ready callout */}
          {fmt === "library-ready" && (
            <div className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-xl border border-white/10 bg-stroy-700 p-4">
              <div className="flex size-14 items-center justify-center rounded-lg border border-white/10 bg-stroy-900 text-2xl text-white/40">
                ♪
              </div>
              <div>
                <p className="mb-1 text-sm font-bold">
                  Library Ready · metadata from YouTube Music
                </p>
                <p className="text-xs leading-snug text-white/70">
                  Cover art 1400×1400, ID3 tags, synced lyrics · adds ~20s to processing.
                </p>
              </div>
              <div className="flex flex-col gap-1 whitespace-nowrap font-mono text-[10px] text-white/55">
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  Cover art
                </span>
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  ID3 tags
                </span>
                <span className="before:mr-1 before:text-stroy-200 before:content-['✓']">
                  Lyrics
                </span>
              </div>
            </div>
          )}

          {/* Download button / progress */}
          {isDownloading ? (
            <div className="flex flex-col gap-3">
              <Progress value={loadProgress} className="h-2" />
              <p className="text-center text-xs text-white/55 italic">
                {loadProgress < 100
                  ? "Converting… please wait and do not close the tab."
                  : "Saving to your device…"}
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
                Retry · {currentFmt.label}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-stroy-500 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-stroy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Download size={18} />
              Download · {currentFmt.label}
            </button>
          )}

          <p className="text-center text-xs italic text-white/50">
            Streamed directly to your device. Nothing stored on our servers. Only download content
            you own or have the rights to.
          </p>
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
