import { trackServer } from "@/lib/analytics-server";
import { isRateLimited } from "@/lib/rate-limiter";
import { getLog, hashIp } from "./request-context";

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function guardApiRequest(request: Request): Response | null {
  const log = getLog("api-guard");
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);
  const path = new URL(request.url).pathname;

  if (isRateLimited(ip)) {
    log.warn({ ipHash, path }, "Rate limit triggered");
    void trackServer("rate_limited", { ip_hash: ipHash, path });
    return new Response("Too Many Requests", { status: 429 });
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "same-site") return null;

  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  if (referer && host) {
    try {
      if (new URL(referer).host === host) return null;
    } catch {
      // malformed referer — deny
    }
  }

  log.warn(
    { ipHash, path, referer: referer ?? null, fetchSite: fetchSite ?? null },
    "Cross-origin request blocked"
  );
  return new Response("Forbidden", { status: 403 });
}
