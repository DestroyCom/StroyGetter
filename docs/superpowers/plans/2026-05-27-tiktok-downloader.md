# TikTok Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TikTok video downloading (with/without watermark + audio) to StroyGetter, with dedicated `/tiktok` and `/youtube` SEO pages, auto-detecting source on all pages.

**Architecture:** Source detection (`detectSource`) determines YouTube vs TikTok at the entry point; `/fetch` page passes `source` prop to `VideoSelect` which renders platform-appropriate tabs; two new API routes handle TikTok downloads directly via yt-dlp (formats are already muxed — no FFmpeg merge needed for video).

**Tech Stack:** Next.js 16, yt-dlp (existing binary), FFmpeg (audio extraction), next-intl, Prisma/SQLite, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md`

---

## File Map

**Create:**
- `functions/resolveVideoUrl.ts` — server action replacing `getYoutubeUrl.ts`
- `functions/fetchTiktokInfos.ts` — TikTok metadata via yt-dlp dump-json
- `app/api/download/tiktok-video/route.ts` — muxed TikTok video download
- `app/api/download/tiktok-audio/route.ts` — TikTok audio extraction via FFmpeg
- `app/[locale]/tiktok/page.tsx` — TikTok SEO landing page
- `app/[locale]/youtube/page.tsx` — YouTube SEO landing page
- `__tests__/integration/tiktok-fetch.test.ts` — integration test (real network)

**Modify:**
- `lib/types.ts` — add `TIKTOK_ITAG` constants
- `lib/serverUtils.ts` — add `tiktok_validate`, `detectSource`
- `__tests__/lib/serverUtils.test.ts` — add tiktok_validate + detectSource tests
- `functions/fetchVideoinfos.ts` — make source-aware, call fetchTiktokInfos for TikTok
- `components/custom/GetterInput.tsx` — use `resolveVideoUrl`
- `components/custom/VideoSelect.tsx` — accept `source` prop, render TikTok tabs
- `app/[locale]/fetch/page.tsx` — read searchParams, pass `source` to VideoSelect
- `app/[locale]/page.tsx` — update home wording for YouTube+TikTok
- `app/sitemap.ts` — add `/tiktok` and `/youtube`
- `messages/en.json`, `messages/fr-FR.json`, `messages/es-419.json`, `messages/pt-BR.json`

---

## Task 1: Add TIKTOK_ITAG constants to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add TIKTOK_ITAG export**

Open `lib/types.ts` and append after the existing exports:

```ts
export const TIKTOK_ITAG = {
  WATERMARK:    301,
  NO_WATERMARK: 302,
  AUDIO:        303,
} as const;

export type TikTokItag = typeof TIKTOK_ITAG[keyof typeof TIKTOK_ITAG];
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(tiktok): add TIKTOK_ITAG sentinel constants"
```

---

## Task 2: URL validation — `tiktok_validate` + `detectSource` (TDD)

**Files:**
- Modify: `lib/serverUtils.ts`
- Modify: `__tests__/lib/serverUtils.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `__tests__/lib/serverUtils.test.ts`:

```ts
import { tiktok_validate, detectSource } from "@/lib/serverUtils";

describe("tiktok_validate", () => {
  it("returns 'video' for a standard tiktok.com URL", () => {
    expect(tiktok_validate("https://www.tiktok.com/@honor_france/video/7568900679792708896")).toBe("video");
  });
  it("returns 'video' without www", () => {
    expect(tiktok_validate("https://tiktok.com/@user/video/1234567890123456789")).toBe("video");
  });
  it("returns 'video' for a vm.tiktok.com short URL", () => {
    expect(tiktok_validate("https://vm.tiktok.com/ZMkABCDEF/")).toBe("video");
  });
  it("returns false for a YouTube URL", () => {
    expect(tiktok_validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(false);
  });
  it("returns false for a plain search query", () => {
    expect(tiktok_validate("tiktok dance")).toBe(false);
  });
  it("returns false for http (not https)", () => {
    expect(tiktok_validate("http://www.tiktok.com/@user/video/123")).toBe(false);
  });
});

describe("detectSource", () => {
  it("returns 'youtube' for a YouTube URL", () => {
    expect(detectSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
  });
  it("returns 'youtube' for a youtu.be URL", () => {
    expect(detectSource("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });
  it("returns 'tiktok' for a tiktok.com URL", () => {
    expect(detectSource("https://www.tiktok.com/@user/video/123456789")).toBe("tiktok");
  });
  it("returns 'tiktok' for a vm.tiktok.com URL", () => {
    expect(detectSource("https://vm.tiktok.com/ZMkABCDEF/")).toBe("tiktok");
  });
  it("returns null for an unknown URL", () => {
    expect(detectSource("https://example.com/video")).toBeNull();
  });
  it("returns null for plain text", () => {
    expect(detectSource("rick roll")).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
pnpm vitest run __tests__/lib/serverUtils.test.ts 2>&1 | tail -20
```
Expected: fails with "tiktok_validate is not exported" or similar.

- [ ] **Step 3: Implement `tiktok_validate` and `detectSource` in `lib/serverUtils.ts`**

Add after the `yt_validate` function (around line 106):

```ts
const tiktok_video_pattern =
  /^https:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/;
const tiktok_short_pattern =
  /^https:\/\/vm\.tiktok\.com\/[\w]+\/?$/;

export function tiktok_validate(url: string): "video" | false {
  const u = url.trim();
  if (tiktok_video_pattern.test(u) || tiktok_short_pattern.test(u)) return "video";
  return false;
}

export function detectSource(url: string): "youtube" | "tiktok" | null {
  if (yt_validate(url)) return "youtube";
  if (tiktok_validate(url)) return "tiktok";
  return null;
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
pnpm vitest run __tests__/lib/serverUtils.test.ts 2>&1 | tail -20
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/serverUtils.ts __tests__/lib/serverUtils.test.ts
git commit -m "feat(tiktok): add tiktok_validate and detectSource with tests"
```

---

## Task 3: `resolveVideoUrl` server action

**Files:**
- Create: `functions/resolveVideoUrl.ts`

- [ ] **Step 1: Create the file**

```ts
// functions/resolveVideoUrl.ts
"use server";

import { getInnertube } from "@/lib/innertube";
import { detectSource, tiktok_validate, yt_validate } from "@/lib/serverUtils";

/**
 * Resolves a raw user input to a canonical video URL.
 * - Valid YouTube URL → returned as-is
 * - Valid TikTok URL  → returned as-is
 * - Anything else    → treated as a YouTube search query via innertube
 */
export const resolveVideoUrl = async (query: string): Promise<string> => {
  const trimmed = query.trim();

  if (yt_validate(trimmed)) return trimmed;
  if (tiktok_validate(trimmed)) return trimmed;

  // Fall back to YouTube search
  const innertube = await getInnertube();
  const results = await innertube.search(trimmed, { type: "video" });

  const firstVideo = results.results?.find((r) => r.type === "Video") as
    | { id: string }
    | undefined;

  if (!firstVideo?.id) {
    throw new Error("No video found");
  }

  return `https://www.youtube.com/watch?v=${firstVideo.id}`;
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add functions/resolveVideoUrl.ts
git commit -m "feat(tiktok): add resolveVideoUrl server action (handles YouTube + TikTok)"
```

---

## Task 4: Update `GetterInput` to use `resolveVideoUrl`

**Files:**
- Modify: `components/custom/GetterInput.tsx`

- [ ] **Step 1: Replace the import and update analytics call**

In `components/custom/GetterInput.tsx`:

Replace:
```ts
import { searchQuery } from "@/functions/getYoutubeUrl";
```
With:
```ts
import { resolveVideoUrl } from "@/functions/resolveVideoUrl";
```

Replace the `isYoutubeUrl` helper and its usage in `submitUrl`:
```ts
const isYoutubeUrl = (v: string): boolean => v.includes("youtube.com") || v.includes("youtu.be");
```
With:
```ts
const isKnownVideoUrl = (v: string): boolean =>
  v.includes("youtube.com") || v.includes("youtu.be") || v.includes("tiktok.com");
