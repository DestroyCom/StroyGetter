import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limiter", () => ({
  isRateLimited: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/request-context", () => ({
  getLog: vi.fn(() => ({
    warn: vi.fn(),
  })),
  hashIp: vi.fn((ip) => `hash(${ip})`),
}));

import { isRateLimited } from "@/lib/rate-limiter";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";

function makeRequest(headers: Record<string, string> = {}, url = "https://example.com/api/test") {
  return new Request(url, { headers });
}

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "9.10.11.12" });
    expect(getClientIp(req)).toBe("9.10.11.12");
  });

  it("falls back to 'unknown' when both headers are absent", () => {
    const req = makeRequest();
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("guardApiRequest", () => {
  it("returns null for a same-origin request (sec-fetch-site: same-origin)", () => {
    const req = makeRequest({ "sec-fetch-site": "same-origin" });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns null for a same-site request", () => {
    const req = makeRequest({ "sec-fetch-site": "same-site" });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns null when referer host matches request host", () => {
    const req = makeRequest({
      referer: "https://example.com/page",
      host: "example.com",
    });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns 403 for a cross-origin request with mismatched referer", () => {
    const req = makeRequest({
      "sec-fetch-site": "cross-site",
      referer: "https://attacker.com",
      host: "example.com",
    });
    const response = guardApiRequest(req);
    expect(response?.status).toBe(403);
  });

  it("returns 403 when both sec-fetch-site and referer are absent", () => {
    const req = makeRequest();
    const response = guardApiRequest(req);
    expect(response?.status).toBe(403);
  });

  it("returns 429 when the IP is rate-limited", () => {
    vi.mocked(isRateLimited).mockReturnValueOnce(true);
    const req = makeRequest({ "sec-fetch-site": "same-origin" });
    const response = guardApiRequest(req);
    expect(response?.status).toBe(429);
  });
});
