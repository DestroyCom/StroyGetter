/**
 * Central site configuration — all values are server-only runtime env vars.
 * Client components that import this will get the hardcoded defaults (baked at build).
 * Never use NEXT_PUBLIC_ here — we host pre-built images and configure at runtime.
 */

export const siteConfig = {
  /** Canonical base URL, no trailing slash */
  url: (process.env.SITE_URL ?? "https://stroygetter.fr").replace(/\/+$/, ""),

  /** GitHub repository URL */
  githubUrl:
    process.env.GITHUB_URL ?? "https://github.com/DestroyCom/StroyGetter",

  /** GitHub repository URL for the native app */
  githubNativeUrl:
    process.env.GITHUB_NATIVE_URL ?? "https://github.com/DestroyCom/Stroygetter-Native",

  /** DMCA / copyright takedown email */
  emailDmca: process.env.EMAIL_DMCA ?? "",

  /** Privacy policy contact email */
  emailPrivacy: process.env.EMAIL_PRIVACY ?? "",

  /** StroyCo organisation website */
  stroycoUrl: process.env.STROYCO_URL ?? "https://portfolio.stroyco.eu",

  /** StroyCord Discord server */
  discordUrl: process.env.DISCORD_URL ?? "https://stroycord.stroyco.eu",

  /** Stroybot website */
  botUrl: process.env.BOT_URL ?? "https://stroybot.stroyco.eu",

  /** Google Search Console verification token */
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION ?? "",

  /** Yandex Webmaster verification token */
  yandexVerification: process.env.YANDEX_SITE_VERIFICATION ?? "",

  /** Bing Webmaster verification token */
  bingVerification: process.env.BING_SITE_VERIFICATION ?? "",

  /** Umami analytics self-hosted instance base URL */
  umamiUrl: process.env.UMAMI_URL ?? "",

  /** Umami website ID for stroygetter.fr */
  umamiWebsiteId: process.env.UMAMI_WEBSITE_ID ?? "",

  /** News banner text — non-empty string enables the banner, empty/unset hides it */
  bannerText: process.env.BANNER_TEXT ?? "",

  /** News banner link — optional relative path (e.g. /tiktok) or absolute URL */
  bannerHref: process.env.BANNER_HREF ?? "",

  /** Platform feature flags — set to "false" to disable a platform entirely */
  enableYoutube: process.env.ENABLE_YOUTUBE !== "false",
  enableTiktok: process.env.ENABLE_TIKTOK !== "false",
  enableTwitch: process.env.ENABLE_TWITCH !== "false",
} as const;
