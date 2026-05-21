import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/custom/JsonLd";
import { buildAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import { updates } from "@/lib/updates";

export function generateStaticParams() {
  return updates.flatMap((u) => routing.locales.map((locale) => ({ locale, slug: u.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const update = updates.find((u) => u.slug === slug);
  if (!update) return {};
  const path = `/updates/${update.slug}`;
  return {
    title: `${update.title} — StroyGetter`,
    description: update.description,
    keywords: update.keywords,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title: update.title,
      description: update.description,
      url: `${siteConfig.url}/updates/${update.slug}`,
    },
  };
}

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("updates");

  const update = updates.find((u) => u.slug === slug);
  if (!update) notFound();

  const currentIndex = updates.findIndex((u) => u.slug === slug);
  const prev = updates[currentIndex + 1] ?? null;
  const next = updates[currentIndex - 1] ?? null;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: update.title,
          description: update.description,
          datePublished: update.date,
          author: {
            "@type": "Organization",
            name: "StroyCo",
            url: siteConfig.stroycoUrl,
          },
          publisher: {
            "@type": "Organization",
            name: "StroyCo",
            url: siteConfig.stroycoUrl,
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${siteConfig.url}/updates/${update.slug}`,
          },
        }}
      />

      <article className="bg-stroy-500 px-4 py-16 md:px-14">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/updates"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            {t("backLabel")}
          </Link>

          <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em] text-stroy-300">
            <span>{t("updateLabel")}</span>
            <span>·</span>
            <span>{formatDate(update.date)}</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px]">
            {update.title}
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-white/82">{update.description}</p>

          <div className="mb-10 flex items-center gap-3 border-b border-white/8 pb-8 text-sm text-white/70">
            <div className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-stroy-700 text-xs font-bold text-white">
              SG
            </div>
            <div>
              <p className="font-semibold text-white">StroyGetter team</p>
              <p className="text-xs">Open source · MIT licensed</p>
            </div>
          </div>

          <div className="space-y-10 text-base leading-[1.75] text-white/88">
            {update.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">
                  {section.heading}
                </h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-white/10 bg-stroy-800 p-10 text-center">
            <h3 className="mb-3 text-2xl font-bold tracking-tight">{t("ctaTitle")}</h3>
            <p className="mb-6 text-white/75">{t("ctaDesc")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
            >
              Open the downloader
              <ArrowRight size={18} />
            </Link>
          </div>

          {(prev || next) && (
            <nav className="mt-10 flex gap-4">
              {prev && (
                <Link
                  href={`/updates/${prev.slug}`}
                  className="flex flex-1 flex-col gap-1 rounded-2xl border border-white/8 bg-black/20 p-6 transition-colors hover:border-white/20"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stroy-300">
                    {t("olderLabel")}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white/85">
                    {prev.title}
                  </span>
                </Link>
              )}
              {next && (
                <Link
                  href={`/updates/${next.slug}`}
                  className="flex flex-1 flex-col items-end gap-1 rounded-2xl border border-white/8 bg-black/20 p-6 text-right transition-colors hover:border-white/20"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stroy-300">
                    {t("newerLabel")}
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white/85">
                    {next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </article>
    </>
  );
}
