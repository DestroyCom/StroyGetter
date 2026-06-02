"use server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { selectYtDlpPath, twitch_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getCookiesOpt } from "@/lib/ytdlp-cookies";

const log = logger.child({ module: "fetch-twitch-infos" });

type YtDlpDump = {
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
  formats?: Array<{
    format_id: string;
    height?: number;
    fps?: number;
    vcodec?: string;
  }>;
};

export const getTwitchInfos = async (url: string): Promise<VideoData | { error: string }> => {
  if (!twitch_validate(url)) {
    log.warn({ url }, "URL validation failed — not a valid Twitch URL");
    return { error: "Invalid URL" };
  }

  log.info({ url }, "Fetching Twitch info");
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
    const msg = err instanceof Error ? err.message : "Failed to fetch Twitch info";
    log.error({ url, err, durationMs: Date.now() - startTime }, `Twitch info fetch failed: ${msg}`);
    return { error: msg };
  }

  const videoFormats: FormatData[] = (dump.formats ?? [])
    .filter((f) => f.height != null && f.vcodec !== "none")
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .map((f, i) => ({
      itag: i + 410,
      qualityLabel: `${f.height}p${(f.fps ?? 0) > 30 ? ` ${f.fps}fps` : ""}`,
      formatId: f.format_id,
    }));

  if (videoFormats.length === 0) {
    log.warn({ url, durationMs: Date.now() - startTime }, "No video formats found for Twitch URL");
    return { error: "No video formats found" };
  }

  const videoData: VideoData = {
    video_details: {
      title: dump.title ?? "Unknown title",
      description: "",
      duration: String(dump.duration ?? 0),
      thumbnail: dump.thumbnail ?? "",
      author: dump.uploader ?? "",
    },
    format: videoFormats,
  };

  log.info(
    {
      url,
      title: dump.title,
      durationSec: dump.duration,
      formatsCount: videoFormats.length,
      durationMs: Date.now() - startTime,
    },
    "Twitch info fetched successfully"
  );

  try {
    const existing = await prisma.video.findUnique({ where: { url } });
    if (!existing) {
      await prisma.video.create({ data: { title: dump.title ?? "Unknown", url } });
      log.debug({ url, title: dump.title }, "Twitch video record created in DB");
    }
  } catch (dbErr) {
    log.warn({ url, err: dbErr }, "Failed to upsert Twitch video in DB — non-fatal");
  }

  return JSON.parse(JSON.stringify(videoData));
};
