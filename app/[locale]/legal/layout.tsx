import { Shield } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const LEGAL_NAV = [
    { href: "/legal/terms", label: t("navTerms") },
    { href: "/legal/acceptable-use", label: t("navAcceptableUse") },
    { href: "/legal/privacy", label: t("navPrivacy") },
    { href: "/legal/cookies", label: t("navCookies") },
    { href: "/legal/dmca", label: t("navDmca") },
    { href: "/legal/contact", label: t("navContact") },
  ];

  return (
    <div className="bg-stroy-500 px-4 py-12 md:px-14">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[240px_1fr]">
        <aside>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            {t("sidebarLabel")}
          </p>
          <nav className="flex flex-col gap-1" aria-label={t("sidebarNavAriaLabel")}>
            {LEGAL_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2.5 text-sm text-white/65 transition-all hover:bg-white/4 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-xl bg-black/20 p-4 text-xs leading-relaxed text-white/65">
            <Shield size={16} className="mb-2 text-stroy-300" />
            {t("sidebarNote")}
          </div>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
