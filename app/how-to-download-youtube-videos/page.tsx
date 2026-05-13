import { AlertTriangle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/custom/JsonLd";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "How to download a YouTube video as MP4 or MP3 in 2026",
  description:
    "Free, no-install walkthrough using StroyGetter — the open-source YouTube downloader. Download MP4 video or MP3 audio on Chrome, Firefox, Safari and mobile.",
  keywords: [
    "how to download youtube video",
    "youtube to mp4",
    "youtube to mp3",
    "download youtube video free",
    "youtube downloader no install",
  ],
  alternates: { canonical: "/how-to-download-youtube-videos" },
  openGraph: {
    title: "How to download a YouTube video as MP4 or MP3 in 2026",
    description:
      "Free, no-install walkthrough using StroyGetter. Download MP4 video or MP3 audio directly from your browser.",
    url: `${siteConfig.url}/how-to-download-youtube-videos`,
  },
};

const TOC = [
  "What you need before starting",
  "Step 1 — Copy the YouTube URL",
  "Step 2 — Paste it into StroyGetter",
  "Step 3 — Pick MP4 or MP3",
  "Step 4 — Download to your device",
  "Is this legal?",
  "Troubleshooting",
  "FAQ",
];

const ARTICLE_FAQS = [
  {
    q: "Does StroyGetter work on mobile?",
    a: "Yes — it works on mobile Safari (iOS) and Chrome on Android. Paste the YouTube URL, pick your format, and tap Download. The file goes to your Downloads folder.",
  },
  {
    q: "What is the maximum quality I can download?",
    a: "Up to 2160p (4K) for videos that have it on YouTube. We never upscale — if the original is 720p, you get a 720p file.",
  },
  {
    q: "Why is my download slow?",
    a: "We fetch the file from YouTube live. Speed depends on the source bitrate, our server load, and your internet connection. Library Ready adds 15–25s for the metadata lookup.",
  },
  {
    q: "Can I download YouTube Shorts?",
    a: "Yes — Shorts are standard YouTube videos under a minute. Paste the youtu.be/shorts/ URL and it works the same way.",
  },
];

