"use server";

import { extractVideoId, getInnertube } from "@/lib/innertube";
import { prisma } from "@/lib/prisma";
import { yt_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";

export const getVideoInfos = async (url: string) => {
  if (!yt_validate(url)) {
    console.error("Invalid URL");
    return { error: "Invalid URL" };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: "Invalid URL" };
  }

  const innertube = await getInnertube();

  const [basicInfo, formats] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getVideoFormats(url),
  ]);

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

  const dbVideo = await prisma.video.findUnique({ where: { url: url } });
  if (!dbVideo) {
    await prisma.video.create({
      data: {
        title: details.title ?? "Unknown",
        url: url,
      },
    });
  }

  return JSON.parse(JSON.stringify(videoData));
};
