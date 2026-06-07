"use server";

import { getInnertube } from "@/lib/innertube";
import { detectSource, twitch_is_vod } from "@/lib/serverUtils";
import { siteConfig } from "@/lib/site-config";

/**
 * Resolves a raw user input to a canonical video URL.
 * - Valid YouTube URL → returned as-is
 * - Valid TikTok URL  → returned as-is
 * - Anything else    → treated as a YouTube search query via innertube
 */
export const resolveVideoUrl = async (query: string): Promise<string> => {
  const trimmed = query.trim();

  const source = detectSource(trimmed);
  if (source === "youtube") {
    if (!siteConfig.enableYoutube) throw new Error("YOUTUBE_DISABLED");
    return trimmed;
  }
  if (source === "tiktok") {
    if (!siteConfig.enableTiktok) throw new Error("TIKTOK_DISABLED");
    return trimmed;
  }
  if (source === "twitch") {
    if (!siteConfig.enableTwitch) throw new Error("TWITCH_DISABLED");
    return trimmed;
  }

  if (twitch_is_vod(trimmed)) throw new Error("TWITCH_VOD_DISABLED");

  // Fall back to YouTube search
  if (!siteConfig.enableYoutube) throw new Error("YOUTUBE_DISABLED");

  const innertube = await getInnertube();
  const results = await innertube.search(trimmed, { type: "video" });

  const firstVideo = results.results?.find((r) => r.type === "Video") as { id: string } | undefined;

  if (!firstVideo?.id) {
    throw new Error("No video found");
  }

  return `https://www.youtube.com/watch?v=${firstVideo.id}`;
};
