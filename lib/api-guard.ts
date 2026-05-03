/**
 * Best-effort check that a request likely came from the StroyGetter frontend.
 *
 * Sec-Fetch-Site and Referer are trivially spoofable — they are not suitable
 * for access control and only act as a client fingerprint for ordinary
 * browsers. For real protection, add auth (Authorization header / signed
 * cookie) or issue short-lived HMAC tokens tied to the user session.
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
