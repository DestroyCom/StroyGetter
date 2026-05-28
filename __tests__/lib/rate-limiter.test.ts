import { beforeEach, describe, expect, it, vi } from "vitest";

vi.useFakeTimers();

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.setSystemTime(0);
    vi.resetModules();
  });

  it("returns false for the first request", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    expect(fn("1.2.3.4")).toBe(false);
  });

  it("allows up to 10 requests in the window", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) {
      expect(fn("1.2.3.4")).toBe(false);
    }
  });

  it("blocks the 11th request within the window", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    expect(fn("1.2.3.4")).toBe(true);
  });

  it("does not affect a different IP", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    expect(fn("5.6.7.8")).toBe(false);
  });

  it("allows requests again after the window expires", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    vi.setSystemTime(61_000);
    expect(fn("1.2.3.4")).toBe(false);
  });

  it("uses a sliding window — only old timestamps expire", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 9; i++) fn("1.2.3.4");
    vi.setSystemTime(30_000);
    expect(fn("1.2.3.4")).toBe(false); // 10th — allowed
    expect(fn("1.2.3.4")).toBe(true);  // 11th — blocked
    vi.setSystemTime(61_000);
    expect(fn("1.2.3.4")).toBe(false); // 9 expired, 1+1=2 remain
  });
});
