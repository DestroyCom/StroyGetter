import { describe, expect, it } from "vitest";
import { sanitizeFilename, yt_validate } from "@/lib/serverUtils";

describe("yt_validate", () => {
  it("returns 'video' for a standard watch URL", () => {
    expect(yt_validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for a youtu.be short URL", () => {
    expect(yt_validate("https://youtu.be/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for a Shorts URL", () => {
    expect(yt_validate("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns 'video' for an embed URL", () => {
    expect(yt_validate("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("video");
  });
  it("returns false for a playlist URL", () => {
    expect(yt_validate("https://www.youtube.com/playlist?list=PLxyz123")).toBe(false);
  });
  it("returns false for a non-YouTube URL", () => {
    expect(yt_validate("https://example.com/video")).toBe(false);
  });
  it("returns false for a plain search query", () => {
    expect(yt_validate("rick roll")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("replaces spaces with underscores", () => {
    expect(sanitizeFilename("hello world")).toBe("hello_world");
  });
  it("strips accents/diacritics", () => {
    expect(sanitizeFilename("naïve café résumé")).toBe("naive_cafe_resume");
  });
  it("replaces forbidden characters with underscores", () => {
    const result = sanitizeFilename('title: "video"');
    expect(result).not.toContain(":");
    expect(result).not.toContain('"');
  });
  it("truncates filenames longer than 255 characters", () => {
    expect(sanitizeFilename("a".repeat(300)).length).toBeLessThanOrEqual(255);
  });
});
