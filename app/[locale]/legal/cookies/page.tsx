import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/legal/cookies";
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("cookiesH1"),
    description: t("cookiesMetaDesc"),
    alternates: buildAlternates(locale, path),
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  return (
    <div className="mb-16">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        {t("cookiesLastUpdated")}
      </p>
      <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-[44px]">{t("cookiesH1")}</h1>

      <div className="space-y-8 text-sm leading-[1.75] text-white/82">
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">01</span>
            {t("cookies01Title")}
          </h2>
          <p>{t("cookies01Body")}</p>
        </div>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">02</span>
            {t("cookies02Title")}
          </h2>
          <p>{t("cookies02Body")}</p>
        </div>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">03</span>
            {t("cookies03Title")}
          </h2>
          <p>{t("cookies03Body")}</p>
        </div>
      </div>
    </div>
  );
}
