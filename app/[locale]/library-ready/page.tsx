import {
  ArrowRight,
  Check,
  Disc3,
  FileMusic,
  Image as ImageIcon,
  MicVocal,
  Tag,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { GetterInputServer } from "@/components/custom/GetterInputServer";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/library-ready";
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return {
    title: tMeta("libraryReadyTitle"),
    description: tMeta("libraryReadyDesc"),
    keywords: [
      "youtube to mp3 with album art",
      "youtube to mp3 id3 tags",
      "youtube to mp3 with cover art",
      "youtube mp3 with lyrics",
      "youtube music downloader metadata",
      "download youtube music apple music",
      "youtube to mp3 itunes ready",
      "youtube mp3 synced lyrics",
      "youtube to mp3 with artwork",
      "library ready mp3",
      "youtube music to plex",
      "youtube mp3 fully tagged",
    ],
    alternates: buildAlternates(locale, path),
    openGraph: {
      title: tMeta("libraryReadyTitle"),
      description: tMeta("libraryReadyDesc"),
      url: `${siteConfig.url}/${locale}/library-ready`,
    },
  };
}

export default async function LibraryReadyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("libraryReady");
  const tCommon = await getTranslations("common");

  const COMPARE_ROWS = [
    { feature: t("compareRow1"), us: true, others: false },
    { feature: t("compareRow2"), us: true, others: "partial" as const },
    { feature: t("compareRow3"), us: true, others: false },
    { feature: t("compareRow4"), us: true, others: false },
    { feature: t("compareRow5"), us: true, others: true },
    { feature: t("compareRow6"), us: true, others: false },
  ];

  const FEATURES = [
    { Icon: ImageIcon, title: t("feature1Title"), desc: t("feature1Desc") },
    { Icon: Tag, title: t("feature2Title"), desc: t("feature2Desc") },
    { Icon: MicVocal, title: t("feature3Title"), desc: t("feature3Desc") },
    { Icon: FileMusic, title: t("feature4Title"), desc: t("feature4Desc") },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "StroyGetter — Library Ready",
          url: `${siteConfig.url}/library-ready`,
          description:
            "Download YouTube music as a fully tagged MP3 — cover art, artist, album, year and synced lyrics embedded automatically.",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          featureList: [
            t("feature1Title"),
            t("feature2Title"),
            t("feature3Title"),
            t("feature4Title"),
          ],
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* ── HERO ── */}
      <section className="bg-stroy-500 px-4 py-20 md:py-28" id="hero">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stroy-300/30 bg-stroy-700/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            <Disc3 size={12} />
            {t("badge")}
          </div>

          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            {t("heroTitle")}
            <br />
            <em className="font-light italic text-white/78">{t("heroSubtitle")}</em>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            {t("heroDesc")}
          </p>

          <Suspense fallback={<SkeletonInput />}>
            <GetterInputServer />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            {[t("heroBadge1"), t("heroBadge2"), t("heroBadge3"), t("heroBadge4")].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <Check size={14} className="text-stroy-300" /> {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("featuresLabel")}
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("featuresTitle")}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-8"
              >
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <f.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="grid gap-14 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("whyLabel")}
              </p>
              <h2 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("whyTitle")}
              </h2>
              <div className="space-y-4 text-white/80">
                <p className="text-base leading-relaxed">
                  {t.rich("whyP1", {
                    unknownArtist: (chunks) => <strong className="text-white">{chunks}</strong>,
                  })}
                </p>
                <p className="text-base leading-relaxed">{t("whyP2")}</p>
                <p className="text-base leading-relaxed">{t("whyP3")}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-stroy-800 p-8">
              <h3 className="mb-5 text-lg font-bold tracking-tight">{t("compareTitle")}</h3>
              <div className="mb-2 grid grid-cols-3 gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span />
                <span className="text-center text-red-400/70">{t("compareWithout")}</span>
                <span className="text-center text-stroy-300">{t("compareWith")}</span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    label: t("withLabel1"),
                    without: t("withoutRow1Artist"),
                    with: t("withRow1Artist"),
                  },
                  { label: t("withLabel2"), without: t("withoutRow1Art"), with: t("withRow1Art") },
                  {
                    label: t("withLabel3"),
                    without: t("withoutRow1Lyrics"),
                    with: t("withRow1Lyrics"),
                  },
                  {
                    label: t("withLabel4"),
                    without: t("withoutRow1Album"),
                    with: t("withRow1Album"),
                  },
                  {
                    label: t("withLabel5"),
                    without: t("withoutRow1Time"),
                    with: t("withRow1Time"),
                  },
                ].map(({ label, without, with: withVal }) => (
                  <div
                    key={label}
                    className="grid grid-cols-3 items-center gap-2 rounded-xl bg-white/4 px-4 py-3 text-sm"
                  >
                    <span className="text-xs font-medium text-white/70">{label}</span>
                    <span className="rounded-md bg-red-500/15 px-2 py-1 text-center text-[11px] font-semibold text-red-300">
                      {without}
                    </span>
                    <span className="rounded-md bg-stroy-400/20 px-2 py-1 text-center text-[11px] font-semibold text-stroy-200">
                      {withVal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("compareLabel")}
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("compareSection")}
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03]">
                  <th className="px-6 py-4 text-left font-semibold text-white/60">
                    {t("compareHeaderFeature")}
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-stroy-200">
                    {t("compareHeaderUs")}
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-white/50">
                    {t("compareHeaderOthers")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(({ feature, us, others }, i) => (
                  <tr
                    key={feature}
                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                  >
                    <td className="px-6 py-4 text-white/80">{feature}</td>
                    <td className="px-6 py-4 text-center">
                      {us ? (
                        <Check size={18} className="mx-auto text-stroy-300" />
                      ) : (
                        <X size={18} className="mx-auto text-red-400/60" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {others === true ? (
                        <Check size={18} className="mx-auto text-white/40" />
                      ) : others === "partial" ? (
                        <span className="text-xs text-white/40">{t("comparePartial")}</span>
                      ) : (
                        <X size={18} className="mx-auto text-red-400/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            {t("faqLabel")}
          </p>
          <h2 className="mb-10 text-balance text-4xl font-bold leading-tight tracking-tight">
            {t("faqTitle")}
          </h2>

          <div className="space-y-5">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5"
              >
                <h3 className="mb-2 font-bold text-white">{f.q}</h3>
                <p className="text-sm leading-relaxed text-white/75">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-stroy-800 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Disc3 size={40} className="mx-auto mb-6 text-stroy-300" />
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight">{t("ctaTitle")}</h2>
          <p className="mb-8 text-lg text-white/70">{t("ctaDesc")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
          >
            {tCommon("openDownloader")}
            <ArrowRight size={18} />
          </Link>
          <p className="mt-5 text-xs text-white/40">
            {t("ctaReadMore")}{" "}
            <Link
              href="/how-to-use-library-ready"
              className="underline underline-offset-2 hover:text-white/70"
            >
              {t("ctaReadMoreLink")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
