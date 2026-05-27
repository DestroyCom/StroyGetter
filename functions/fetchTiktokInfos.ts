"use server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { selectYtDlpPath, tiktok_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { TIKTOK_ITAG } from "@/lib/types";
import { getCookiesOpt } from "@/lib/ytdlp-cookies";

const log = logger.child({ module: "fetch-tiktok-infos" });

const TIKTOK_FORMATS: FormatData[] = [
  { itag: TIKTOK_ITAG.WATERMARK, qualityLabel: "Video (with watermark)" },
  { itag: TIKTOK_ITAG.NO_WATERMARK, qualityLabel: "Video (no watermark)" },
  { itag: TIKTOK_ITAG.AUDIO, qualityLabel: "Audio only (MP3)" },
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
      title: dump.title ?? "Unknown title",
      description: "",
      duration: String(dump.duration ?? 0),
      thumbnail: dump.thumbnail ?? "",
      author: dump.uploader ?? "",
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
