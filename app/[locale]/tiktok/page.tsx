import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, Download, Film, Link as LinkIcon, Music, Scale } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fragment, Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("tiktokTitle"),
    description: t("tiktokDesc"),
    alternates: buildAlternates(locale, "/tiktok"),
    openGraph: {
      title: t("tiktokTitle"),
      description: t("tiktokDesc"),
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("tiktokTitle"),
      description: t("tiktokDesc"),
      images: ["/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function TikTokPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("tiktok");

  const HOW_STEPS = [
    { Icon: LinkIcon, n: "01", title: t("step1Title"), body: t("step1Body") },
    { Icon: Scale, n: "02", title: t("step2Title"), body: t("step2Body") },
    { Icon: Download, n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const FORMATS = [
    {
      Icon: Film,
      title: t("formatNoWmTitle"),
      meta: t("formatNoWmMeta"),
      desc: t("formatNoWmDesc"),
      features: [t("formatNoWmFeature1"), t("formatNoWmFeature2"), t("formatNoWmFeature3")],
      featured: true,
    },
    {
      Icon: Film,
      title: t("formatWmTitle"),
      meta: t("formatWmMeta"),
      desc: t("formatWmDesc"),
      features: [t("formatWmFeature1"), t("formatWmFeature2")],
      featured: false,
    },
    {
      Icon: Music,
      title: t("formatAudioTitle"),
      meta: t("formatAudioMeta"),
      desc: t("formatAudioDesc"),
      features: [t("formatAudioFeature1"), t("formatAudioFeature2")],
      featured: false,
    },
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
          "@type": "HowTo",
          name: "How to download a TikTok video without watermark",
          description:
            "Download any public TikTok video as MP4 (with or without watermark) or MP3 in three steps — no install, no signup.",
          step: HOW_STEPS.map((s) => ({
            "@type": "HowToStep",
            name: s.title,
            text: s.body,
          })),
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
      <section className="bg-stroy-500 px-4 py-20 md:py-28" id="home">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            {t("heroTitle")
              .split("\n")
              .map((line, i, arr) => (
                <Fragment key={line}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </Fragment>
              ))}
            <br />
            <em className="font-light italic text-white/78">{t("heroSubtitle")}</em>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            {t("heroDesc")}
          </p>

          <Suspense fallback={<SkeletonInput />}>
            <GetterInput />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            {[t("heroBadge1"), t("heroBadge2"), t("heroBadge3"), t("heroBadge4")].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <Check size={14} className="text-stroy-300" /> {badge}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-white/50">{t("heroDisclaimer")}</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="how-it-works">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("howItWorksLabel")}
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("howItWorksTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              {t("howItWorksDesc")}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-white/10 bg-white/2.5 p-8"
              >
                <span className="absolute right-7 top-7 font-mono text-xs tracking-wider text-white/40">
                  {s.n}
                </span>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <s.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATS ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24" id="formats">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("formatsLabel")}
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("formatsTitle")}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              {t("formatsDesc")}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FORMATS.map((f) => (
              <div
                key={f.title}
                className={`flex flex-col gap-4 rounded-2xl border p-7 ${
                  f.featured ? "border-stroy-300/30 bg-stroy-700" : "border-white/6 bg-stroy-800"
                }`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/6 text-stroy-100">
                  <f.Icon size={18} />
                </div>
                <div>
                  <h3 className="mb-1 text-[19px] font-bold tracking-tight">{f.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                    {f.meta}
                  </p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/75">{f.desc}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {f.features.map((feat) => (
                    <li
                      key={feat}
                      className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70"
                    >
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-white/50">{t("formatsDisclaimer")}</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="faq">
        <div className="mx-auto max-w-9xl">
          <div className="grid gap-14 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                {t("faqLabel")}
              </p>
              <h2 className="mb-8 text-balance text-4xl font-bold leading-tight tracking-tight">
                {t("faqTitle")}
              </h2>
              <Accordion type="single" collapsible className="flex flex-col gap-2">
                {FAQS.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${i}`}
                    className="rounded-xl border border-white/10 bg-white/2 px-5 data-[state=open]:border-white/20 data-[state=open]:bg-white/4"
                  >
                    <AccordionTrigger className="py-4 text-left text-[15px] font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-[1.65] text-white/75">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <aside className="flex flex-col gap-5">
              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-4 rounded-2xl border border-white/10 p-5 transition-colors hover:border-white/20 hover:bg-white/2"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-stroy-700">
                  <SiGithub size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{t("githubTitle")}</p>
                  <p className="text-xs text-white/65">{t("githubDesc")}</p>
                </div>
                <span className="text-white/60">→</span>
              </a>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
