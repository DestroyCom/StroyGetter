import {
  ArrowRight,
  Check,
  Disc3,
  FileMusic,
  Image as ImageIcon,
  MicVocal,
  Tag,
  X,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title:
    "Library Ready — YouTube to MP3 with Cover Art, ID3 Tags & Synced Lyrics",
  description:
    "Download YouTube music as a fully tagged MP3 — cover art, artist, album, year and synced lyrics embedded automatically. Drops cleanly into Apple Music, Plex, Rekordbox, foobar2000 or any music player.",
  keywords: [
    "youtube to mp3 with album art",
    "youtube to mp3 id3 tags",
    "youtube to mp3 with cover art",
    "youtube mp3 with lyrics",
    "youtube music downloader metadata",
    "download youtube music apple music",
    "youtube to mp3 itunes ready",
    "youtube mp3 synced lyrics",
    "youtube to mp3 with artwork",
    "library ready mp3",
    "youtube music to plex",
    "youtube mp3 fully tagged",
  ],
  alternates: { canonical: "/library-ready" },
  openGraph: {
    title:
      "Library Ready — YouTube to MP3 with Cover Art, ID3 Tags & Synced Lyrics",
    description:
      "One click and your YouTube track is library-perfect: cover art, ID3 tags and synced lyrics baked in. Works with Apple Music, Plex, Rekordbox and your favourite music player.",
    url: `${siteConfig.url}/library-ready`,
  },
};

// ─── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: ImageIcon,
    title: "High-res cover art",
    desc: "Pulled from YouTube Music in the highest resolution available. Your album grid looks exactly like it should in every player.",
  },
  {
    Icon: Tag,
    title: "Full ID3v2.4 tags",
    desc: 'Song title, artist, album name and year are auto-detected and embedded. No more "Unknown Artist" entries cluttering your library.',
  },
  {
    Icon: MicVocal,
    title: "Synced lyrics",
    desc: "Time-coded lyrics from LRClib are embedded as SYLT tags. The words scroll in sync with the music — just like on streaming platforms.",
  },
  {
    Icon: FileMusic,
    title: "Works everywhere",
    desc: "Drop the file into Apple Music, Plex, Rekordbox, foobar2000, or any music player you love. It just works, no manual editing required.",
  },
];

const COMPARE_ROWS = [
  { feature: "Cover art (high-res)", us: true, others: false },
  {
    feature: "ID3 tags (artist, album, year)",
    us: true,
    others: "partial" as const,
  },
  { feature: "Synced lyrics (SYLT)", us: true, others: false },
  { feature: "Auto-detected from YouTube Music", us: true, others: false },
  { feature: "Free, no signup", us: true, others: true },
  { feature: "No ads", us: true, others: false },
];

