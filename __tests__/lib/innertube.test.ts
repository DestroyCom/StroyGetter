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
  // URLs with playlist/extra params — the video ID must survive
  it("extracts ID from a watch URL with list= and index= (Liked Videos playlist)", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=9ydC2pUQpNQ&list=LL&index=21")).toBe(
      "9ydC2pUQpNQ"
    );
  });
  it("extracts ID from a YouTube Mix / Radio URL (list=RD...)", () => {
    expect(
      extractVideoId(
        "https://www.youtube.com/watch?v=luotSpkyCVU&list=RDluotSpkyCVU&start_radio=1"
      )
    ).toBe("luotSpkyCVU");
  });
  it("extracts ID from a youtu.be URL with si= tracking param", () => {
    expect(extractVideoId("https://youtu.be/V4xJnVfhxC0?si=xgDAcG4wCcZFYHpZ")).toBe("V4xJnVfhxC0");
  });
  it("extracts ID from a watch URL with pp= recommendation param", () => {
    expect(
      extractVideoId(
        "https://www.youtube.com/watch?v=JYo_KgYXhMQ&pp=ygUVeWFtYW1vdG8ncyByYWdlIHRoZW1l"
      )
    ).toBe("JYo_KgYXhMQ");
  });
  it("returns null for a non-YouTube URL", () => {
    expect(extractVideoId("https://example.com")).toBeNull();
  });
  it("returns null for a plain string", () => {
    expect(extractVideoId("rick roll")).toBeNull();
  });
});
