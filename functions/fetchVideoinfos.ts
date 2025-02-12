"use server";

import { FormatData, VideoData } from "@/lib/types";
import ytdl from "@distube/ytdl-core";
import { PrismaClient } from "@prisma/client";

export const getVideoInfos = async (url: string) => {
  if (!(url.startsWith("https") && ytdl.validateURL(url))) {
    console.error("Invalid URL");
    return {
      error: "Invalid URL",
    };
  }

  const prisma = new PrismaClient();

  const video = await ytdl.getBasicInfo(url);

  const formatMap = new Map();
  (video.player_response.streamingData.adaptiveFormats as FormatData[]).forEach(
    (format: FormatData) => {
      if (!formatMap.has(format.qualityLabel)) {
        formatMap.set(format.qualityLabel, format);
      }
    }
  );

  const videoData: VideoData = {
    video_details: {
      title: video.videoDetails.title,
      description: video.videoDetails.description || "",
      duration: video.videoDetails.lengthSeconds,
      thumbnail:
        video.videoDetails.thumbnails[video.videoDetails.thumbnails.length - 1]
          .url,
      author: video.videoDetails.author.name,
    },
    format: Array.from(formatMap.values()),
  };

  const dbVideo = await prisma.video.findUnique({
    where: {
      id: video.videoDetails.videoId,
    },
  });

  if (!dbVideo) {
    await prisma.video.create({
      data: {
        id: video.videoDetails.videoId,
        title: video.videoDetails.title,
        url: url,
        updatedAt: new Date(),
      },
    });
    await prisma.$disconnect();
  }

  return JSON.parse(JSON.stringify(videoData));
};
