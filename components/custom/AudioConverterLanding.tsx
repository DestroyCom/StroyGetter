import { ArrowRight, Check, Download, Link as LinkIcon, Scale } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Fragment, Suspense } from "react";
import { FaqAccordion } from "@/components/custom/FaqAccordion";
import { GetterInputServer } from "@/components/custom/GetterInputServer";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { Link } from "@/i18n/navigation";

export type ConverterVariant = "mp3" | "wav";

const CROSS_LINKS: Record<ConverterVariant, { key: "crossLink1" | "crossLink2"; href: string }[]> =
  {
    mp3: [
      { key: "crossLink1", href: "/youtube-to-wav" },
      { key: "crossLink2", href: "/library-ready" },
    ],
    wav: [
      { key: "crossLink1", href: "/youtube-to-mp3" },
      { key: "crossLink2", href: "/library-ready" },
    ],
  };

/**
 * Shared landing page for the format-specific converters (/youtube-to-mp3, /youtube-to-wav).
 * Copy lives in `converter.<variant>`; the URL input forwards the format so /fetch preselects it.
 */
export async function AudioConverterLanding({ variant }: { variant: ConverterVariant }) {
  const t = await getTranslations(`converter.${variant}`);
  const tCommon = await getTranslations("converter.common");
  const path = `/youtube-to-${variant}`;

  const HOW_STEPS = [
    { Icon: LinkIcon, n: "01", title: t("step1Title"), body: t("step1Body") },
    { Icon: Scale, n: "02", title: t("step2Title"), body: t("step2Body") },
    { Icon: Download, n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const WHY = [
    { title: t("why1Title"), body: t("why1Body") },
    { title: t("why2Title"), body: t("why2Body") },
    { title: t("why3Title"), body: t("why3Body") },
  ];

  const FAQS = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: t("howToName"),
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
            <GetterInputServer defaultFormat={variant} />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            {[t("badge1"), t("badge2"), t("badge3"), t("badge4")].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <Check size={14} className="text-stroy-300" /> {badge}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-white/50">{tCommon("disclaimer")}</p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="how-it-works">
        <div className="mx-auto max-w-9xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            {tCommon("howItWorksLabel")}
          </p>
          <h2 className="mb-10 text-balance text-4xl font-bold leading-tight tracking-tight">
            {t("howItWorksTitle")}
          </h2>

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

      {/* ── WHY ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24" id="why">
        <div className="mx-auto max-w-9xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            {tCommon("whyLabel")}
          </p>
          <h2 className="mb-10 text-balance text-4xl font-bold leading-tight tracking-tight">
            {t("whyTitle")}
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            {WHY.map((w) => (
              <div
                key={w.title}
                className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-stroy-800 p-7"
              >
                <h3 className="text-[19px] font-bold tracking-tight">{w.title}</h3>
                <p className="text-sm leading-relaxed text-white/75">{w.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {CROSS_LINKS[variant].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white"
              >
                {t(l.key)} <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="faq">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            {tCommon("faqLabel")}
          </p>
          <h2 className="mb-8 text-balance text-4xl font-bold leading-tight tracking-tight">
            {t("faqTitle")}
          </h2>
          <FaqAccordion faqs={FAQS} page={path} />
        </div>
      </section>
    </>
  );
}
