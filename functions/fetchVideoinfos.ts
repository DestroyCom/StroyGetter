"use server";

import { video_info, yt_validate } from "play-dl";

export const getVideoInfos = async (url: string) => {
  if (!(url.startsWith("https") && yt_validate(url) === "video")) {
    console.error("Invalid URL");
    return {
      error: "Invalid URL",
    };
  }

  const videoData = await video_info(url);

  return JSON.parse(JSON.stringify(videoData));
};
