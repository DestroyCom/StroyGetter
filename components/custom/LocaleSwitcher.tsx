"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  "fr-FR": "FR",
  "es-ES": "ES",
  "pt-BR": "PT",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: string) {
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="flex items-center gap-0.5">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => handleChange(l)}
          className={
            l === locale
              ? "rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
              : "rounded px-1.5 py-0.5 text-[11px] font-bold text-white/40 transition-colors hover:text-white/80"
          }
          aria-label={`Switch to ${l}`}
          aria-current={l === locale ? "true" : undefined}
        >
          {LOCALE_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
