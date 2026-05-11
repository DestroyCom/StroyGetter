import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "DMCA / takedown",
  description: "StroyGetter DMCA and copyright takedown policy.",
  alternates: { canonical: "/legal/dmca" },
};

export default function DmcaPage() {
  return (
    <div className="mb-45">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        Last updated · 7 May 2026
      </p>
      <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-[44px]">DMCA / takedown</h1>

      <div className="space-y-8 text-sm leading-[1.75] text-white/82">
        <p>
          StroyGetter is a client-side conversion tool. We do not host, cache, or redistribute any
          video content — every download is streamed in real time from YouTube&apos;s servers to
          your browser and immediately discarded.
        </p>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">01</span>Filing a takedown notice
          </h2>
          <p>
            If you believe the Service is being used to infringe on your copyright, send a standard
            DMCA notice to{" "}
            <a
              href={`mailto:${siteConfig.emailDmca}`}
              className="text-stroy-200 underline underline-offset-3 hover:text-white"
            >
              {siteConfig.emailDmca}
            </a>{" "}
            including: a description of the copyrighted work, the URL being misused, your contact
            information, and a statement of good faith. We will respond within 5 business days.
          </p>
        </div>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">02</span>
            Counter-notices
          </h2>
          <p>
            If you believe content was removed in error, you may file a counter-notice to the same
            address. We follow the safe-harbor procedures outlined in 17 U.S.C. § 512(g).
          </p>
        </div>
      </div>
    </div>
  );
}
