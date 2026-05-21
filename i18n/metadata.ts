import { routing } from "./routing";

/**
 * Builds hreflang alternates from the routing config.
 * Adding a new locale to routing.ts automatically propagates here.
 */
export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `/${l}${path}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return {
    canonical: `/${locale}${path}`,
    languages,
  };
}
