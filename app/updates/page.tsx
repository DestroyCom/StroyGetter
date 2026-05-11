import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/custom/JsonLd";
import { siteConfig } from "@/lib/site-config";
import { updates } from "@/lib/updates";

export const metadata: Metadata = {
  title: "Updates — What's new on StroyGetter",
  description:
    "Follow every improvement to StroyGetter — new features, better downloads, and a smoother experience. All updates in one place.",
  alternates: { canonical: "/updates" },
  openGraph: {
    title: "Updates — What's new on StroyGetter",
    description:
      "Follow every improvement to StroyGetter — new features, better downloads, and a smoother experience.",
    url: `${siteConfig.url}/updates`,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UpdatesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "StroyGetter Updates",
          description:
            "Follow every improvement to StroyGetter — new features, better downloads, and a smoother experience.",
          url: `${siteConfig.url}/updates`,
          publisher: {
            "@type": "Organization",
            name: "StroyCo",
            url: siteConfig.stroycoUrl,
          },
          blogPost: updates.map((u) => ({
            "@type": "BlogPosting",
            headline: u.title,
            datePublished: u.date,
            url: `${siteConfig.url}/updates/${u.slug}`,
            description: u.description,
          })),
        }}
      />

      <section className="bg-stroy-500 px-4 py-16 md:px-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 text-[12px] font-bold uppercase tracking-[0.1em] text-stroy-300">
            Changelog
          </div>
          <h1 className="mb-4 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px]">
            What&apos;s new on StroyGetter
          </h1>
          <p className="mb-16 text-lg leading-relaxed text-white/75">
            Every update, improvement and new feature — straight from the team.
          </p>

          <div className="space-y-6">
            {updates.map((update) => (
              <Link
                key={update.slug}
                href={`/updates/${update.slug}`}
                className="group block rounded-2xl border border-white/8 bg-black/20 p-8 transition-colors hover:border-white/20 hover:bg-black/30"
              >
                <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-stroy-300">
                  {formatDate(update.date)}
                </div>
                <h2 className="mb-3 text-xl font-bold leading-snug tracking-tight text-white group-hover:text-stroy-200 transition-colors">
                  {update.title}
                </h2>
                <p className="mb-5 text-sm leading-relaxed text-white/70">
                  {update.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-stroy-300 group-hover:text-stroy-200 transition-colors">
                  Read more
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