```

In `submitUrl`, update the track call:
```ts
track("search", { query: value, is_url: isKnownVideoUrl(value), source });
```

Replace the call to `searchQuery`:
```ts
const resolvedUrl = await resolveVideoUrl(value);
```

- [ ] **Step 2: Verify dev server starts (quick sanity check)**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/custom/GetterInput.tsx
git commit -m "feat(tiktok): update GetterInput to use resolveVideoUrl"
```

---

## Task 5: TikTok metadata fetching

**Files:**
- Create: `functions/fetchTiktokInfos.ts`
- Modify: `functions/fetchVideoinfos.ts`

- [ ] **Step 1: Create `functions/fetchTiktokInfos.ts`**

```ts
// functions/fetchTiktokInfos.ts
"use server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { sanitizeFilename, tiktok_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { TIKTOK_ITAG } from "@/lib/types";
import { selectYtDlpPath } from "@/lib/serverUtils";
import { getCookiesOpt } from "@/lib/ytdlp-cookies";

const log = logger.child({ module: "fetch-tiktok-infos" });

const TIKTOK_FORMATS: FormatData[] = [
  { itag: TIKTOK_ITAG.WATERMARK,    qualityLabel: "Video (with watermark)" },
  { itag: TIKTOK_ITAG.NO_WATERMARK, qualityLabel: "Video (no watermark)"   },
  { itag: TIKTOK_ITAG.AUDIO,        qualityLabel: "Audio only (MP3)"       },
];

type YtDlpDump = {
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
};

export const getTikTokInfos = async (url: string) => {
  if (!tiktok_validate(url)) {
    log.warn({ url }, "URL validation failed — not a valid TikTok URL");
    return { error: "Invalid URL" };
  }

  log.info({ url }, "Fetching TikTok video info");
  const startTime = Date.now();

  const ytdl = selectYtDlpPath();

  let dump: YtDlpDump;
  try {
    dump = (await ytdl(url, {
      dumpJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      ...getCookiesOpt(),
    })) as YtDlpDump;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch TikTok info";
    log.error({ url, err, durationMs: Date.now() - startTime }, `TikTok info fetch failed: ${msg}`);
    return { error: msg };
  }

  const videoData: VideoData = {
    video_details: {
      title:       dump.title       ?? "Unknown title",
      description: "",
      duration:    String(dump.duration ?? 0),
      thumbnail:   dump.thumbnail   ?? "",
      author:      dump.uploader    ?? "",
    },
    format: TIKTOK_FORMATS,
  };

  log.info(
    { url, title: dump.title, durationSec: dump.duration, durationMs: Date.now() - startTime },
    "TikTok info fetched successfully"
  );

  // Upsert video in DB for tracking (non-fatal)
  try {
    const existing = await prisma.video.findUnique({ where: { url } });
    if (!existing) {
      await prisma.video.create({ data: { title: dump.title ?? "Unknown", url } });
      log.debug({ url, title: dump.title }, "TikTok video record created in DB");
    }
  } catch (dbErr) {
    log.warn({ url, err: dbErr }, "Failed to upsert TikTok video in DB — non-fatal");
  }

  return JSON.parse(JSON.stringify(videoData));
};
```

- [ ] **Step 2: Update `functions/fetchVideoinfos.ts` to be source-aware**

Replace the entire file content:

```ts
"use server";

import { extractVideoId, getInnertube } from "@/lib/innertube";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { detectSource, yt_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";
import { getTikTokInfos } from "./fetchTiktokInfos";

const log = logger.child({ module: "fetch-video-infos" });

export const getVideoInfos = async (url: string) => {
  const source = detectSource(url);

  if (source === "tiktok") {
    return getTikTokInfos(url);
  }

  // YouTube path (existing logic)
  if (!yt_validate(url)) {
    log.warn({ url }, "URL validation failed — not a valid YouTube video URL");
    return { error: "Invalid URL" };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    log.warn({ url }, "Could not extract video ID from URL");
    return { error: "Invalid URL" };
  }

  log.info({ videoId, url }, "Fetching video info");
  const startTime = Date.now();

  const innertube = await getInnertube();

  let basicInfo: Awaited<ReturnType<typeof innertube.getBasicInfo>>;
  let formats: Awaited<ReturnType<typeof getVideoFormats>>;

  try {
    [basicInfo, formats] = await Promise.all([
      innertube.getBasicInfo(videoId),
      getVideoFormats(url),
    ]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch video info";
    const ytErr = msg.match(/ERROR: \[youtube\] [^:]+: (.+)/)?.[1];
    const finalError = ytErr ?? msg;
    log.error(
      { videoId, url, err, durationMs: Date.now() - startTime },
      `Video info fetch failed: ${finalError}`
    );
    if (/sign in to confirm your age/i.test(finalError)) {
      return { error: "AGE_RESTRICTED" };
    }
    return { error: finalError };
  }

  const details = basicInfo.basic_info;
  const thumbnails = details.thumbnail ?? [];
  const bestThumbnail = thumbnails.reduce(
    (best, t) =>
      (t.width ?? 0) * (t.height ?? 0) > (best.width ?? 0) * (best.height ?? 0) ? t : best,
    thumbnails[0] ?? { url: "" }
  );

  const videoData: VideoData = {
    video_details: {
      title:       details.title             ?? "",
      description: details.short_description ?? "",
      duration:    String(details.duration   ?? 0),
      thumbnail:   bestThumbnail.url         ?? "",
      author:      details.author            ?? "",
    },
    format: formats as FormatData[],
  };

  log.info(
    {
      videoId,
      title:        details.title,
      durationSec:  details.duration,
      formatsCount: formats.length,
      durationMs:   Date.now() - startTime,
    },
    "Video info fetched successfully"
  );

  try {
    const dbVideo = await prisma.video.findUnique({ where: { url } });
    if (!dbVideo) {
      await prisma.video.create({ data: { title: details.title ?? "Unknown", url } });
      log.debug({ videoId, title: details.title }, "Video record created in DB");
    } else {
      log.debug({ videoId }, "Video already exists in DB — skipping create");
    }
  } catch (dbErr) {
    log.warn({ videoId, err: dbErr }, "Failed to upsert video in DB — non-fatal");
  }

  return JSON.parse(JSON.stringify(videoData));
};
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add functions/fetchTiktokInfos.ts functions/fetchVideoinfos.ts
git commit -m "feat(tiktok): add getTikTokInfos helper, make getVideoInfos source-aware"
```

---

## Task 6: Source-aware `/fetch` page + `VideoSelect` TikTok tabs

**Files:**
- Modify: `app/[locale]/fetch/page.tsx`
- Modify: `components/custom/VideoSelect.tsx`

- [ ] **Step 1: Update `/fetch` page to pass `source` prop**

Replace full content of `app/[locale]/fetch/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { VideoLoading } from "@/components/custom/VideoLoading";
import { VideoSelect } from "@/components/custom/VideoSelect";
import { detectSource } from "@/lib/serverUtils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("fetchTitle"),
    robots: { index: false },
  };
}

export default async function QualityVideoSelection({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ videoUrl?: string }>;
}) {
  const { locale } = await params;
  const { videoUrl } = await searchParams;
  setRequestLocale(locale);

  const source = videoUrl ? (detectSource(videoUrl) ?? "youtube") : "youtube";

  return (
    <section className="flex-1 bg-stroy-500 px-4 py-8 md:px-14">
      <div className="mx-auto mb-10 max-w-5xl">
        <Suspense fallback={<SkeletonInput />}>
          <GetterInput />
        </Suspense>
      </div>

      <Suspense fallback={<VideoLoading />}>
        <VideoSelect source={source} />
      </Suspense>
    </section>
  );
}
```

- [ ] **Step 2: Update `VideoSelect` to accept `source` and render TikTok tabs**

Replace the full content of `components/custom/VideoSelect.tsx`:

```tsx
"use client";

import { Disc3, Download, Film, Loader2, Music } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
```