export default function HowToDownloadYouTube() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to download a YouTube video as MP4 or MP3 in 2026",
          description:
            "Free, no-install walkthrough using StroyGetter — the open-source YouTube downloader.",
          author: { "@type": "Organization", name: "StroyCo", url: siteConfig.stroycoUrl },
          publisher: { "@type": "Organization", name: "StroyCo", url: siteConfig.stroycoUrl },
          datePublished: "2026-05-01",
          dateModified: "2026-05-11",
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${siteConfig.url}/how-to-download-youtube-videos`,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to download a YouTube video as MP4 or MP3",
          description:
            "Download any public YouTube video for free in four steps using StroyGetter — no install, no signup.",
          step: [
            {
              "@type": "HowToStep",
              name: "Copy the YouTube URL",
              text: "Copy the URL from the browser address bar or the YouTube mobile app's Share menu.",
            },
            {
              "@type": "HowToStep",
              name: "Paste into StroyGetter",
              text: `Open ${siteConfig.url}, paste the link in the search bar, and click Search video.`,
            },
            {
              "@type": "HowToStep",
              name: "Pick MP4 or MP3",
              text: "On the result page choose MP4 for video, MP3 for audio only, or Library Ready for MP3 with full ID3 metadata.",
            },
            {
              "@type": "HowToStep",
              name: "Download to your device",
              text: "Click the Download button. The file streams directly to your browser — nothing is stored on our servers.",
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: ARTICLE_FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      <article className="bg-stroy-500 px-4 py-16 md:px-14">
        <div className="mx-auto max-w-3xl">
          {/* Kicker */}
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[12px] font-bold uppercase tracking-[0.1em] text-stroy-300">
            <span>Guide</span>
            <span>·</span>
            <span>6 min read</span>
            <span>·</span>
            <span>Updated May 2026</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px]">
            How to download a YouTube video as MP4 or MP3 in 2026
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-white/82">
            A free, no-install walkthrough using StroyGetter — the open-source YouTube downloader.
            Works on Chrome, Firefox, Safari and any modern mobile browser.
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

          {/* TOC */}
          <nav
            className="mb-12 rounded-2xl border border-white/6 bg-black/20 p-7"
            aria-label="Table of contents"
          >
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">
              Contents
            </p>
            <ol className="grid gap-2 sm:grid-cols-2" style={{ counterReset: "toc" }}>
              {TOC.map((item, i) => (
                <li key={item} className="flex gap-3 text-sm text-white/85">
                  <span className="font-mono text-[12px] text-stroy-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </nav>

          {/* Body */}
          <div className="space-y-6 text-base leading-[1.75] text-white/88">
            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              What you need before starting
            </h2>
            <p>
              Nothing exotic. A modern web browser, the URL of the YouTube video you want to keep,
              and somewhere to save the file. No account, no payment, no installer, no browser
              extension.
            </p>
            <ul className="space-y-2">
              {[
                "A YouTube video URL (any public video — Shorts work too)",
                "A browser released after 2023 — Chrome, Firefox, Safari, Edge, mobile Safari, Chrome on Android",
                "About 100 MB of free space for 1080p, or 5 MB for an MP3",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 shrink-0 font-bold text-stroy-300">→</span>
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 1 — Copy the YouTube URL
            </h2>
            <p>
              On desktop, click the address bar at the top of your browser and copy the full URL
              with <strong>Cmd+C</strong> (Mac) or <strong>Ctrl+C</strong> (Windows). On the YouTube
              mobile app, tap the <strong>Share</strong> button under the video and pick{" "}
              <strong>Copy link</strong>. Either way, the URL should start with{" "}
              <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-sm">
                https://youtube.com/
              </code>{" "}
              or{" "}
              <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-sm">
                https://youtu.be/
              </code>
              .
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 2 — Paste it into StroyGetter
            </h2>
            <p>
              Open{" "}
              <Link
                href="/"
                className="text-stroy-200 underline underline-offset-3 hover:text-white"
              >
                {siteConfig.url.replace("https://", "")}
              </Link>
              , paste the link in the search field at the top of the page, and click{" "}
              <strong>Search video</strong>. We immediately call YouTube&apos;s public endpoint to
              fetch the title, channel and duration so you can confirm it&apos;s the right video
              before downloading.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">Step 3 — Pick MP4 or MP3</h2>
            <p>
              On the result page you&apos;ll see three options. <strong>MP4</strong> keeps the
              picture at the source resolution YouTube serves — up to 4K for videos that have it.
              When you select MP4, a quality dropdown will appear so you can choose from the
              resolutions YouTube has available. <strong>MP3</strong> keeps only the audio, encoded
              at 190 kbps. <strong>Library Ready</strong> is MP3 plus cover art, ID3 tags and synced
              lyrics — pick that if the file is going into a music library.
            </p>

            {/* Callout */}
            <div className="my-8 grid grid-cols-[32px_1fr] gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-6">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <AlertTriangle size={16} />
              </div>
              <div className="text-sm leading-relaxed">
                <strong className="mb-1 block text-white">Note on video quality</strong>
                <span className="text-white/85">
                  StroyGetter doesn&apos;t upscale or re-encode the picture. If the original on
                  YouTube is 720p, you&apos;ll get a 720p file — even if you select a higher
                  quality. Resolution is determined entirely by what YouTube has on their side.
                </span>
              </div>
            </div>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 4 — Download to your device
            </h2>
            <p>
              Click the Download button. The file is streamed directly from our converter to your
              browser — nothing is stored on our servers. An MP3 usually finishes in 6–10 seconds;
              an MP4 in 8–15 seconds; Library Ready takes about 20–30 seconds because of the
              metadata lookup.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">Is this legal?</h2>
            <p>
              It depends on your jurisdiction and what you download. In most places, downloading
              content <strong>you own</strong>, content in the <strong>public domain</strong>, or
              content explicitly <strong>licensed for download</strong> is fine. Downloading
              copyrighted material without permission is not. StroyGetter is intended for personal
              and educational use only — please don&apos;t use it to infringe on anyone&apos;s
              rights.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">Troubleshooting</h2>
            <ul className="space-y-3">
              {[
                {
                  p: "Video not found",
                  s: "Make sure the video is public and not age-restricted. Private and members-only videos cannot be fetched.",
                },
                {
                  p: "Download is very slow",
                  s: "Large 4K files take longer. If you only need audio, switch to MP3 — it's typically 20× smaller.",
                },
                {
                  p: "File won't play after download",
                  s: "Try VLC — it plays every MP4 and MP3 variant. If the file is 0 bytes, the conversion failed; try again.",
                },
                {
                  p: "Library Ready has no lyrics",
                  s: "Synced lyrics come from open music databases. Some tracks aren't indexed yet — you'll still get cover art and ID3 tags.",
                },
              ].map(({ p, s }) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-1 shrink-0 font-bold text-stroy-300">→</span>
                  <span>
                    <strong>{p}:</strong> {s}
                  </span>
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">FAQ</h2>
            <div className="space-y-6">
              {ARTICLE_FAQS.map((f) => (
                <div key={f.q}>
                  <h3 className="mb-2 text-lg font-bold">{f.q}</h3>
                  <p className="text-white/80">{f.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-white/10 bg-stroy-800 p-10 text-center">
            <h3 className="mb-3 text-2xl font-bold tracking-tight">Ready to download?</h3>
            <p className="mb-6 text-white/75">
              Head back to the homepage and paste your YouTube URL.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
            >
              Open the downloader
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
