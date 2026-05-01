import { describe, expect, it } from "vitest";
import { extractVideoId } from "@/lib/innertube";

describe("extractVideoId", () => {
  it("extracts ID from a standard watch URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("extracts ID from a youtu.be URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("extracts ID from a Shorts URL", () => {
    expect(extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("extracts ID from a watch URL with extra query params", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")).toBe("dQw4w9WgXcQ");
  });
  it("extracts ID from an embed URL", () => {
    expect(extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("returns null for a non-YouTube URL", () => {
    expect(extractVideoId("https://example.com")).toBeNull();
  });
  it("returns null for a plain string", () => {
    expect(extractVideoId("rick roll")).toBeNull();
  });
});
