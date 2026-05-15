import { isRateLimited } from "@/lib/rate-limiter";

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function guardApiRequest(request: Request): Response | null {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
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

  return new Response("Forbidden", { status: 403 });
}
