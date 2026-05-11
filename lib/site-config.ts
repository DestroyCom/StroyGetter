/**
 * Central site configuration — all values come from environment variables
 * with sensible defaults so the app runs locally without a full .env.
 *
 * NEXT_PUBLIC_* vars are bundled into the client; the others are server-only.
 */

export const siteConfig = {
  /** Canonical base URL, no trailing slash */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://stroygetter.stroyco.eu",

  /** GitHub repository URL */
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ??
    "https://github.com/DestroyCom/StroyGetter",

  /** DMCA / copyright takedown email */
  emailDmca:
    process.env.NEXT_PUBLIC_EMAIL_DMCA ?? "dmca@contact-stroygetter.stroyco.eu",

  /** Privacy policy contact email */
  emailPrivacy:
    process.env.NEXT_PUBLIC_EMAIL_PRIVACY ??
    "privacy@contact-stroygetter.stroyco.eu",

  /** StroyCo organisation website */
  stroycoUrl:
    process.env.NEXT_PUBLIC_STROYCO_URL ?? "https://portfolio.stroyco.eu",

  /** StroyCord Discord server */
  discordUrl:
    process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://stroycord.stroyco.eu",

  /** Stroybot website */
  botUrl: process.env.NEXT_PUBLIC_BOT_URL ?? "https://stroybot.stroyco.eu",
} as const;
