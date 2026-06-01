import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";

const TIKTOK_CDN_HOSTNAMES = [
  ".tiktokcdn-eu.com",
  ".tiktokcdn.com",
  ".tiktokv.com",
  ".tiktokcdn-us.com",
];

function isTiktokCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return TIKTOK_CDN_HOSTNAMES.some((suffix) => parsed.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("tiktok-image");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    const params = new URL(request.url).searchParams;
    const imageUrl = params.get("url");
    const index = params.get("index") ?? "1";

    if (!imageUrl) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }

    if (!isTiktokCdnUrl(imageUrl)) {
      log.warn({ imageUrl }, "Rejected non-TikTok CDN URL");
      return new Response("Invalid image URL", { status: 400 });
    }

    log.info({ imageUrl, index }, "Proxying TikTok image download");

    let upstream: Response;
    try {
      upstream = await fetch(imageUrl, {
        headers: { Referer: "https://www.tiktok.com/" },
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      log.error({ err, imageUrl }, "Failed to fetch image from TikTok CDN");
      return new Response("Failed to fetch image", { status: 502 });
    }

    if (!upstream.ok) {
      log.warn({ status: upstream.status, imageUrl }, "TikTok CDN returned non-OK status");
      return new Response("Image not available", { status: upstream.status });
    }

    const contentLength = upstream.headers.get("content-length");

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="tiktok-photo-${index}.jpg"`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
      },
    });
  });
}
