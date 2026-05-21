import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/legal/privacy";
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("privacyH1"),
    description: t("privacyMetaDesc"),
    alternates: buildAlternates(locale, path),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const SECTIONS = [
    { n: "01", title: t("privacy01Title"), body: t("privacy01Body") },
    { n: "02", title: t("privacy02Title"), body: t("privacy02Body") },
    { n: "03", title: t("privacy03Title"), body: t("privacy03Body") },
    { n: "04", title: t("privacy04Title"), body: t("privacy04Body") },
    {
      n: "05",
      title: t("privacy05Title"),
      body: t("privacy05Body", { emailPrivacy: siteConfig.emailPrivacy }),
    },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        {t("privacyLastUpdated")}
      </p>
      <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-[44px]">{t("privacyH1")}</h1>

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
