/**
 * Integration tests — hit the real YouTube API.
 * Run manually: pnpm test __tests__/integration
 * Skipped in CI by default (use .skip to restore normal test run).
 */
import { describe, expect, it } from "vitest";
import { extractVideoId, getInnertube } from "@/lib/innertube";

const itLocal = it.skipIf(!!process.env.CI);

const CASES = [
  {
    url: "https://www.youtube.com/watch?v=9ydC2pUQpNQ&list=LL&index=21",
    expectedTitle: "旅の途中",
    expectedId: "9ydC2pUQpNQ",
  },
  {
    url: "https://www.youtube.com/watch?v=luotSpkyCVU&list=RDluotSpkyCVU&start_radio=1",
    expectedTitle: "I Just Might",
    expectedId: "luotSpkyCVU",
  },
  {
    url: "https://youtu.be/V4xJnVfhxC0?si=xgDAcG4wCcZFYHpZ",
    expectedTitle: "Like you mean it",
    expectedId: "V4xJnVfhxC0",
  },
  {
    url: "https://www.youtube.com/watch?v=JYo_KgYXhMQ&pp=ygUVeWFtYW1vdG8ncyByYWdlIHRoZW1l",
    expectedTitle: "Yamamoto",
    expectedId: "JYo_KgYXhMQ",
  },
] as const;

describe("YouTube fetch integration — real network required", () => {
  itLocal.each(CASES)(
    "resolves '$expectedTitle' from $url",
    async ({ url, expectedTitle, expectedId }) => {
      // 1. Correct video ID extracted
      expect(extractVideoId(url)).toBe(expectedId);

      // 2. YouTube returns matching metadata
      const innertube = await getInnertube();
      const info = await innertube.getBasicInfo(expectedId);
      const title = info.basic_info.title ?? "";
      expect(title).toContain(expectedTitle);
    },
    15_000,
  );
});
