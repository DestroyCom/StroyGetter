"use server";

import { PrismaClient } from "@prisma/client";
import { extractVideoId, getInnertube } from "@/lib/innertube";
import { yt_validate } from "@/lib/serverUtils";
import type { FormatData, VideoData } from "@/lib/types";
import { getVideoFormats } from "@/lib/ytdlp-info";

const prisma = new PrismaClient();

export const getVideoInfos = async (url: string) => {
  if (!(await yt_validate(url))) {
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

  const videoData: VideoData = {
    video_details: {
      title: details.title ?? "",
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail: thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  const dbVideo = await prisma.video.findUnique({ where: { id: videoId } });
  if (!dbVideo) {
    await prisma.video.create({
      data: {
        id: videoId,
        title: details.title ?? "Unknown",
        url: url,
        updatedAt: new Date(),
      },
    });
  }

  return JSON.parse(JSON.stringify(videoData));
};
