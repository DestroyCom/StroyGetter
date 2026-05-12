import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { updates } from "@/lib/updates";

const BASE = siteConfig.url;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    {
      url: `${BASE}/how-to-download-youtube-videos`,
      lastModified: new Date("2026-05-11"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/updates`,
      lastModified: new Date(updates[0].date),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...updates.map((u) => ({
      url: `${BASE}/updates/${u.slug}`,
      lastModified: new Date(u.date),
      changeFrequency: "never" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE}/legal/terms`,
      lastModified: new Date("2026-05-07"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/legal/privacy`,
      lastModified: new Date("2026-05-07"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/legal/cookies`,
      lastModified: new Date("2026-05-07"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/legal/dmca`,
      lastModified: new Date("2026-05-07"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/legal/contact`,
      lastModified: new Date("2026-05-07"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/legal/acceptable-use`,
      lastModified: new Date("2026-05-12"),
      changeFrequency: "yearly",
      priority: 0.4,
    }
  ];
}
