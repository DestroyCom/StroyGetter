## i18n — Adding a new locale or language variant

Active locales (BCP 47): `en`, `fr-FR`, `es-419`, `pt-BR`.

**To add a new locale** (e.g. `fr-CA`, `pt-PT`, `es-MX`):

1. Add the locale code to `locales` in `i18n/routing.ts`
2. Create `messages/<locale>.json` — copy the closest existing locale as a base
3. Add a display label in `components/custom/LocaleSwitcher.tsx` (`LOCALE_LABELS`)
4. Translate `messages/<locale>.json`

Everything else (sitemap, hreflang alternates, static params) auto-updates via `buildAlternates()` in `i18n/metadata.ts` and `routing.locales`.

**Locale code conventions used here:**

- Generic English: `en` (covers all regions — do NOT use `en-US`)
- French France: `fr-FR`
- Latin American Spanish: `es-419` (UN M.49 region code, Google-supported)
- Brazilian Portuguese: `pt-BR`
