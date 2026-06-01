import { describe, expect, it, vi, beforeEach } from "vitest";
import { detectTiktokType } from "@/lib/tiktok-detect";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("detectTiktokType", () => {
  it("returns 'photo' for explicit /photo/ URL", async () => {
    const result = await detectTiktokType(
      "https://www.tiktok.com/@user/photo/7646118320072330518"
    );
    expect(result).toBe("photo");
  });

  it("returns 'video' for explicit /video/ URL", async () => {
    const result = await detectTiktokType(
      "https://www.tiktok.com/@user/video/7642004084970540321"
    );
    expect(result).toBe("video");
  });

  it("returns 'photo' for short URL that resolves to /photo/", async () => {
    mockFetch.mockResolvedValueOnce({
      url: "https://www.tiktok.com/@user/photo/7646118320072330518?params=abc",
    });
    const result = await detectTiktokType("https://vm.tiktok.com/ZN92BN73vPy4j-1KTiG/");
    expect(result).toBe("photo");
    expect(mockFetch).toHaveBeenCalledWith("https://vm.tiktok.com/ZN92BN73vPy4j-1KTiG/", {
      method: "HEAD",
      redirect: "follow",
      signal: expect.any(AbortSignal),
    });
  });

  it("returns 'video' for short URL that resolves to /video/", async () => {
    mockFetch.mockResolvedValueOnce({
      url: "https://www.tiktok.com/@user/video/7642004084970540321",
    });
    const result = await detectTiktokType("https://vm.tiktok.com/ZMkABCDEF/");
    expect(result).toBe("video");
  });

  it("returns 'video' as fallback when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await detectTiktokType("https://vm.tiktok.com/ZMkABCDEF/");
    expect(result).toBe("video");
  });
});
