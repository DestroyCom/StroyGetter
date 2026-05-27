"use server";

import { getInnertube } from "@/lib/innertube";
import { detectSource } from "@/lib/serverUtils";

/**
 * Resolves a raw user input to a canonical video URL.
 * - Valid YouTube URL → returned as-is
 * - Valid TikTok URL  → returned as-is
 * - Anything else    → treated as a YouTube search query via innertube
 */
export const resolveVideoUrl = async (query: string): Promise<string> => {
  const trimmed = query.trim();

  const source = detectSource(trimmed);
  if (source === "youtube" || source === "tiktok") return trimmed;

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