const FAQS = [
  {
    q: "How long does Library Ready take?",
    a: "Usually 20–35 seconds. We make an extra call to fetch the metadata and high-res artwork, then run ffmpeg to embed everything. A plain MP3 is faster because we skip that step.",
  },
  {
    q: "What if no lyrics are found?",
    a: "You still get the full ID3 tags and cover art. Lyrics come from LRClib — an open database. Some tracks aren't indexed yet, but the file is never incomplete.",
  },
  {
    q: "Which players support synced lyrics?",
    a: "Apple Music (macOS/iOS), Plexamp, foobar2000 with a plugin, Poweramp on Android, and most modern audiophile players. Standard players like VLC will still show the tags and artwork even if they don't scroll the lyrics.",
  },
  {
    q: "Is the metadata always accurate?",
    a: "We match against YouTube Music's catalog, which covers the vast majority of official music releases. For unofficial uploads, covers or mixes the match may be partial — you'll get whatever data YouTube Music has.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LibraryReadyPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "StroyGetter — Library Ready",
          url: `${siteConfig.url}/library-ready`,
          description:
            "Download YouTube music as a fully tagged MP3 — cover art, artist, album, year and synced lyrics embedded automatically.",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          featureList: [
            "High-resolution cover art from YouTube Music",
            "ID3v2.4 tags — artist, album, year, track",
            "Synchronized lyrics (SYLT) via LRClib",
            "Compatible with Apple Music, Plex, Rekordbox, foobar2000 and any music player",
          ],
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Library Ready features",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "High-resolution cover art from YouTube Music",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "ID3v2.4 tags — artist, album, year, track",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Synchronized lyrics (SYLT) via LRClib",
            },
            {
              "@type": "ListItem",
              position: 4,
              name: "Compatible with Apple Music, Plex, Rekordbox, foobar2000 and any music player",
            },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />

      {/* ── HERO ── */}
      <section className="bg-stroy-500 px-4 py-20 md:py-28" id="hero">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-stroy-300/30 bg-stroy-700/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            <Disc3 size={12} />
            Library Ready
          </div>

          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            YouTube to MP3 —
            <br />
            <em className="font-light italic text-white/78">
              perfectly tagged, ready to play.
            </em>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            Cover art, ID3 tags and synced lyrics embedded in one click. Drop
            the file into Apple Music, Plex, Rekordbox, foobar2000 or your
            favourite music player — and everything shows up exactly as it
            should. No manual editing, ever.
          </p>

          <Suspense fallback={<SkeletonInput />}>
            <GetterInput />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> Cover art
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> ID3 tags
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> Synced lyrics
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> Free, no signup
            </span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              What's included
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              Everything your music player needs, already inside the file.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-8"
              >
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <f.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="grid gap-14 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                Why it matters
              </p>
              <h2 className="mb-6 text-balance text-4xl font-bold leading-tight tracking-tight">
                A plain MP3 is just a file. Library Ready is a track.
              </h2>
              <div className="space-y-4 text-white/80">
                <p className="text-base leading-relaxed">
                  When you download a bare MP3 from most tools, you get an
                  unnamed file with no artwork, no artist info and no lyrics.
                  Open it in Apple Music and it lands in{" "}
                  <strong className="text-white">
                    Unknown Artist → Unknown Album
                  </strong>
                  , buried where you'll never find it again.
                </p>
                <p className="text-base leading-relaxed">
                  Library Ready fixes all of that automatically. The metadata is
                  pulled from YouTube Music's catalog, the cover art is fetched
                  in the highest resolution available, and the synced lyrics
                  come from LRClib — an open, community-maintained database. The
                  file is indistinguishable from a proper store purchase.
                </p>
                <p className="text-base leading-relaxed">
                  It works with every player you love — Apple Music, Plex,
                  Plexamp, Rekordbox, foobar2000, Poweramp, Strawberry or
                  whatever player is your daily driver. If it reads ID3 tags,
                  Library Ready speaks its language.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-stroy-800 p-8">
              <h3 className="mb-5 text-lg font-bold tracking-tight">
                Without Library Ready vs. with it
              </h3>
              {/* Column headers */}
              <div className="mb-2 grid grid-cols-3 gap-2 px-4 text-[10px] font-bold uppercase tracking-[0.12em]">
                <span />
                <span className="text-center text-red-400/70">Without</span>
                <span className="text-center text-stroy-300">With</span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    label: "Artist name",
                    without: "Unknown Artist",
                    with: "Auto-detected",
                  },
                  {
                    label: "Album art",
                    without: "Grey placeholder",
                    with: "Hi-res cover",
                  },
                  {
                    label: "Lyrics",
                    without: "None",
                    with: "Synced & scrolling",
                  },
                  {
                    label: "Album & year",
                    without: "Missing",
                    with: "Embedded",
                  },
                  {
                    label: "Time to tag",
                    without: "5–10 min / track",
                    with: "0 seconds",
                  },
                ].map(({ label, without, with: withVal }) => (
                  <div
                    key={label}
                    className="grid grid-cols-3 items-center gap-2 rounded-xl bg-white/4 px-4 py-3 text-sm"
                  >
                    <span className="text-xs font-medium text-white/70">
                      {label}
                    </span>
                    <span className="rounded-md bg-red-500/15 px-2 py-1 text-center text-[11px] font-semibold text-red-300">
                      {without}
                    </span>
                    <span className="rounded-md bg-stroy-400/20 px-2 py-1 text-center text-[11px] font-semibold text-stroy-200">
                      {withVal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              How we compare
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              No other free online downloader does this.
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03]">
                  <th className="px-6 py-4 text-left font-semibold text-white/60">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-stroy-200">
                    StroyGetter Library Ready
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-white/50">
                    Other free tools
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(({ feature, us, others }, i) => (
                  <tr
                    key={feature}
                    className={`border-b border-white/5 ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                  >
                    <td className="px-6 py-4 text-white/80">{feature}</td>
                    <td className="px-6 py-4 text-center">
                      {us ? (
                        <Check size={18} className="mx-auto text-stroy-300" />
                      ) : (
                        <X size={18} className="mx-auto text-red-400/60" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {others === true ? (
                        <Check size={18} className="mx-auto text-white/40" />
                      ) : others === "partial" ? (
                        <span className="text-xs text-white/40">partial</span>
                      ) : (
                        <X size={18} className="mx-auto text-red-400/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
            FAQ
          </p>
          <h2 className="mb-10 text-balance text-4xl font-bold leading-tight tracking-tight">
            Library Ready — common questions.
          </h2>

          <div className="space-y-5">
            {FAQS.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-5"
              >
                <h3 className="mb-2 font-bold text-white">{f.q}</h3>
                <p className="text-sm leading-relaxed text-white/75">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-stroy-800 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <Disc3 size={40} className="mx-auto mb-6 text-stroy-300" />
          <h2 className="mb-4 text-balance text-4xl font-bold tracking-tight">
            Try Library Ready now — it's free.
          </h2>
          <p className="mb-8 text-lg text-white/70">
            Paste any YouTube music link and pick Library Ready. Your track will
            be library-perfect in under a minute.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
          >
            Open the downloader
            <ArrowRight size={18} />
          </Link>
          <p className="mt-5 text-xs text-white/40">
            Want to know more?{" "}
            <Link
              href="/how-to-use-library-ready"
              className="underline underline-offset-2 hover:text-white/70"
            >
              Read the full guide →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
