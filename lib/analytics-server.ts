type ServerData = Record<string, string | number | boolean | null | undefined>;

interface TrackContext {
  url?: string;
  hostname?: string;
  userAgent?: string;
  language?: string;
  referrer?: string;
}

export async function trackServer(
  event: string,
  data?: ServerData,
  context?: TrackContext,
): Promise<void> {
  const umamiUrl = process.env.UMAMI_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!umamiUrl || !websiteId) return;

  await fetch(`${umamiUrl}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": context?.userAgent ?? "Mozilla/5.0 (compatible; StroyGetter/1.0)",
    },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: websiteId,
        url: context?.url ?? "/",
        hostname:
          context?.hostname ??
          new URL(process.env.SITE_URL ?? "https://stroygetter.fr").hostname,
        language: context?.language ?? "",
        referrer: context?.referrer ?? "",
        name: event,
        data,
      },
    }),
  }).catch(() => {});
}
