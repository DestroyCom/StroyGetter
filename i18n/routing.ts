import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr-FR", "es-ES", "pt-BR"],
  defaultLocale: "en",
  localePrefix: "always",
});