- [ ] **Step 3: Add new i18n keys for TikTok tabs to all 4 locale files**

In `messages/en.json`, inside the `"videoSelect"` object, add after `"formatMp3Sub"`:
```json
"formatTiktokNoWatermark": "No watermark",
"formatTiktokNoWatermarkSub": "MP4 · clean",
"formatTiktokWatermark": "With watermark",
"formatTiktokWatermarkSub": "MP4 · with logo",
"formatTiktokAudio": "Audio only",
"formatTiktokAudioSub": "MP3 · 192 kbps"
```

In `messages/fr-FR.json`, inside `"videoSelect"`, add after `"formatMp3Sub"`:
```json
"formatTiktokNoWatermark": "Sans filigrane",
"formatTiktokNoWatermarkSub": "MP4 · propre",
"formatTiktokWatermark": "Avec filigrane",
"formatTiktokWatermarkSub": "MP4 · avec logo",
"formatTiktokAudio": "Audio seul",
"formatTiktokAudioSub": "MP3 · 192 kbps"
```

In `messages/es-419.json`, inside `"videoSelect"`, add after `"formatMp3Sub"`:
```json
"formatTiktokNoWatermark": "Sin marca de agua",
"formatTiktokNoWatermarkSub": "MP4 · limpio",
"formatTiktokWatermark": "Con marca de agua",
"formatTiktokWatermarkSub": "MP4 · con logo",
"formatTiktokAudio": "Solo audio",
"formatTiktokAudioSub": "MP3 · 192 kbps"
```

In `messages/pt-BR.json`, inside `"videoSelect"`, add after `"formatMp3Sub"`:
```json
"formatTiktokNoWatermark": "Sem marca d'água",
"formatTiktokNoWatermarkSub": "MP4 · limpo",
"formatTiktokWatermark": "Com marca d'água",
"formatTiktokWatermarkSub": "MP4 · com logo",
"formatTiktokAudio": "Só áudio",
"formatTiktokAudioSub": "MP3 · 192 kbps"
```

Also update `"getterInput"."placeholder"` in all 4 locales:
- `en.json`: `"Paste a YouTube or TikTok URL, or search…"`
- `fr-FR.json`: `"Collez une URL YouTube ou TikTok, ou lancez une recherche…"`
- `es-419.json`: `"Pega una URL de YouTube o TikTok, o busca…"`
- `pt-BR.json`: `"Cole uma URL do YouTube ou TikTok, ou pesquise…"`

- [ ] **Step 4: TypeScript + lint check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/fetch/page.tsx components/custom/VideoSelect.tsx \
  messages/en.json messages/fr-FR.json messages/es-419.json messages/pt-BR.json
git commit -m "feat(tiktok): source-aware VideoSelect with TikTok tabs + i18n keys"
```

---

## Task 7: TikTok video download API route

**Files:**
- Create: `app/api/download/tiktok-video/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/download/tiktok-video/route.ts
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { prisma } from "@/lib/prisma";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { sanitizeFilename, tiktok_validate } from "@/lib/serverUtils";
import { TIKTOK_ITAG } from "@/lib/types";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import { getCookiesArgs } from "@/lib/ytdlp-cookies";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

const FORMAT_MAP: Record<number, string> = {
  [TIKTOK_ITAG.WATERMARK]:    "download",
  [TIKTOK_ITAG.NO_WATERMARK]: "best[vcodec^=h264][format_id!=download]",
};

const QUALITY_LABEL: Record<number, string> = {
  [TIKTOK_ITAG.WATERMARK]:    "tiktok-watermark",
  [TIKTOK_ITAG.NO_WATERMARK]: "tiktok-no-watermark",
};

const _inFlight = new Map<string, Promise<string>>();

