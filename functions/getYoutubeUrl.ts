"use server";

import { getInnertube } from "@/lib/innertube";
import { yt_validate } from "@/lib/serverUtils";

export const searchQuery = async (query: string) => {
  if (await yt_validate(query)) {
    return query;
  }

  const innertube = await getInnertube();
  const results = await innertube.search(query, { type: "video" });

  const firstVideo = results.results?.find((r) => r.type === "Video") as { id: string } | undefined;

  if (!firstVideo?.id) {
    throw new Error("No video found");
  }

  return `https://www.youtube.com/watch?v=${firstVideo.id}`;
};
