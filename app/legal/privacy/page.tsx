import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "StroyGetter privacy policy — what we collect and why.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        Last updated · 7 May 2026
      </p>
      <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-[44px]">Privacy policy</h1>

      <div className="space-y-8 text-sm leading-[1.75] text-white/82">
        {[
          {
            n: "01",
            title: "What we collect",
            body: "We collect anonymous, aggregated usage statistics: page views, conversion type counts (MP4 / MP3 / Library Ready), and error rates. This data is processed by Google Analytics 4 and contains no personally identifiable information.",
          },
          {
            n: "02",
            title: "What we don't collect",
            body: "We do not store video URLs you submit, downloaded files, IP addresses in logs, or any information that could identify you individually. Downloads are streamed in real time and never written to disk.",
          },
          {
            n: "03",
            title: "Cookies",
            body: "StroyGetter itself sets no cookies. Google Analytics 4 may set a measurement cookie (_ga) to distinguish sessions. You can opt out using any browser-level ad blocker or the Google Analytics opt-out extension.",
          },
          {
            n: "04",
            title: "Third-party services",
            body: "We use Google Analytics 4 for usage metrics. For Library Ready conversions we query open music databases (MusicBrainz, LRClib) to fetch metadata — only the track title and artist name are sent, no personal data.",
          },
          {
            n: "05",
            title: "Contact",
            body: `Questions about this policy? Open an issue on GitHub or email ${siteConfig.emailPrivacy}.`,
          },
        ].map((s) => (
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
