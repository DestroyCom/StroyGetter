type ServerData = Record<string, string | number | boolean | null | undefined>;

export async function trackServer(
  event: string,
  data?: ServerData,
  context?: { url?: string; hostname?: string },
): Promise<void> {
  const umamiUrl = process.env.UMAMI_URL;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!umamiUrl || !websiteId) return;

  await fetch(`${umamiUrl}/api/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "event",
      payload: {
        website: websiteId,
        url: context?.url ?? "/",
        hostname:
          context?.hostname ??
          new URL(process.env.SITE_URL ?? "https://stroygetter.fr").hostname,
        name: event,
        data,
      },
    }),
  }).catch(() => {});
}
