import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/custom/JsonLd";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/how-to-use-library-ready";
  return {
    title:
      "How to download YouTube music with cover art, ID3 tags and lyrics — Library Ready guide",
    description:
      "Step-by-step guide to downloading YouTube music as a fully tagged MP3 using StroyGetter's Library Ready mode. Cover art, ID3 tags and synced lyrics embedded automatically.",
    keywords: [
      "how to add album art to mp3 from youtube",
      "youtube to mp3 keep metadata",
      "best way to download youtube music for apple music",
      "youtube music to plex library",
      "youtube to mp3 id3 tags guide",
      "how to download youtube song with lyrics",
      "youtube mp3 fully tagged tutorial",
      "download youtube music foobar2000",
      "youtube to mp3 rekordbox ready",
    ],
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
    openGraph: {
      title: "How to download YouTube music with cover art, ID3 tags and synced lyrics",
      description:
        "Use StroyGetter's Library Ready mode to get fully tagged MP3s from YouTube — cover art, metadata and scrolling lyrics in one click.",
      url: `${siteConfig.url}${path}`,
    },
  };
}

const TOC = [
  "What is Library Ready?",
  "What you need before starting",
  "Step 1 — Copy the YouTube music URL",
  "Step 2 — Paste it into StroyGetter",
  "Step 3 — Select Library Ready",
  "Step 4 — Download and import",
  "Which players support synced lyrics?",
  "Troubleshooting",
  "FAQ",
];

const ARTICLE_FAQS = [
  {
    q: "Can I use Library Ready for podcasts or non-music videos?",
    a: "You can, but the metadata match won't be great. Library Ready is designed for music that exists in YouTube Music's catalog. For podcasts and lectures, plain MP3 is a better choice.",
  },
  {
    q: "What bitrate does Library Ready use?",
    a: "190 kbps CBR, same as the standard MP3 option. The only difference is the embedded metadata — the audio quality is identical.",
  },
  {
    q: "Does Library Ready work on mobile?",
    a: "Yes — paste the YouTube URL in Safari (iOS) or Chrome (Android), select Library Ready on the result page, and tap Download. The tagged MP3 lands in your Downloads folder.",
  },
  {
    q: "What if the cover art resolution is low?",
    a: "We always fetch the highest resolution YouTube Music has for that track. For older or less-popular releases the source image may be limited, but we never downscale.",
  },
];

