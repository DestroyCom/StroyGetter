/**
 * Integration tests — hit the real Twitch/yt-dlp pipeline.
 * Run manually: pnpm test __tests__/integration/twitch-fetch.test.ts
 * Requires network access and a working yt-dlp binary.
 */
import { describe, expect, it } from "vitest";
import { getTwitchInfos } from "@/functions/fetchTwitchInfos";
import { getVideoInfos } from "@/functions/fetchVideoinfos";
import { TWITCH_ITAG } from "@/lib/types";

const CLIP_URL = "https://www.twitch.tv/clip5k/clip/SullenDeliciousLorisWow-u-SUuTpMLb1b8IZe";
const VOD_URL = "https://www.twitch.tv/videos/2785616521";

const itLocal = it.skipIf(!!process.env.CI);

describe("Twitch fetch integration — real network required", () => {
  itLocal("getTwitchInfos returns video_details and dynamic formats for a clip", async () => {
    const result = await getTwitchInfos(CLIP_URL);

    if ("error" in result) throw new Error(`Unexpected error: ${result.error}`);

    // video_details
    expect(result.video_details.title).toBeTruthy();
    expect(result.video_details.author).toBeTruthy();
    expect(Number(result.video_details.duration)).toBeGreaterThan(0);
    expect(result.video_details.thumbnail).toMatch(/^https?:\/\//);

    // formats — at least 1 video format
    expect(result.format.length).toBeGreaterThan(0);
    // All formats have itag >= TWITCH_ITAG.VIDEO_BASE
    for (const f of result.format) {
      expect(f.itag).toBeGreaterThanOrEqual(TWITCH_ITAG.VIDEO_BASE);
      expect(f.qualityLabel).toBeTruthy();
      expect(f.formatId).toBeTruthy();
    }
    // Sorted descending by height — every adjacent pair must satisfy heights[i] >= heights[i+1]
    const heights = result.format.map((f) => parseInt(f.qualityLabel, 10));
    for (let i = 0; i < heights.length - 1; i++) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i + 1]);
    }
  }, 30_000);

  itLocal("getVideoInfos routes Twitch clip URL to getTwitchInfos", async () => {
    const result = await getVideoInfos(CLIP_URL);

    if ("error" in result) throw new Error(`Unexpected error: ${result.error}`);
    expect(result.format.length).toBeGreaterThan(0);
    // All formats have formatId (Twitch-specific field)
    for (const f of result.format) {
      expect(f.formatId).toBeTruthy();
    }
  }, 30_000);
});
