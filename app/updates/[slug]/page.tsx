import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/custom/JsonLd";
import { siteConfig } from "@/lib/site-config";
import { updates } from "@/lib/updates";

export function generateStaticParams() {
  return updates.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const update = updates.find((u) => u.slug === slug);
  if (!update) return {};
  return {
    title: `${update.title} — StroyGetter`,
    description: update.description,
    keywords: update.keywords,
    alternates: { canonical: `/updates/${update.slug}` },
    openGraph: {
      title: update.title,
      description: update.description,
      url: `${siteConfig.url}/updates/${update.slug}`,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function UpdatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const update = updates.find((u) => u.slug === slug);
  if (!update) notFound();

  const currentIndex = updates.findIndex((u) => u.slug === slug);
  const prev = updates[currentIndex + 1] ?? null;
  const next = updates[currentIndex - 1] ?? null;

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
          {/* Back link */}
          <Link
            href="/updates"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            All updates
          </Link>

          {/* Kicker */}
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em] text-stroy-300">
            <span>Update</span>
            <span>·</span>
            <span>{formatDate(update.date)}</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px]">
            {update.title}
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-white/82">
            {update.description}
          </p>

          {/* Author */}
          <div className="mb-10 flex items-center gap-3 border-b border-white/8 pb-8 text-sm text-white/70">
            <div className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-stroy-700 text-xs font-bold text-white">
              SG
            </div>
            <div>
              <p className="font-semibold text-white">StroyGetter team</p>
              <p className="text-xs">Open source · MIT licensed</p>
            </div>
          </div>

          {/* Body */}
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

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-stroy-800 p-10 text-center">
            <h3 className="mb-3 text-2xl font-bold tracking-tight">
              Try it now
            </h3>
            <p className="mb-6 text-white/75">
              Paste a YouTube URL and start downloading.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
            >
              Open the downloader
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Prev / Next navigation */}
          {(prev || next) && (
            <nav className="mt-10 flex gap-4">
              {prev && (
                <Link
                  href={`/updates/${prev.slug}`}
                  className="flex flex-1 flex-col gap-1 rounded-2xl border border-white/8 bg-black/20 p-6 transition-colors hover:border-white/20"
                >
                  <span className="text-[11px] font-bold uppercase tracking-widest text-stroy-300">
                    ← Older
                  </span>
                  <span className="text-sm font-semibold text-white/85 leading-snug">
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
                    Newer →
                  </span>
                  <span className="text-sm font-semibold text-white/85 leading-snug">
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
