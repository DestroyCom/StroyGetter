import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { updates } from "@/lib/updates";

const BASE = siteConfig.url;
const LOCALES = routing.locales;

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

// English-only content (guides, changelog entries): only the canonical /en URL is listed.
function englishEntry(
  path: string,
  lastModified: Date,
  changeFrequency: Freq,
  priority: number
): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/${routing.defaultLocale}${path}`, lastModified, changeFrequency, priority },
  ];
}

function localeEntries(
  path: string,
  lastModified: Date,
  changeFrequency: Freq,
  priority: number
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${BASE}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localeEntries("", new Date(), "monthly", 1),
    ...localeEntries("/app", new Date("2026-06-28"), "monthly", 0.9),
    ...localeEntries("/tiktok", new Date(), "monthly", 0.9),
    ...localeEntries("/youtube", new Date(), "monthly", 0.9),
    ...localeEntries("/twitch", new Date(), "monthly", 0.9),
    ...localeEntries("/library-ready", new Date("2026-05-20"), "monthly", 0.9),
    ...englishEntry("/how-to-use-library-ready", new Date("2026-05-20"), "monthly", 0.7),
    ...englishEntry("/how-to-download-youtube-videos", new Date("2026-05-11"), "monthly", 0.8),
    ...(updates.length > 0
      ? localeEntries("/updates", new Date(updates[0].date), "monthly", 0.7)
      : []),
    ...updates.flatMap((u) => englishEntry(`/updates/${u.slug}`, new Date(u.date), "never", 0.6)),
    ...localeEntries("/legal/terms", new Date("2026-05-07"), "yearly", 0.3),
    ...localeEntries("/legal/privacy", new Date("2026-05-07"), "yearly", 0.3),
    ...localeEntries("/legal/cookies", new Date("2026-05-07"), "yearly", 0.2),
    ...localeEntries("/legal/dmca", new Date("2026-05-07"), "yearly", 0.2),
    ...localeEntries("/legal/contact", new Date("2026-05-07"), "yearly", 0.2),
    ...localeEntries("/legal/acceptable-use", new Date("2026-05-12"), "yearly", 0.4),
  ];
}
