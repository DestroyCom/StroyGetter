import { describe, expect, it } from "vitest";
import { sanitizeFilename, yt_validate } from "@/lib/serverUtils";

describe("yt_validate", () => {
  it("returns 'video' for a standard watch URL", async () => {
    expect(await yt_validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for a youtu.be short URL", async () => {
    expect(await yt_validate("https://youtu.be/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for a Shorts URL", async () => {
    expect(await yt_validate("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for an embed URL", async () => {
    expect(await yt_validate("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns false for a playlist URL", async () => {
    expect(await yt_validate("https://www.youtube.com/playlist?list=PLxyz123")).toBe(false);
  });
  it("returns false for a non-YouTube URL", async () => {
    expect(await yt_validate("https://example.com/video")).toBe(false);
  });
  it("returns false for a plain search query", async () => {
    expect(await yt_validate("rick roll")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("replaces spaces with underscores", async () => {
    expect(await sanitizeFilename("hello world")).toBe("hello_world");
  });
  it("strips accents/diacritics", async () => {
    expect(await sanitizeFilename("eau")).toBe("eau");
  });
  it("replaces forbidden characters with underscores", async () => {
    const result = await sanitizeFilename('title: "video"');
    expect(result).not.toContain(":");
    expect(result).not.toContain('"');
  });
  it("truncates filenames longer than 255 characters", async () => {
    expect((await sanitizeFilename("a".repeat(300))).length).toBeLessThanOrEqual(255);
  });
});
