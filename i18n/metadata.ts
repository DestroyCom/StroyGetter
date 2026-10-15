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

// For pages whose content only exists in English (guides, changelog entries):
// every locale URL renders the same text, so all of them point to the /en version
// as canonical. Otherwise search engines flag them as duplicate titles/descriptions.
export function buildEnglishOnlyAlternates(path: string) {
  const url = `${siteConfig.url}/${routing.defaultLocale}${path}`;
  return {
    canonical: url,
    languages: { [routing.defaultLocale]: url, "x-default": url },
  };
}
