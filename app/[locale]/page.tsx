import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, Disc3, Download, Film, Link as LinkIcon, Music, Scale } from "lucide-react";
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
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: buildAlternates(locale, ""),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const GLOSSARY = [
    { term: t("glossaryMp4Term"), def: t("glossaryMp4") },
    { term: t("glossaryH264Term"), def: t("glossaryH264") },
    { term: t("glossaryMp3Term"), def: t("glossaryMp3") },
    { term: t("glossaryId3Term"), def: t("glossaryId3") },
    { term: t("glossaryResolutionTerm"), def: t("glossaryRes") },
    { term: t("glossarySampleRateTerm"), def: t("glossarySampleRate") },
  ];

  const HOW_STEPS = [
    { Icon: LinkIcon, n: "01", title: t("step1Title"), body: t("step1Body") },
    { Icon: Scale, n: "02", title: t("step2Title"), body: t("step2Body") },
    { Icon: Download, n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const FORMATS = [
    {
      Icon: Disc3,
      title: t("formatLibraryReadyTitle"),
      meta: t("formatLibraryReadyMeta"),
      badge: t("formatLibraryReadyBadge"),
      desc: t("formatLibraryReadyDesc"),
      features: [
        t("formatLibraryReadyFeature1"),
        t("formatLibraryReadyFeature2"),
        t("formatLibraryReadyFeature3"),
        t("formatLibraryReadyFeature4"),
      ],
      featured: true,
    },
    {
      Icon: Film,
      title: t("formatMp4Title"),
      meta: t("formatMp4Meta"),
      desc: t("formatMp4Desc"),
      features: [
        t("formatMp4Feature1"),
        t("formatMp4Feature2"),
        t("formatMp4Feature3"),
        t("formatMp4Feature4"),
      ],
      featured: false,
      badge: undefined,
    },
    {
      Icon: Music,
      title: t("formatMp3Title"),
      meta: t("formatMp3Meta"),
      desc: t("formatMp3Desc"),
      features: [t("formatMp3Feature1"), t("formatMp3Feature2")],
      featured: false,
      badge: undefined,
    },
    {
      Icon: Film,
      title: t("formatTiktokTitle"),
      meta: t("formatTiktokMeta"),
      desc: t("formatTiktokDesc"),
      features: [
        t("formatTiktokFeature1"),
        t("formatTiktokFeature2"),
        t("formatTiktokFeature3"),
      ],
      featured: false,
      badge: undefined,
    },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
    { q: t("faqTiktok1Q"), a: t("faqTiktok1A") },
    { q: t("faqTiktok2Q"), a: t("faqTiktok2A") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to download a YouTube video with StroyGetter",
          description:
            "Download any public YouTube video as MP4, MP3 or Library Ready in three steps — no install, no signup.",
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
            {t.rich("heroDesc", {
              libraryReady: (chunks) => (
                <strong className="font-semibold text-white">{chunks}</strong>
              ),
            })}
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((f) => (
              <div
                key={f.title}
                className={`flex flex-col gap-4 rounded-2xl border p-7 ${
                  f.featured ? "border-stroy-300/30 bg-stroy-700" : "border-white/6 bg-stroy-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/6 text-stroy-100">
                    <f.Icon size={18} />
                  </div>
                  {f.badge && (
                    <span className="rounded-full bg-stroy-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stroy-900">
                      {f.badge}
                    </span>
                  )}
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
                {f.featured && (
                  <Link
                    href="/library-ready"
                    className="mt-1 text-[12px] font-semibold text-stroy-300 underline underline-offset-2 hover:text-white"
                  >
                    {t("formatLibraryReadyLearnMore")}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-white/50">{t("formatsDisclaimer")}</p>
        </div>
      </section>

      {/* ── FAQ + GLOSSARY ── */}
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

            <aside id="glossary" className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/6 bg-black/18 p-7">
                <h3 className="mb-1.5 text-xl font-bold tracking-tight">{t("glossaryTitle")}</h3>
                <p className="mb-5 text-sm leading-snug text-white/65">{t("glossaryDesc")}</p>
                <div className="flex flex-col gap-1">
                  {GLOSSARY.map((g) => (
                    <div
                      key={g.term}
                      className="flex cursor-default items-center justify-between rounded-lg px-3.5 py-3 text-sm transition-colors hover:bg-white/5"
                    >
                      <span className="font-semibold">{g.term}</span>
                      <span className="font-mono text-[11px] text-white/50">{g.def}</span>
                    </div>
                  ))}
                </div>
              </div>

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
