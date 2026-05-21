import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr-FR", "es-419", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "always",
});
