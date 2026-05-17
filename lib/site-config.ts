/**
 * Central site configuration — all values are server-only runtime env vars.
 * Client components that import this will get the hardcoded defaults (baked at build).
 * Never use NEXT_PUBLIC_ here — we host pre-built images and configure at runtime.
 */

export const siteConfig = {
  /** Canonical base URL, no trailing slash */
  url: (process.env.SITE_URL ?? "https://stroygetter.fr").replace(/\/+$/, ""),

  /** GitHub repository URL */
  githubUrl: process.env.GITHUB_URL ?? "https://github.com/DestroyCom/StroyGetter",

  /** DMCA / copyright takedown email */
  emailDmca: process.env.EMAIL_DMCA ?? "dmca@contact-stroygetter.stroyco.eu",

  /** Privacy policy contact email */
  emailPrivacy: process.env.EMAIL_PRIVACY ?? "privacy@contact-stroygetter.stroyco.eu",

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
} as const;
