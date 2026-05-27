import { describe, expect, it } from "vitest";
import { sanitizeFilename, yt_validate, tiktok_validate, detectSource } from "@/lib/serverUtils";

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
  it("returns 'video' for a watch URL with playlist + index (Liked Videos)", () => {
    expect(yt_validate("https://www.youtube.com/watch?v=9ydC2pUQpNQ&list=LL&index=21")).toBe(
      "video"
    );
  });
  it("returns 'video' for a YouTube Mix / Radio URL", () => {
    expect(
      yt_validate(
        "https://www.youtube.com/watch?v=luotSpkyCVU&list=RDluotSpkyCVU&start_radio=1"
      )
    ).toBe("video");
  });
  it("returns 'video' for a youtu.be URL with si= tracking param", () => {
    expect(yt_validate("https://youtu.be/V4xJnVfhxC0?si=xgDAcG4wCcZFYHpZ")).toBe("video");
  });
  it("returns 'video' for a watch URL with pp= recommendation param", () => {
    expect(
      yt_validate(
        "https://www.youtube.com/watch?v=JYo_KgYXhMQ&pp=ygUVeWFtYW1vdG8ncyByYWdlIHRoZW1l"
      )
    ).toBe("video");
  });
  it("returns false for a playlist-only URL (no video ID)", () => {
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

describe("tiktok_validate", () => {
  it("returns 'video' for a standard tiktok.com URL", () => {
    expect(tiktok_validate("https://www.tiktok.com/@honor_france/video/7568900679792708896")).toBe("video");
  });
  it("returns 'video' without www", () => {
    expect(tiktok_validate("https://tiktok.com/@user/video/1234567890123456789")).toBe("video");
  });
  it("returns 'video' for a vm.tiktok.com short URL", () => {
    expect(tiktok_validate("https://vm.tiktok.com/ZMkABCDEF/")).toBe("video");
  });
  it("returns false for a YouTube URL", () => {
    expect(tiktok_validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(false);
  });
  it("returns false for a plain search query", () => {
    expect(tiktok_validate("tiktok dance")).toBe(false);
  });
  it("returns false for http (not https)", () => {
    expect(tiktok_validate("http://www.tiktok.com/@user/video/123")).toBe(false);
  });
});

describe("detectSource", () => {
  it("returns 'youtube' for a YouTube URL", () => {
    expect(detectSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("youtube");
  });
  it("returns 'youtube' for a youtu.be URL", () => {
    expect(detectSource("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });
  it("returns 'tiktok' for a tiktok.com URL", () => {
    expect(detectSource("https://www.tiktok.com/@user/video/123456789")).toBe("tiktok");
  });
  it("returns 'tiktok' for a vm.tiktok.com URL", () => {
    expect(detectSource("https://vm.tiktok.com/ZMkABCDEF/")).toBe("tiktok");
  });
  it("returns null for an unknown URL", () => {
    expect(detectSource("https://example.com/video")).toBeNull();
  });
  it("returns null for plain text", () => {
    expect(detectSource("rick roll")).toBeNull();
  });
});