export default async function HowToUseLibraryReadyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline:
            "How to download YouTube music with cover art, ID3 tags and synced lyrics — Library Ready guide",
          description:
            "Step-by-step guide to downloading YouTube music as a fully tagged MP3 using StroyGetter's Library Ready mode.",
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
          datePublished: "2026-05-20",
          dateModified: "2026-05-20",
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${siteConfig.url}/how-to-use-library-ready`,
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to download YouTube music as a fully tagged MP3 with Library Ready",
          description:
            "Download any YouTube track as a library-perfect MP3 — cover art, ID3 tags and synced lyrics embedded — in four steps using StroyGetter.",
          step: [
            {
              "@type": "HowToStep",
              name: "Copy the YouTube music URL",
              text: "Copy the URL of the YouTube video or YouTube Music link from your browser's address bar or the app's Share menu.",
            },
            {
              "@type": "HowToStep",
              name: "Paste it into StroyGetter",
              text: `Open ${siteConfig.url}, paste the link in the search field and click Search video.`,
            },
            {
              "@type": "HowToStep",
              name: "Select Library Ready",
              text: "On the result page choose the Library Ready tab.",
            },
            {
              "@type": "HowToStep",
              name: "Download and import",
              text: "Click Download. The tagged MP3 streams to your browser. Import it into your music player and all metadata will appear automatically.",
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
            <span>5 min read</span>
            <span>·</span>
            <span>Updated May 2026</span>
          </div>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight md:text-[52px]">
            How to download YouTube music with cover art, ID3 tags and synced lyrics
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-white/82">
            A complete walkthrough of StroyGetter's Library Ready mode — the only free online tool
            that embeds cover art, metadata and scrolling lyrics in a single click.
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
            <h2 className="mt-12 text-2xl font-bold tracking-tight">What is Library Ready?</h2>
            <p>
              Library Ready is StroyGetter's premium download mode. Instead of giving you a bare MP3
              with no context, it fetches the track's full metadata from YouTube Music and embeds
              everything directly into the file before it reaches your device:
            </p>
            <ul className="space-y-2">
              {[
                "Cover art in the highest resolution YouTube Music has",
                "ID3v2.4 tags — song title, artist, album, year",
                "Synced lyrics from LRClib, time-coded to scroll with the music",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check size={16} className="mt-1 shrink-0 text-stroy-300" />
                  {item}
                </li>
              ))}
            </ul>
            <p>
              The result is a file that drops cleanly into Apple Music, Plex, Plexamp, Rekordbox,
              foobar2000 or whichever music player you love, with zero manual editing.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              What you need before starting
            </h2>
            <ul className="space-y-2">
              {[
                "The URL of a public YouTube video (the music track you want)",
                "A modern browser — Chrome, Firefox, Safari, Edge, or their mobile counterparts",
                "About 5 MB of free space per track",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 shrink-0 font-bold text-stroy-300">→</span>
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 1 — Copy the YouTube music URL
            </h2>
            <p>
              On desktop, click your browser's address bar while the video is open and press{" "}
              <strong>Cmd+C</strong> (Mac) or <strong>Ctrl+C</strong> (Windows). On the YouTube
              mobile app, tap <strong>Share → Copy link</strong>. YouTube Music links (
              <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-sm">
                music.youtube.com/…
              </code>
              ) work too — they often give a better metadata match.
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
              , paste the link in the search field, and click <strong>Search video</strong>. You'll
              see the video title, channel and duration so you can confirm it's the right track
              before going any further.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 3 — Select Library Ready
            </h2>
            <p>
              On the result page you'll see three format tabs: <strong>MP4</strong>,{" "}
              <strong>MP3</strong> and <strong>Library Ready</strong>. Click Library Ready. That's
              all — the metadata and lyrics are fetched automatically.
            </p>

            <div className="my-8 grid grid-cols-[32px_1fr] gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-6">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <AlertTriangle size={16} />
              </div>
              <div className="text-sm leading-relaxed">
                <strong className="mb-1 block text-white">Expect 20–35 seconds</strong>
                <span className="text-white/85">
                  Library Ready makes extra calls to fetch and embed the metadata. The progress bar
                  will move — don't close the tab. A plain MP3 is faster if you're in a hurry and
                  don't need the tags.
                </span>
              </div>
            </div>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Step 4 — Download and import
            </h2>
            <p>
              Click <strong>Download</strong>. The tagged MP3 streams directly from our converter to
              your browser. Once saved, drag it into your music player's library or use{" "}
              <strong>File → Add to Library</strong> in Apple Music. The cover art, tags and lyrics
              will appear immediately, no additional steps required.
            </p>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">
              Which players support synced lyrics?
            </h2>
            <p>
              Synced lyrics are stored as SYLT tags inside the ID3 container. Every major
              audiophile-grade player reads them:
            </p>
            <ul className="space-y-2">
              {[
                "Apple Music (macOS 12+ and iOS 16+) — lyrics tab scrolls with the track",
                "Plexamp — full lyrics view with time sync",
                "foobar2000 — requires the foo_uie_lyrics3 plugin",
                "Poweramp (Android) — built-in lyrics display",
                "Strawberry Music Player (Linux/Windows/macOS) — native support",
                "Standard players like VLC or Windows Media Player show the tags and artwork but skip the sync",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 shrink-0 font-bold text-stroy-300">→</span>
                  {item}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-2xl font-bold tracking-tight">Troubleshooting</h2>
            <ul className="space-y-3">
              {[
                {
                  p: "No lyrics in the file",
                  s: "The track may not be indexed in LRClib yet. You still get the cover art and ID3 tags — the file is never incomplete.",
                },
                {
                  p: "Wrong artist or album metadata",
                  s: "The match is done against YouTube Music's catalog. For unofficial uploads, covers or mashups the match may be off. You can edit the tags manually in your player afterward.",
                },
                {
                  p: "Cover art missing in my player",
                  s: "Some players cache thumbnails aggressively. Try removing the file, clearing the cache, and re-importing.",
                },
                {
                  p: "Download is stuck on the progress bar",
                  s: "The metadata lookup takes up to 35 s on slow servers. If it exceeds 2 minutes, try again — a retry will usually succeed immediately from cache.",
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
            <h3 className="mb-3 text-2xl font-bold tracking-tight">Ready to build your library?</h3>
            <p className="mb-6 text-white/75">
              Paste a YouTube music link and pick Library Ready — your track will be perfectly
              tagged in under a minute.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
            >
              Open the downloader
              <ArrowRight size={18} />
            </Link>
            <p className="mt-5 text-xs text-white/40">
              Want the full feature overview?{" "}
              <Link
                href="/library-ready"
                className="underline underline-offset-2 hover:text-white/70"
              >
                See the Library Ready page →
              </Link>
            </p>
          </div>
        </div>
      </article>
    </>
  );
}
