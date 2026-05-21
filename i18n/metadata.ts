import { siteConfig } from "@/lib/site-config";
import { routing } from "./routing";

export function buildAlternates(locale: string, path: string) {
  const base = siteConfig.url;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${base}/${l}${path}`;
  }
  languages["x-default"] = `${base}/${routing.defaultLocale}${path}`;
  return {
    canonical: `${base}/${locale}${path}`,
    languages,
  };
}
