import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
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
  return {
    title: "Acceptable use",
    description:
      "StroyGetter acceptable use policy — what you can and cannot download with our service.",
    robots: { index: true },
    alternates: buildAlternates(locale, path),
  };
}

const SECTIONS = [
  {
    n: "01",
    title: "Permitted uses",
    body: "You may use StroyGetter to download videos you have a legitimate right to access offline: content you created and uploaded yourself, videos released into the public domain, content distributed under a Creative Commons or equivalent open licence that permits downloading, and content you intend to use in a context that qualifies as fair use or fair dealing under the laws of your jurisdiction.",
  },
  {
    n: "02",
    title: "Prohibited uses",
    body: "You may not use StroyGetter to download content owned by a third party for the purpose of redistribution, resale, or commercial exploitation. You may not download music, films, television shows, or other works protected by copyright without the rights holder's permission. You may not use the Service to circumvent access controls or digital rights management systems beyond what is expressly permitted by applicable law.",
  },
  {
    n: "03",
    title: "Platform terms",
    body: "Downloading videos from YouTube may conflict with YouTube's Terms of Service. By using StroyGetter you acknowledge this and accept sole responsibility for ensuring your use complies with the terms of any platform from which you download content. StroyGetter and its maintainers cannot be held liable for any consequences arising from a violation of a third-party platform's terms.",
  },
  {
    n: "04",
    title: "No automation or scraping",
    body: "You may not use StroyGetter in an automated or scripted manner to download content at scale. The Service is intended for individual, manual use only. Automated requests that place excessive load on our infrastructure or on upstream platforms are prohibited and may result in your IP address being blocked.",
  },
  {
    n: "05",
    title: "Enforcement",
    body: `We reserve the right to suspend or restrict access to the Service for any user who violates this policy, without prior notice. If you believe a specific use case should be permitted or have questions about this policy, contact us via GitHub Issues or at ${siteConfig.emailDmca}.`,
  },
];

export default async function AcceptableUsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        Last updated · 12 May 2026
      </p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-[44px]">Acceptable use</h1>
      <div className="mb-8 rounded-r-xl border-l-2 border-stroy-400 bg-black/18 py-4 pl-5 pr-4 text-sm leading-relaxed text-white/75">
        This policy describes what you may and may not do with StroyGetter ("the Service"). Using
        the Service means you agree to these terms in addition to the{" "}
        <Link
          href="/legal/terms"
          className="text-stroy-200 underline underline-offset-3 hover:text-white"
        >
          Terms of use
        </Link>
        .
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
