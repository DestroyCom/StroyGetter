import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "StroyGetter terms of use — personal and educational use only.",
  alternates: { canonical: "/legal/terms" },
  robots: { index: true },
};

const SECTIONS = [
  {
    n: "01",
    title: "Personal & educational use only",
    body: "You may use the Service to download videos you have the right to download — your own content, public-domain content, content explicitly licensed for download under Creative Commons or a similar license, or content you intend to use in a context that qualifies as fair use under your jurisdiction.",
  },
  {
    n: "02",
    title: "No redistribution",
    body: "Files you download via StroyGetter must not be re-uploaded, sold, sub-licensed or otherwise distributed to third parties when you don't own the underlying rights. The Service is a personal-use tool, not a commercial pipeline.",
  },
  {
    n: "03",
    title: "Privacy",
    body: "We don't store your downloads — files are streamed directly from our converter to your browser and discarded immediately. We collect anonymous usage statistics (page views, conversion counts, error rates) via Google Analytics 4, which may set cookies (e.g. _ga) in your browser. No personal profiles are built and no data is sold to third parties.",
  },
  {
    n: "04",
    title: "DMCA & takedowns",
    body: `StroyGetter doesn't host video content of its own. If you believe a third party is using the Service to infringe your copyright, contact us at ${siteConfig.emailDmca} with the standard DMCA notice elements and we will cooperate with any legitimate takedown request.`,
  },
  {
    n: "05",
    title: "Open source & warranty",
    body: 'StroyGetter is released under the MIT license. The Service is provided "as is", without warranty of any kind — the StroyGetter maintainers are not liable for any damages arising from use of the Service, including failed conversions, corrupted files, or downloads of content you didn\'t have the right to retrieve.',
  },
];

export default function TermsPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        Last updated · 7 May 2026
      </p>
      <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-[44px]">Terms of use</h1>
      <div className="mb-8 rounded-r-xl border-l-2 border-stroy-400 bg-black/18 py-4 pl-5 pr-4 text-sm leading-relaxed text-white/75">
        StroyGetter ("the Service") is a free, open-source YouTube video downloader. By using the
        Service, you agree to the terms below.
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
