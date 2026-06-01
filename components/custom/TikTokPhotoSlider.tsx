"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import type { TikTokPhotoData } from "@/lib/types";

interface Props {
  data: TikTokPhotoData;
}

export function TikTokPhotoSlider({ data }: Props) {
  const t = useTranslations("tiktokPhoto");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const handleDownload = async (imageUrl: string, index: number) => {
    setDownloadError(null);
    setDownloadingIndex(index);
    track("download_started", {
      source: "tiktok",
      format: "tiktok-photo",
      title: data.video_details.title,
      quality: `photo-${index}`,
    });
    try {
      const res = await fetch(
        `/api/download/tiktok-image?url=${encodeURIComponent(imageUrl)}&index=${index}`
      );
      if (!res.ok) throw new Error("Download failed");

      const disposition = res.headers.get("content-disposition");
      const cdFilename = disposition?.match(/filename="([^"]+)"/)?.[1];
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cdFilename ?? `tiktok-photo-${index}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      track("download_completed", { source: "tiktok", format: "tiktok-photo" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown";
      track("download_failed", { source: "tiktok", format: "tiktok-photo", reason });
      setDownloadError(t("errorDownload"));
    }
    setDownloadingIndex(null);
  };

  const currentImage = data.images[selectedIndex];
  const isDownloadingCurrent = downloadingIndex === selectedIndex + 1;
  const totalPhotos = data.images.length;

  return (
    <div className="mx-auto max-w-270">
      <div className="overflow-hidden rounded-2xl border border-white/6 bg-stroy-800">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 border-b border-white/6 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
            <ImageIcon size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-snug tracking-tight line-clamp-1">
              {data.video_details.title || "TikTok Photos"}
            </h2>
            <p className="text-sm text-white/60">
              {data.video_details.author && (
                <span className="mr-2 font-medium">{data.video_details.author}</span>
              )}
              {t("photoCount", { count: totalPhotos })}
            </p>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div className="relative bg-stroy-900">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {data.images.map((img, i) => (
                <div
                  key={img.url}
                  className="relative min-w-0 flex-[0_0_100%]"
                  aria-hidden={i !== selectedIndex ? "true" : "false"}
                >
                  <div className="flex max-h-[70vh] min-h-72 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {/* biome-ignore lint/performance/noImgElement: external TikTok image URLs are not compatible with next/image */}
                    <img
                      src={img.url}
                      alt={`${i + 1} of ${totalPhotos}`}
                      className="max-h-[70vh] w-full object-contain"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                disabled={selectedIndex === 0}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={selectedIndex === totalPhotos - 1}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Counter badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white">
            {t("photoCounter", { current: selectedIndex + 1, total: totalPhotos })}
          </div>
        </div>

        {/* ── Download current photo ── */}
        <div className="flex flex-col gap-3 p-6">
          {downloadError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-white/90">
              {downloadError}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleDownload(currentImage.url, selectedIndex + 1)}
            disabled={downloadingIndex !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-stroy-500 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-stroy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            {isDownloadingCurrent ? t("downloading") : t("downloadPhoto", { n: selectedIndex + 1 })}
          </button>
        </div>

        {/* ── Thumbnail strip ── */}
        {totalPhotos > 1 && (
          <div className="flex gap-2 overflow-x-auto px-6 pb-6 pt-0">
            {data.images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => {
                  emblaApi?.scrollTo(i);
                  setSelectedIndex(i);
                }}
                aria-label={`Go to photo ${i + 1}`}
                className={`relative aspect-square h-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === selectedIndex ? "border-stroy-300" : "border-white/10 hover:border-white/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* biome-ignore lint/performance/noImgElement: external TikTok image URLs are not compatible with next/image */}
                <img
                  src={img.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {downloadingIndex === i + 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
