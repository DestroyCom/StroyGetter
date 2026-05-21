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
  const path = "/legal/acceptable-use";
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("acceptableUseH1"),
    description: t("acceptableUseMetaDesc"),
    robots: { index: true },
    alternates: buildAlternates(locale, path),
  };
}

export default async function AcceptableUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");

  const SECTIONS = [
    { n: "01", title: t("acceptableUse01Title"), body: t("acceptableUse01Body") },
    { n: "02", title: t("acceptableUse02Title"), body: t("acceptableUse02Body") },
    { n: "03", title: t("acceptableUse03Title"), body: t("acceptableUse03Body") },
    { n: "04", title: t("acceptableUse04Title"), body: t("acceptableUse04Body") },
    {
      n: "05",
      title: t("acceptableUse05Title"),
      body: t("acceptableUse05Body", { dmcaEmail: siteConfig.emailDmca }),
    },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        {t("acceptableUseLastUpdated")}
      </p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-[44px]">
        {t("acceptableUseH1")}
      </h1>
      <div className="mb-8 rounded-r-xl border-l-2 border-stroy-400 bg-black/18 py-4 pl-5 pr-4 text-sm leading-relaxed text-white/75">
        {t.rich("acceptableUseIntro", {
          termsLink: (chunks) => (
            <Link
              href="/legal/terms"
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
