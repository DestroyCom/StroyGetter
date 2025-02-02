"use server";

import { yt_validate } from "@/lib/serverUtils";
import ytsr from "@distube/ytsr";

export const searchQuery = async (query: string) => {
  if (await yt_validate(query)) {
    return query;
  }

  const search = await ytsr(query, { limit: 1 });

  if (search.items.length === 0) {
    throw new Error("No video found");
  }

  const video = search.items[0];
  return video.url;
};