function downloadToFile(url: string, formatSelector: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("tiktok-video-download");
    const bin = getYtDlpBinaryPath();
    const cookiesArgs = getCookiesArgs();

    const proc = spawn(bin, [
      "--no-check-certificates",
      "--no-warnings",
      "--no-playlist",
      "--format", formatSelector,
      "--output", outputPath,
      ...cookiesArgs,
      url,
    ]);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`yt-dlp timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`));
    }, DOWNLOAD_TIMEOUT_MS);

    proc.on("error", (err) => { clearTimeout(timeout); reject(err); });
    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        log.error({ exitCode: code, stderr: stderr.split("\n").slice(-3).join(" | ") }, "yt-dlp exited with error");
        reject(new Error(`yt-dlp exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("tiktok-video");
    const requestStart = Date.now();

    const params = new URL(request.url).searchParams;
    const url = params.get("url");
    const qualityParam = params.get("quality");

    log.info({ url, quality: qualityParam }, "TikTok video download request");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url || !qualityParam) {
      return new Response("Missing url or quality parameter", { status: 400 });
    }

    if (!tiktok_validate(url)) {
      log.warn({ url }, "Invalid TikTok URL");
      return new Response("Invalid TikTok URL", { status: 400 });
    }

    const quality = parseInt(qualityParam, 10);
    const formatSelector = FORMAT_MAP[quality];
    if (!formatSelector) {
      return new Response("Invalid quality parameter", { status: 400 });
    }

    const qualityLabel = QUALITY_LABEL[quality];
    const cacheKey = `${url}:${qualityLabel}`;

    // Find/create Video record
    let video = await prisma.video.findUnique({ where: { url } });
    if (!video) {
      // title will be filled on first download; use URL as fallback
      video = await prisma.video.create({ data: { title: url, url } });
    }

    const resolveFilePath = async (): Promise<string> => {
      const cached = await prisma.file.findFirst({ where: { video: { url }, quality: qualityLabel } });
      if (cached && fs.existsSync(cached.path)) {
        log.info({ cacheKey, filePath: cached.path }, "Cache hit");
        return cached.path;
      }

      const sanitizedTitle = sanitizeFilename(video?.title ?? "tiktok");
      const outputPath = path.join(TEMP_DIR, "cached", `${sanitizedTitle}_${qualityLabel}_${Date.now()}.mp4`);

      try {
        await downloadToFile(url, formatSelector, outputPath);
      } catch (err) {
        cleanFiles([outputPath]);
        throw err;
      }

      // Upsert File record
      await prisma.file.upsert({
        where: { path: outputPath },
        update: {},
        create: { path: outputPath, quality: qualityLabel, videoId: video!.id },
      });

      return outputPath;
    };

    // Deduplicate concurrent requests
    let pending = _inFlight.get(cacheKey);
    if (!pending) {
      pending = resolveFilePath().finally(() => _inFlight.delete(cacheKey));
      _inFlight.set(cacheKey, pending);
    } else {
      log.info({ cacheKey }, "Joining in-flight download");
    }

    try {
      const filePath = await pending;
      const fileSizeBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
      const totalMs = Date.now() - requestStart;
      log.info({ cacheKey, filePath, fileSizeBytes, totalMs }, "Sending TikTok video response");

      const stream = fs.createReadStream(filePath);
      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "video/mp4",
          "Content-Disposition": buildContentDisposition(video?.title ?? "tiktok", "mp4"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, quality, totalMs }, "TikTok video download failed");
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/download/tiktok-video/route.ts
git commit -m "feat(tiktok): add /api/download/tiktok-video route"
```

---

## Task 8: TikTok audio download API route

**Files:**
- Create: `app/api/download/tiktok-audio/route.ts`

- [ ] **Step 1: Create the route**

```ts
// app/api/download/tiktok-audio/route.ts
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";
import { buildContentDisposition, cleanFiles, TEMP_DIR } from "@/lib/route-utils";
import { getServerConf } from "@/lib/server-conf";
import { sanitizeFilename, tiktok_validate } from "@/lib/serverUtils";
import { getYtDlpBinaryPath } from "@/lib/ytdlp-binary";
import { getCookiesArgs } from "@/lib/ytdlp-cookies";

const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

function downloadToFile(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("tiktok-audio-download");
    const bin = getYtDlpBinaryPath();
    const cookiesArgs = getCookiesArgs();

    const proc = spawn(bin, [
      "--no-check-certificates",
      "--no-warnings",
      "--no-playlist",
      "--format", "best[vcodec^=h264][format_id!=download]",
      "--output", outputPath,
      ...cookiesArgs,
      url,
    ]);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error(`yt-dlp timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`));
    }, DOWNLOAD_TIMEOUT_MS);

    proc.on("error", (err) => { clearTimeout(timeout); reject(err); });
    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        log.error({ exitCode: code, stderr: stderr.split("\n").slice(-3).join(" | ") }, "yt-dlp exited with error");
        reject(new Error(`yt-dlp exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

function extractAudioToMp3(inputPath: string, outputPath: string, ffmpegPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const log = getLog("tiktok-audio-ffmpeg");
    const proc = spawn(ffmpegPath, [
      "-i", inputPath,
      "-vn",
      "-acodec", "libmp3lame",
      "-ab", "192k",
      "-y",
      outputPath,
    ]);

    const stderrChunks: Buffer[] = [];
    if (proc.stderr) proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        log.error({ exitCode: code, stderr: stderr.split("\n").slice(-3).join(" | ") }, "FFmpeg exited with error");
        reject(new Error(`ffmpeg exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("tiktok-audio");
    const requestStart = Date.now();

    const url = new URL(request.url).searchParams.get("url");

    log.info({ url }, "TikTok audio download request");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    if (!url) {
      return new Response("Missing url parameter", { status: 400 });
    }

    if (!tiktok_validate(url)) {
      log.warn({ url }, "Invalid TikTok URL");
      return new Response("Invalid TikTok URL", { status: 400 });
    }

    let ffmpegPath: string;
    try {
      ({ ffmpegPath } = await getServerConf());
    } catch (err) {
      log.error({ err }, "Server configuration unavailable");
      return new Response("Server configuration error", { status: 500 });
    }

    const ts = Date.now();
    const videoPath = path.join(TEMP_DIR, "source", `tiktok_video_${ts}.mp4`);
    const audioPath = path.join(TEMP_DIR, "source", `tiktok_audio_${ts}.mp3`);

    try {
      await downloadToFile(url, videoPath);
      await extractAudioToMp3(videoPath, audioPath, ffmpegPath);

      cleanFiles([videoPath]);

      const fileSizeBytes = fs.existsSync(audioPath) ? fs.statSync(audioPath).size : 0;
      const totalMs = Date.now() - requestStart;
      log.info({ url, fileSizeBytes, totalMs }, "Sending TikTok audio response");

      const stream = fs.createReadStream(audioPath);
      stream.on("close", () => cleanFiles([audioPath]));

      // biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
      return new NextResponse(stream as any, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": buildContentDisposition("tiktok_audio", "mp3"),
        },
      });
    } catch (err) {
      const totalMs = Date.now() - requestStart;
      log.error({ err, url, totalMs }, "TikTok audio download failed");
      cleanFiles([videoPath, audioPath]);
      return new Response("An error occurred while processing", { status: 500 });
    }
  });
}
```

> **Note:** TikTok audio is not cached (no DB record). Each request re-downloads. This keeps the route simple; caching can be added later if needed.

- [ ] **Step 2: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/download/tiktok-audio/route.ts
git commit -m "feat(tiktok): add /api/download/tiktok-audio route"
```

---

## Task 9: TikTok landing page `/[locale]/tiktok`

**Files:**
- Create: `app/[locale]/tiktok/page.tsx`
- Modify: all 4 message files (new `tiktok` namespace + `meta` keys)

- [ ] **Step 1: Add i18n keys — `tiktok` namespace + `meta` in all 4 locales**

In `messages/en.json` add a top-level `"tiktok"` namespace and update `"meta"`:

```json
"tiktok": {
  "heroTitle": "Download TikTok videos\nwithout watermark.",
  "heroSubtitle": "free, online, no signup.",
  "heroDesc": "The easiest way to download TikTok videos. Get a clean MP4 without the watermark, or grab the audio as MP3. No app, no extension, no account.",
  "heroBadge1": "No watermark",
  "heroBadge2": "No ads, ever",
  "heroBadge3": "Open source",
  "heroBadge4": "YouTube too",
  "heroDisclaimer": "Please only download content you own or have the rights to.",
  "howItWorksLabel": "How it works",
  "howItWorksTitle": "From TikTok URL to file in three steps.",
  "howItWorksDesc": "No browser extension, no desktop app, no signup. Everything runs in your tab.",
  "step1Title": "Paste the TikTok URL",
  "step1Body": "Copy the link from any TikTok video — from the app or the website. Drop it in the search field above.",
  "step2Title": "Pick your format",
  "step2Body": "No watermark gives you the clean original. With watermark keeps the TikTok logo. Audio only extracts the sound as MP3.",
  "step3Title": "Download straight to your device",
  "step3Body": "The file streams directly to your browser. Nothing is stored on our servers. Only download content you have the rights to.",
  "formatsLabel": "Output formats",
  "formatsTitle": "Three ways to save a TikTok.",
  "formatsDesc": "Video at source resolution — we never re-encode. Audio at 192 kbps.",
  "formatsDisclaimer": "Video resolution depends on the original TikTok. We never upscale or re-encode.",
  "formatNoWmTitle": "No watermark",
  "formatNoWmMeta": "MP4 · H.264 · clean",
  "formatNoWmDesc": "The original video stream without the TikTok logo overlay. Best quality, clean file — ready for editing or sharing.",
  "formatNoWmFeature1": "No TikTok logo",
  "formatNoWmFeature2": "Source resolution",
  "formatNoWmFeature3": "H.264 compatible",
  "formatWmTitle": "With watermark",
  "formatWmMeta": "MP4 · original",
  "formatWmDesc": "The standard TikTok download with the creator watermark included. Ideal if you want to credit the original creator.",
  "formatWmFeature1": "TikTok watermark",
  "formatWmFeature2": "Original file",
  "formatAudioTitle": "Audio MP3",
  "formatAudioMeta": "MP3 · 192 kbps",
  "formatAudioDesc": "Just the audio track extracted from the video and converted to MP3. Great for music, voiceovers and sound effects.",
  "formatAudioFeature1": "192 kbps",
  "formatAudioFeature2": "No video stream",
  "faq1Q": "Does StroyGetter remove TikTok watermarks?",
  "faq1A": "Yes — the 'No watermark' option downloads the original video stream directly from TikTok's servers, without the overlaid logo. The watermark is never burned into this stream.",
  "faq2Q": "Which TikTok URLs are supported?",
  "faq2A": "Standard TikTok URLs (tiktok.com/@user/video/ID) and short links (vm.tiktok.com/…) are both supported. Just paste the link from the TikTok app or website.",
  "faq3Q": "Can I download TikTok audio only?",
  "faq3A": "Yes — pick the 'Audio only' option to get an MP3 at 192 kbps. The video stream is discarded and only the audio track is kept.",
  "faq4Q": "Is there a file size limit?",
  "faq4A": "We apply a generous limit (8 GB by default) which covers any realistic TikTok video. If you hit it, the download will fail with an error.",
  "githubTitle": "Open source on GitHub",
  "githubDesc": "Self-host or contribute · MIT licensed"
}
```

In `messages/en.json` `"meta"` object, add:
```json
"tiktokTitle": "StroyGetter — Free TikTok Video Downloader (No Watermark)",
"tiktokDesc": "Download TikTok videos without watermark as MP4 or extract audio as MP3. Free, no signup, no app required.",
"youtubeTitle": "StroyGetter — Free YouTube Video Downloader",
"youtubeDesc": "Download YouTube music as Library Ready MP3 — cover art, ID3 tags and synced lyrics embedded automatically. Also supports MP4 up to 4K and plain MP3. Free, no signup, no ads."
```

In `messages/fr-FR.json` add `"tiktok"` namespace:
```json
"tiktok": {
  "heroTitle": "Téléchargez des vidéos TikTok\nsans filigrane.",
  "heroSubtitle": "gratuit, en ligne, sans inscription.",
  "heroDesc": "Le moyen le plus simple de télécharger des vidéos TikTok. Obtenez un MP4 sans filigrane ou extrayez l'audio en MP3. Aucune appli, aucune extension, aucun compte.",
  "heroBadge1": "Sans filigrane",
  "heroBadge2": "Sans pub",
  "heroBadge3": "Open source",
  "heroBadge4": "YouTube aussi",
  "heroDisclaimer": "Ne téléchargez que les contenus que vous possédez ou pour lesquels vous avez les droits.",
  "howItWorksLabel": "Comment ça marche",
  "howItWorksTitle": "De l'URL TikTok au fichier en trois étapes.",
  "howItWorksDesc": "Aucune extension de navigateur, aucune appli, aucune inscription. Tout se passe dans votre onglet.",
  "step1Title": "Collez l'URL TikTok",
  "step1Body": "Copiez le lien d'une vidéo TikTok depuis l'appli ou le site. Collez-le dans le champ ci-dessus.",
  "step2Title": "Choisissez votre format",
  "step2Body": "Sans filigrane vous donne l'original propre. Avec filigrane conserve le logo TikTok. Audio seul extrait le son en MP3.",
  "step3Title": "Téléchargez directement sur votre appareil",
  "step3Body": "Le fichier est streamé directement dans votre navigateur. Rien n'est stocké sur nos serveurs.",
  "formatsLabel": "Formats de sortie",
  "formatsTitle": "Trois façons de sauvegarder un TikTok.",
  "formatsDesc": "Vidéo à la résolution source — nous ne ré-encodons jamais. Audio à 192 kbps.",
  "formatsDisclaimer": "La résolution dépend du TikTok original. Nous ne suréchantillonnons ni ne ré-encodons jamais.",
  "formatNoWmTitle": "Sans filigrane",
  "formatNoWmMeta": "MP4 · H.264 · propre",
  "formatNoWmDesc": "Le flux vidéo original sans le logo TikTok. Meilleure qualité, fichier propre — prêt pour le montage ou le partage.",
  "formatNoWmFeature1": "Sans logo TikTok",
  "formatNoWmFeature2": "Résolution source",
  "formatNoWmFeature3": "Compatible H.264",
  "formatWmTitle": "Avec filigrane",
  "formatWmMeta": "MP4 · original",
  "formatWmDesc": "Le téléchargement TikTok standard avec le filigrane du créateur. Idéal si vous souhaitez créditer le créateur original.",
  "formatWmFeature1": "Filigrane TikTok",
  "formatWmFeature2": "Fichier original",
  "formatAudioTitle": "Audio MP3",
  "formatAudioMeta": "MP3 · 192 kbps",
  "formatAudioDesc": "Juste la piste audio extraite de la vidéo et convertie en MP3. Parfait pour la musique, les voix off et les effets sonores.",
  "formatAudioFeature1": "192 kbps",
  "formatAudioFeature2": "Sans flux vidéo",
  "faq1Q": "StroyGetter supprime-t-il les filigranes TikTok ?",
  "faq1A": "Oui — l'option 'Sans filigrane' télécharge le flux vidéo original directement depuis les serveurs TikTok, sans le logo superposé.",
  "faq2Q": "Quelles URLs TikTok sont supportées ?",
  "faq2A": "Les URLs TikTok standard (tiktok.com/@user/video/ID) et les liens courts (vm.tiktok.com/…) sont tous deux supportés.",
  "faq3Q": "Puis-je télécharger uniquement l'audio TikTok ?",
  "faq3A": "Oui — choisissez 'Audio seul' pour obtenir un MP3 à 192 kbps. Le flux vidéo est ignoré.",
  "faq4Q": "Y a-t-il une limite de taille de fichier ?",
  "faq4A": "Nous appliquons une limite généreuse (8 Go par défaut) qui couvre toute vidéo TikTok réaliste.",
  "githubTitle": "Open source sur GitHub",
  "githubDesc": "Hébergez vous-même ou contribuez · Licence MIT"
}
```

In `messages/fr-FR.json` `"meta"` add:
```json
"tiktokTitle": "StroyGetter — Téléchargeur TikTok gratuit (sans filigrane)",
"tiktokDesc": "Téléchargez des vidéos TikTok sans filigrane en MP4 ou extrayez l'audio en MP3. Gratuit, sans inscription.",
"youtubeTitle": "StroyGetter — Téléchargeur YouTube gratuit",
"youtubeDesc": "Téléchargez de la musique YouTube en MP3 Library Ready — pochette, tags ID3 et paroles synchronisées intégrés automatiquement. Supporte aussi le MP4 jusqu'en 4K."
```

In `messages/es-419.json` add `"tiktok"` namespace:
```json
"tiktok": {
  "heroTitle": "Descarga videos de TikTok\nsin marca de agua.",
  "heroSubtitle": "gratis, en línea, sin registro.",
  "heroDesc": "La forma más fácil de descargar videos de TikTok. Obtén un MP4 limpio sin marca de agua o extrae el audio en MP3. Sin app, sin extensión, sin cuenta.",
  "heroBadge1": "Sin marca de agua",
  "heroBadge2": "Sin anuncios",
  "heroBadge3": "Código abierto",
  "heroBadge4": "YouTube también",
  "heroDisclaimer": "Solo descarga contenido que poseas o para el que tengas derechos.",
  "howItWorksLabel": "Cómo funciona",
  "howItWorksTitle": "De la URL de TikTok al archivo en tres pasos.",
  "howItWorksDesc": "Sin extensión, sin app, sin registro. Todo ocurre en tu pestaña.",
  "step1Title": "Pega la URL de TikTok",
  "step1Body": "Copia el enlace de cualquier video de TikTok desde la app o el sitio web. Pégalo en el campo de arriba.",
  "step2Title": "Elige tu formato",
  "step2Body": "Sin marca de agua te da el original limpio. Con marca de agua conserva el logo de TikTok. Solo audio extrae el sonido en MP3.",
  "step3Title": "Descarga directo a tu dispositivo",
  "step3Body": "El archivo se transmite directamente a tu navegador. Nada se almacena en nuestros servidores.",
  "formatsLabel": "Formatos de salida",
  "formatsTitle": "Tres formas de guardar un TikTok.",
  "formatsDesc": "Video en resolución original — nunca recodificamos. Audio a 192 kbps.",
  "formatsDisclaimer": "La resolución depende del TikTok original. Nunca ampliamos ni recodificamos.",
  "formatNoWmTitle": "Sin marca de agua",
  "formatNoWmMeta": "MP4 · H.264 · limpio",
  "formatNoWmDesc": "El stream de video original sin el logo de TikTok. La mejor calidad, archivo limpio listo para editar.",
  "formatNoWmFeature1": "Sin logo TikTok",
  "formatNoWmFeature2": "Resolución original",
  "formatNoWmFeature3": "Compatible H.264",
  "formatWmTitle": "Con marca de agua",
  "formatWmMeta": "MP4 · original",
  "formatWmDesc": "La descarga estándar de TikTok con la marca de agua del creador incluida.",
  "formatWmFeature1": "Marca de agua TikTok",
  "formatWmFeature2": "Archivo original",
  "formatAudioTitle": "Audio MP3",
  "formatAudioMeta": "MP3 · 192 kbps",
  "formatAudioDesc": "Solo la pista de audio extraída del video y convertida a MP3.",
  "formatAudioFeature1": "192 kbps",
  "formatAudioFeature2": "Sin video",
  "faq1Q": "¿StroyGetter elimina las marcas de agua de TikTok?",
  "faq1A": "Sí — la opción 'Sin marca de agua' descarga el stream de video original directamente desde los servidores de TikTok, sin el logo superpuesto.",
  "faq2Q": "¿Qué URLs de TikTok son compatibles?",
  "faq2A": "Las URLs estándar (tiktok.com/@user/video/ID) y los enlaces cortos (vm.tiktok.com/…) son compatibles.",
  "faq3Q": "¿Puedo descargar solo el audio de TikTok?",
  "faq3A": "Sí — elige 'Solo audio' para obtener un MP3 a 192 kbps.",
  "faq4Q": "¿Hay un límite de tamaño de archivo?",
  "faq4A": "Aplicamos un límite generoso (8 GB por defecto) que cubre cualquier video de TikTok.",
  "githubTitle": "Código abierto en GitHub",
  "githubDesc": "Aloja tú mismo o contribuye · Licencia MIT"
}
```

In `messages/es-419.json` `"meta"` add:
```json
"tiktokTitle": "StroyGetter — Descargador de TikTok gratuito (sin marca de agua)",
"tiktokDesc": "Descarga videos de TikTok sin marca de agua en MP4 o extrae el audio en MP3. Gratis, sin registro.",
"youtubeTitle": "StroyGetter — Descargador de YouTube gratuito",
"youtubeDesc": "Descarga música de YouTube como MP3 Library Ready con portada, etiquetas ID3 y letras sincronizadas. También soporta MP4 hasta 4K."
```

In `messages/pt-BR.json` add `"tiktok"` namespace:
```json
"tiktok": {
  "heroTitle": "Baixe vídeos do TikTok\nsem marca d'água.",
  "heroSubtitle": "grátis, online, sem cadastro.",
  "heroDesc": "A forma mais fácil de baixar vídeos do TikTok. Obtenha um MP4 limpo sem marca d'água ou extraia o áudio em MP3. Sem app, sem extensão, sem conta.",
  "heroBadge1": "Sem marca d'água",
  "heroBadge2": "Sem anúncios",
  "heroBadge3": "Código aberto",
  "heroBadge4": "YouTube também",
  "heroDisclaimer": "Baixe apenas conteúdo que você possui ou tem direitos.",
  "howItWorksLabel": "Como funciona",
  "howItWorksTitle": "Da URL do TikTok ao arquivo em três passos.",
  "howItWorksDesc": "Sem extensão, sem app, sem cadastro. Tudo acontece na sua aba.",
  "step1Title": "Cole a URL do TikTok",
  "step1Body": "Copie o link de qualquer vídeo do TikTok no app ou no site. Cole no campo acima.",
  "step2Title": "Escolha seu formato",
  "step2Body": "Sem marca d'água dá o original limpo. Com marca d'água mantém o logo do TikTok. Só áudio extrai o som em MP3.",
  "step3Title": "Baixe direto para o seu dispositivo",
  "step3Body": "O arquivo é transmitido diretamente para o seu navegador. Nada é armazenado em nossos servidores.",
  "formatsLabel": "Formatos de saída",
  "formatsTitle": "Três formas de salvar um TikTok.",
  "formatsDesc": "Vídeo na resolução original — nunca recodificamos. Áudio a 192 kbps.",
  "formatsDisclaimer": "A resolução depende do TikTok original. Nunca ampliamos nem recodificamos.",
  "formatNoWmTitle": "Sem marca d'água",
  "formatNoWmMeta": "MP4 · H.264 · limpo",
  "formatNoWmDesc": "O stream de vídeo original sem o logo do TikTok. Melhor qualidade, arquivo limpo.",
  "formatNoWmFeature1": "Sem logo TikTok",
  "formatNoWmFeature2": "Resolução original",
  "formatNoWmFeature3": "Compatível H.264",
  "formatWmTitle": "Com marca d'água",
  "formatWmMeta": "MP4 · original",
  "formatWmDesc": "O download padrão do TikTok com a marca d'água do criador incluída.",
  "formatWmFeature1": "Marca d'água TikTok",
  "formatWmFeature2": "Arquivo original",
  "formatAudioTitle": "Só áudio MP3",
  "formatAudioMeta": "MP3 · 192 kbps",
  "formatAudioDesc": "Apenas a faixa de áudio extraída do vídeo e convertida em MP3.",
  "formatAudioFeature1": "192 kbps",
  "formatAudioFeature2": "Sem vídeo",
  "faq1Q": "O StroyGetter remove marcas d'água do TikTok?",
  "faq1A": "Sim — a opção 'Sem marca d'água' baixa o stream de vídeo original diretamente dos servidores do TikTok, sem o logo sobreposto.",
  "faq2Q": "Quais URLs do TikTok são suportadas?",
  "faq2A": "URLs padrão (tiktok.com/@user/video/ID) e links curtos (vm.tiktok.com/…) são suportados.",
  "faq3Q": "Posso baixar apenas o áudio do TikTok?",
  "faq3A": "Sim — escolha 'Só áudio' para obter um MP3 a 192 kbps.",
  "faq4Q": "Há limite de tamanho de arquivo?",
  "faq4A": "Aplicamos um limite generoso (8 GB por padrão) que cobre qualquer vídeo do TikTok.",
  "githubTitle": "Código aberto no GitHub",
  "githubDesc": "Hospede você mesmo ou contribua · Licença MIT"
}
```

In `messages/pt-BR.json` `"meta"` add:
```json
"tiktokTitle": "StroyGetter — Baixador de TikTok gratuito (sem marca d'água)",
"tiktokDesc": "Baixe vídeos do TikTok sem marca d'água em MP4 ou extraia o áudio em MP3. Grátis, sem cadastro.",
"youtubeTitle": "StroyGetter — Baixador de YouTube gratuito",
"youtubeDesc": "Baixe músicas do YouTube como MP3 Library Ready com capa, tags ID3 e letras sincronizadas. Também suporta MP4 até 4K."
```

- [ ] **Step 2: Create `app/[locale]/tiktok/page.tsx`**

```tsx
import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, Download, Link as LinkIcon, Scale, Film, Music } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment, Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("tiktokTitle"),
    description: t("tiktokDesc"),
    alternates: buildAlternates(locale, "/tiktok"),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function TikTokPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tiktok");

  const HOW_STEPS = [
    { Icon: LinkIcon, n: "01", title: t("step1Title"), body: t("step1Body") },
    { Icon: Scale,    n: "02", title: t("step2Title"), body: t("step2Body") },
    { Icon: Download, n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const FORMATS = [
    {
      Icon: Film,
      title: t("formatNoWmTitle"),
      meta: t("formatNoWmMeta"),
      desc: t("formatNoWmDesc"),
      features: [t("formatNoWmFeature1"), t("formatNoWmFeature2"), t("formatNoWmFeature3")],
      featured: true,
    },
    {
      Icon: Film,
      title: t("formatWmTitle"),
      meta: t("formatWmMeta"),
      desc: t("formatWmDesc"),
      features: [t("formatWmFeature1"), t("formatWmFeature2")],
      featured: false,
    },
    {
      Icon: Music,
      title: t("formatAudioTitle"),
      meta: t("formatAudioMeta"),
      desc: t("formatAudioDesc"),
      features: [t("formatAudioFeature1"), t("formatAudioFeature2")],
      featured: false,
    },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to download a TikTok video without watermark",
          description: "Download any public TikTok video as MP4 (with or without watermark) or MP3 in three steps — no install, no signup.",
          step: HOW_STEPS.map((s) => ({
            "@type": "HowToStep",
            name: s.title,
            text: s.body,
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* ── HERO ── */}
      <section className="bg-stroy-500 px-4 py-20 md:py-28" id="home">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            {t("heroTitle")
              .split("\n")
              .map((line, i, arr) => (
                <Fragment key={line}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </Fragment>
              ))}
            <br />
            <em className="font-light italic text-white/78">{t("heroSubtitle")}</em>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            {t("heroDesc")}
          </p>

          <Suspense fallback={<SkeletonInput />}>
            <GetterInput />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            {[t("heroBadge1"), t("heroBadge2"), t("heroBadge3"), t("heroBadge4")].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <Check size={14} className="text-stroy-300" /> {badge}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-white/50">{t("heroDisclaimer")}</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="how-it-works">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("howItWorksLabel")}
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("howItWorksTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              {t("howItWorksDesc")}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-white/10 bg-white/2.5 p-8"
              >
                <span className="absolute right-7 top-7 font-mono text-xs tracking-wider text-white/40">
                  {s.n}
                </span>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <s.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATS ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24" id="formats">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("formatsLabel")}
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("formatsTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              {t("formatsDesc")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FORMATS.map((f) => (
              <div
                key={f.title}
                className={`flex flex-col gap-4 rounded-2xl border p-7 ${
                  f.featured ? "border-stroy-300/30 bg-stroy-700" : "border-white/6 bg-stroy-800"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/6 text-stroy-100">
                  <f.Icon size={18} />
                </div>
                <div>
                  <h3 className="mb-1 text-[19px] font-bold tracking-tight">{f.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                    {f.meta}
                  </p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/75">{f.desc}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {f.features.map((feat) => (
                    <li
                      key={feat}
                      className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70"
                    >
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-white/50">{t("formatsDisclaimer")}</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="faq">
        <div className="mx-auto max-w-9xl">
          <div className="grid gap-14 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="mb-8 text-balance text-4xl font-bold leading-tight tracking-tight">FAQ</h2>
              <Accordion type="single" collapsible className="flex flex-col gap-2">
                {FAQS.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${i}`}
                    className="rounded-xl border border-white/10 bg-white/2 px-5 data-[state=open]:border-white/20 data-[state=open]:bg-white/4"
                  >
                    <AccordionTrigger className="py-4 text-left text-[15px] font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-[1.65] text-white/75">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <aside className="flex flex-col gap-5">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-4 rounded-2xl border border-white/10 p-5 transition-colors hover:border-white/20 hover:bg-white/2"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-stroy-700">
                  <SiGithub size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{t("githubTitle")}</p>
                  <p className="text-xs text-white/65">{t("githubDesc")}</p>
                </div>
                <span className="text-white/60">→</span>
              </a>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/tiktok/page.tsx \
  messages/en.json messages/fr-FR.json messages/es-419.json messages/pt-BR.json
git commit -m "feat(tiktok): add /tiktok landing page + tiktok i18n namespace"
```

---

## Task 10: YouTube landing page `/[locale]/youtube`

**Files:**
- Create: `app/[locale]/youtube/page.tsx`

The YouTube page reuses the `home` namespace — same content, same structure. Only the metadata (`title`, `description`) is YouTube-specific.

- [ ] **Step 1: Create `app/[locale]/youtube/page.tsx`**

Copy `app/[locale]/page.tsx` to `app/[locale]/youtube/page.tsx`, then make these changes:

1. Replace `generateMetadata`:
```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return {
    title: tMeta("youtubeTitle"),
    description: tMeta("youtubeDesc"),
    alternates: buildAlternates(locale, "/youtube"),
  };
}
```

2. Replace `export default async function Home` → `export default async function YouTubePage` (same body).

3. Change the JSON-LD name:
```tsx
name: "How to download a YouTube video with StroyGetter",
```
(already correct in the home copy — no change needed)

- [ ] **Step 2: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/youtube/page.tsx
git commit -m "feat(tiktok): add /youtube dedicated landing page"
```

---

## Task 11: Update home page for YouTube + TikTok

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `messages/en.json`, `messages/fr-FR.json`, `messages/es-419.json`, `messages/pt-BR.json`

- [ ] **Step 1: Update i18n keys in all 4 locales**

In `messages/en.json`, `"home"` namespace, update these keys:

```json
"heroTitle": "Download YouTube & TikTok\nvideos, music and more.",
"heroSubtitle": "free, online, no signup.",
"heroDesc": "The open-source downloader for YouTube and TikTok. Get a plain video or audio file, download TikTok without watermark, or pick <libraryReady>Library Ready</libraryReady> (YouTube) for a fully tagged MP3 with cover art, ID3 tags and synced lyrics.",
"heroBadge1": "YouTube & TikTok",
"heroBadge2": "No ads, ever",
"heroBadge3": "Open source",
"heroBadge4": "Library Ready — only here",
"step1Title": "Paste the YouTube or TikTok URL",
"step1Body": "Copy the link from any YouTube video or TikTok — desktop, mobile app, or Shorts. Drop it in the search field above.",
"formatTiktokTitle": "TikTok download",
"formatTiktokMeta": "MP4 · no watermark",
"formatTiktokDesc": "Download TikTok videos without the watermark at source resolution, or grab the audio track as MP3. No app required.",
"formatTiktokFeature1": "No watermark",
"formatTiktokFeature2": "With watermark option",
"formatTiktokFeature3": "Audio MP3",
"faqTiktok1Q": "Does StroyGetter remove TikTok watermarks?",
"faqTiktok1A": "Yes — the 'No watermark' option downloads the original video stream without the overlaid TikTok logo. Go to stroygetter.fr/tiktok for the dedicated TikTok downloader.",
"faqTiktok2Q": "Which TikTok URLs are supported?",
"faqTiktok2A": "Standard TikTok URLs (tiktok.com/@user/video/ID) and short links (vm.tiktok.com/…) are both supported. Just paste the link."
```

In `messages/fr-FR.json`, `"home"` namespace, update:
```json
"heroTitle": "Téléchargez YouTube & TikTok\nvidéos, musique et plus.",
"heroDesc": "Le téléchargeur open source pour YouTube et TikTok. Obtenez une vidéo ou un audio brut, téléchargez TikTok sans filigrane, ou choisissez <libraryReady>Library Ready</libraryReady> (YouTube) pour un MP3 complet avec pochette, tags ID3 et paroles synchronisées.",
"heroBadge1": "YouTube & TikTok",
"step1Title": "Collez l'URL YouTube ou TikTok",
"step1Body": "Copiez le lien depuis n'importe quelle vidéo YouTube ou TikTok — bureau, appli mobile, Shorts. Collez-le dans le champ ci-dessus.",
"formatTiktokTitle": "Téléchargement TikTok",
"formatTiktokMeta": "MP4 · sans filigrane",
"formatTiktokDesc": "Téléchargez des vidéos TikTok sans filigrane à la résolution source, ou extrayez l'audio en MP3.",
"formatTiktokFeature1": "Sans filigrane",
"formatTiktokFeature2": "Avec filigrane disponible",
"formatTiktokFeature3": "Audio MP3",
"faqTiktok1Q": "StroyGetter supprime-t-il les filigranes TikTok ?",
"faqTiktok1A": "Oui — l'option 'Sans filigrane' télécharge le flux vidéo original sans le logo TikTok superposé. Rendez-vous sur stroygetter.fr/tiktok pour le téléchargeur TikTok dédié.",
"faqTiktok2Q": "Quelles URLs TikTok sont supportées ?",
"faqTiktok2A": "Les URLs standard (tiktok.com/@user/video/ID) et les liens courts (vm.tiktok.com/…) sont supportés."
```

In `messages/es-419.json`, `"home"` namespace, update:
```json
"heroTitle": "Descarga YouTube & TikTok\nvideos, música y más.",
"heroDesc": "El descargador open source para YouTube y TikTok. Obtén video o audio, descarga TikTok sin marca de agua, o elige <libraryReady>Library Ready</libraryReady> (YouTube) para un MP3 con portada, etiquetas ID3 y letras sincronizadas.",
"heroBadge1": "YouTube & TikTok",
"step1Title": "Pega la URL de YouTube o TikTok",
"step1Body": "Copia el enlace de cualquier video de YouTube o TikTok y pégalo en el campo de arriba.",
"formatTiktokTitle": "Descarga TikTok",
"formatTiktokMeta": "MP4 · sin marca de agua",
"formatTiktokDesc": "Descarga videos de TikTok sin marca de agua o extrae el audio en MP3.",
"formatTiktokFeature1": "Sin marca de agua",
"formatTiktokFeature2": "Con marca de agua disponible",
"formatTiktokFeature3": "Audio MP3",
"faqTiktok1Q": "¿StroyGetter elimina marcas de agua de TikTok?",
"faqTiktok1A": "Sí — la opción 'Sin marca de agua' descarga el stream original sin el logo superpuesto.",
"faqTiktok2Q": "¿Qué URLs de TikTok son compatibles?",
"faqTiktok2A": "URLs estándar (tiktok.com/@user/video/ID) y enlaces cortos (vm.tiktok.com/…) son compatibles."
```

In `messages/pt-BR.json`, `"home"` namespace, update:
```json
"heroTitle": "Baixe YouTube & TikTok\nvídeos, música e mais.",
"heroDesc": "O downloader open source para YouTube e TikTok. Obtenha vídeo ou áudio, baixe TikTok sem marca d'água, ou escolha <libraryReady>Library Ready</libraryReady> (YouTube) para MP3 com capa, tags ID3 e letras sincronizadas.",
"heroBadge1": "YouTube & TikTok",
"step1Title": "Cole a URL do YouTube ou TikTok",
"step1Body": "Copie o link de qualquer vídeo do YouTube ou TikTok e cole no campo acima.",
"formatTiktokTitle": "Download TikTok",
"formatTiktokMeta": "MP4 · sem marca d'água",
"formatTiktokDesc": "Baixe vídeos do TikTok sem marca d'água ou extraia o áudio em MP3.",
"formatTiktokFeature1": "Sem marca d'água",
"formatTiktokFeature2": "Com marca d'água disponível",
"formatTiktokFeature3": "Áudio MP3",
"faqTiktok1Q": "O StroyGetter remove marcas d'água do TikTok?",
"faqTiktok1A": "Sim — a opção 'Sem marca d'água' baixa o stream original sem o logo sobreposto.",
"faqTiktok2Q": "Quais URLs do TikTok são suportadas?",
"faqTiktok2A": "URLs padrão (tiktok.com/@user/video/ID) e links curtos (vm.tiktok.com/…) são suportados."
```

- [ ] **Step 2: Update `app/[locale]/page.tsx`**

In the `FORMATS` array, add a 4th entry after `mp3`:
```tsx
{
  Icon: Film,
  title: t("formatTiktokTitle"),
  meta: t("formatTiktokMeta"),
  desc: t("formatTiktokDesc"),
  features: [
    t("formatTiktokFeature1"),
    t("formatTiktokFeature2"),
    t("formatTiktokFeature3"),
  ],
  featured: false,
  badge: undefined,
},
```

Update the grid className for the formats section to handle 4 cards:
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

In the `FAQS` array, add 2 TikTok questions:
```tsx
{ q: t("faqTiktok1Q"), a: t("faqTiktok1A") },
{ q: t("faqTiktok2Q"), a: t("faqTiktok2A") },
```

- [ ] **Step 3: TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/page.tsx \
  messages/en.json messages/fr-FR.json messages/es-419.json messages/pt-BR.json
git commit -m "feat(tiktok): update home page for YouTube+TikTok dual-platform"
```

---

## Task 12: Sitemap update

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Add `/tiktok` and `/youtube` entries**

In `app/sitemap.ts`, add after the `""` (home) entry:

```ts
...localeEntries("/tiktok",  new Date(), "monthly", 0.9),
...localeEntries("/youtube", new Date(), "monthly", 0.9),
```

- [ ] **Step 2: Commit**

```bash
git add app/sitemap.ts
git commit -m "feat(tiktok): add /tiktok and /youtube to sitemap"
```

---

## Task 13: Integration test — TikTok fetch

**Files:**
- Create: `__tests__/integration/tiktok-fetch.test.ts`

- [ ] **Step 1: Create the test**

```ts
/**
 * Integration tests — hit the real TikTok/yt-dlp pipeline.
 * Run manually: pnpm test __tests__/integration/tiktok-fetch.test.ts
 * Requires network access and a working yt-dlp binary.
 */
import { describe, expect, it } from "vitest";
import { getTikTokInfos } from "@/functions/fetchTiktokInfos";
import { getVideoInfos } from "@/functions/fetchVideoinfos";
import { TIKTOK_ITAG } from "@/lib/types";

const TIKTOK_URL = "https://www.tiktok.com/@honor_france/video/7568900679792708896";

describe("TikTok fetch integration — real network required", () => {
  it(
    "getTikTokInfos returns video_details and 3 fixed formats",
    async () => {
      const result = await getTikTokInfos(TIKTOK_URL);

      expect(result).not.toHaveProperty("error");
      if ("error" in result) throw new Error(result.error);

      // Video details
      expect(result.video_details.title).toContain("antenne");
      expect(result.video_details.author).toBeTruthy();
      expect(Number(result.video_details.duration)).toBeGreaterThan(0);
      expect(result.video_details.thumbnail).toMatch(/^https?:\/\//);

      // Formats — exactly 3 fixed sentinels
      expect(result.format).toHaveLength(3);
      const itags = result.format.map((f) => f.itag);
      expect(itags).toContain(TIKTOK_ITAG.WATERMARK);
      expect(itags).toContain(TIKTOK_ITAG.NO_WATERMARK);
      expect(itags).toContain(TIKTOK_ITAG.AUDIO);
    },
    30_000
  );

  it(
    "getVideoInfos routes TikTok URL to getTikTokInfos",
    async () => {
      const result = await getVideoInfos(TIKTOK_URL);

      expect(result).not.toHaveProperty("error");
      if ("error" in result) throw new Error(String((result as { error: unknown }).error));

      expect(result.format).toHaveLength(3);
      expect(result.format[0].itag).toBe(TIKTOK_ITAG.WATERMARK);
    },
    30_000
  );
});
```

- [ ] **Step 2: Run the integration test**

```bash
pnpm vitest run __tests__/integration/tiktok-fetch.test.ts 2>&1 | tail -30
```
Expected: both tests pass. If `"antenne"` partial match fails, adjust to match actual title substring.

- [ ] **Step 3: Commit**

```bash
git add __tests__/integration/tiktok-fetch.test.ts
git commit -m "test(tiktok): add TikTok fetch integration test"
```

---

## Task 14: Final check

- [ ] **Step 1: Run all unit tests**

```bash
pnpm vitest run __tests__/lib/ 2>&1 | tail -20
```
Expected: all pass.

- [ ] **Step 2: TypeScript full check**

```bash
pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 3: Lint**

```bash
pnpm lint 2>&1 | head -30
```
Expected: no errors (warnings acceptable).

- [ ] **Step 4: Build check**

```bash
pnpm build 2>&1 | tail -20
```
Expected: successful build.

- [ ] **Step 5: Final commit if anything was tweaked**

```bash
git add -A && git commit -m "chore(tiktok): final lint and type fixes" --allow-empty
```

---

## Self-Review

**Spec coverage check:**
- ✅ `tiktok_validate` + `detectSource` → Task 2
- ✅ `resolveVideoUrl` replacing `getYoutubeUrl` → Task 3
- ✅ `GetterInput` updated → Task 4
- ✅ TikTok metadata via yt-dlp dump-json → Task 5
- ✅ Source-aware `getVideoInfos` → Task 5
- ✅ `TIKTOK_ITAG` sentinels → Task 1
- ✅ `VideoSelect` TikTok tabs → Task 6
- ✅ `/fetch` page passes `source` prop → Task 6
- ✅ `/api/download/tiktok-video` → Task 7
- ✅ `/api/download/tiktok-audio` → Task 8
- ✅ `/[locale]/tiktok` page → Task 9
- ✅ `/[locale]/youtube` page → Task 10
- ✅ Home page updated → Task 11
- ✅ Sitemap → Task 12
- ✅ Integration test → Task 13
- ✅ i18n all 4 locales → Tasks 6, 9, 10, 11

**Type consistency check:**
- `TIKTOK_ITAG` defined in Task 1, used in Tasks 5, 6, 7, 13 — consistent
- `tiktok_validate` / `detectSource` defined in Task 2, used in Tasks 3, 5, 6, 7, 8 — consistent
- `VideoSelect` prop `source: "youtube" | "tiktok"` defined in Task 6, passed in Task 6 — consistent
- `getTikTokInfos` defined in Task 5, tested in Task 13 — consistent
