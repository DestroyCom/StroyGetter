/**
 * Blocks requests that do not originate from the StroyGetter frontend.
 *
 * Browsers automatically set Sec-Fetch-Site: same-origin for same-origin
 * fetch() calls. curl and direct navigation do not, so they get a 403.
 * A Referer fallback covers the (rare) case of browsers that omit Sec-Fetch-Site.
 */
export function guardApiRequest(request: Request): Response | null {
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
