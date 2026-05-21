import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/legal/terms";
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("termsH1"),
    description: t("termsMetaDesc"),
    robots: { index: true },
    alternates: buildAlternates(locale, path),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const SECTIONS = [
    { n: "01", title: t("terms01Title"), body: t("terms01Body") },
    { n: "02", title: t("terms02Title"), body: t("terms02Body") },
    { n: "03", title: t("terms03Title"), body: t("terms03Body") },
    {
      n: "04",
      title: t("terms04Title"),
      body: t("terms04Body", { dmcaEmail: siteConfig.emailDmca }),
    },
    { n: "05", title: t("terms05Title"), body: t("terms05Body") },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        {t("termsLastUpdated")}
      </p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-[44px]">{t("termsH1")}</h1>
      <div className="mb-8 rounded-r-xl border-l-2 border-stroy-400 bg-black/18 py-4 pl-5 pr-4 text-sm leading-relaxed text-white/75">
        {t.rich("termsIntro", {
          acceptableUseLink: (chunks) => (
            <Link
              href="/legal/acceptable-use"
              className="text-stroy-200 underline underline-offset-3 hover:text-white"
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
      <div className="space-y-8 text-sm leading-[1.75] text-white/82">
        {SECTIONS.map((s) => (
          <div key={s.n}>
            <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
              <span className="font-mono text-sm text-stroy-300">{s.n}</span>
              {s.title}
            </h2>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
