/**
 * Integration tests — hit the real TikTok/yt-dlp pipeline.
 * Run manually: pnpm test __tests__/integration/tiktok-fetch.test.ts
 * Requires network access and a working yt-dlp binary.
 */
import { describe, expect, it } from "vitest";
import { getTikTokInfos } from "@/functions/fetchTiktokInfos";
import { getVideoInfos } from "@/functions/fetchVideoinfos";
import { TIKTOK_ITAG } from "@/lib/types";

const TIKTOK_URL = "https://www.tiktok.com/@honor_france/video/7568900679792708896";

const itLocal = it.skipIf(!!process.env.CI);

describe("TikTok fetch integration — real network required", () => {
  itLocal("getTikTokInfos returns video_details and 3 fixed formats", async () => {
    const result = await getTikTokInfos(TIKTOK_URL);

    expect(result).not.toHaveProperty("error");
    if ("error" in result) throw new Error(result.error);
    if (!("format" in result)) throw new Error("Expected VideoData but got TikTokPhotoData");

    // Video details
    expect(result.video_details.title).toBeTruthy();
    expect(result.video_details.author).toBeTruthy();
    expect(Number(result.video_details.duration)).toBeGreaterThan(0);
    expect(result.video_details.thumbnail).toMatch(/^https?:\/\//);

    // Formats — exactly 3 fixed sentinels
    expect(result.format).toHaveLength(3);
    const itags = result.format.map((f: { itag: number }) => f.itag);
    expect(itags).toContain(TIKTOK_ITAG.WATERMARK);
    expect(itags).toContain(TIKTOK_ITAG.NO_WATERMARK);
    expect(itags).toContain(TIKTOK_ITAG.AUDIO);
  }, 30_000);

  itLocal("getVideoInfos routes TikTok URL to getTikTokInfos", async () => {
    const result = await getVideoInfos(TIKTOK_URL);

    expect(result).not.toHaveProperty("error");
    if ("error" in result) throw new Error(String((result as { error: unknown }).error));

    expect(result.format).toHaveLength(3);
    expect(result.format[0].itag).toBe(TIKTOK_ITAG.WATERMARK);
  }, 30_000);
});
