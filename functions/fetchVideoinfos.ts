"use server";

import { extractVideoId, getInnertube } from "@/lib/innertube";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { yt_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";

const log = logger.child({ module: "fetch-video-infos" });

export const getVideoInfos = async (url: string) => {
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
      title: details.title ?? "",
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail: bestThumbnail.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  log.info(
    {
      videoId,
      title: details.title,
      durationSec: details.duration,
      formatsCount: formats.length,
      durationMs: Date.now() - startTime,
    },
    "Video info fetched successfully"
  );

  // Upsert video in DB for tracking (non-fatal if it fails)
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
