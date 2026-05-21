import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/legal/contact";
  return {
    title: "Contact",
    description: "Get in touch with the StroyGetter team.",
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        en: `/en${path}`,
        fr: `/fr${path}`,
        es: `/es${path}`,
        "pt-BR": `/pt${path}`,
        "x-default": `/en${path}`,
      },
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mb-65">
      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-[44px]">Contact</h1>
      <p className="mb-10 text-sm leading-relaxed text-white/75">
        StroyGetter is maintained by StroyCo as an open-source project. The best way to reach us is
        through GitHub.
      </p>

      <div className="space-y-4">
        <Link
          href={`${siteConfig.githubUrl}/issues`}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-stroy-700">
            <SiGithub size={20} />
          </div>
          <div>
            <p className="font-bold">GitHub Issues</p>
            <p className="text-sm text-white/65">
              Bug reports, feature requests, general questions
            </p>
          </div>
          <span className="ml-auto text-white/60">→</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="mb-1 font-bold">Email — DMCA only</p>
          <p className="text-sm text-white/65">
            For copyright takedown notices:{" "}
            <a
              href={`mailto:${siteConfig.emailDmca}`}
              className="text-stroy-200 underline underline-offset-3 hover:text-white"
            >
              {siteConfig.emailDmca}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
