import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, Disc3, Download, Film, Link as LinkIcon, Music, Scale } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { GetterInput } from "@/components/custom/GetterInput";
import { JsonLd } from "@/components/custom/JsonLd";
import { SkeletonInput } from "@/components/custom/SkeletonInput";
import { siteConfig } from "@/lib/site-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Static data ─────────────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    Icon: LinkIcon,
    n: "01",
    title: "Paste the YouTube URL",
    body: "Copy the link from any YouTube video — desktop, mobile app, or Shorts. Drop it in the search field above.",
  },
  {
    Icon: Scale,
    n: "02",
    title: "Pick MP4, MP3 or Library Ready",
    body: "MP4 keeps the video at source resolution (up to 4K). MP3 is audio-only at 190 kbps. Library Ready adds cover art, ID3 tags and synced lyrics.",
  },
  {
    Icon: Download,
    n: "03",
    title: "Download straight to your device",
    body: "The file streams from our converter directly to your browser. Nothing is stored on our servers. Only download content you have the rights to.",
  },
];

const FORMATS = [
  {
    Icon: Film,
    title: "MP4 video",
    meta: "H.264 · up to 2160p",
    desc: "Full video at the source resolution YouTube serves — 360p, 720p, 1080p, 1440p or 2160p when the original has it. We never upscale or re-encode the picture.",
    features: ["1080p typical", "4K when available", "AAC audio track", "Plays everywhere"],
    featured: false,
    badge: undefined as string | undefined,
  },
  {
    Icon: Music,
    title: "MP3 audio",
    meta: "MPEG-1 L3 · 190 kbps",
    desc: "Audio-only extract at a constant 190 kbps. Perfect for podcasts, lectures, and study material you want to listen to offline.",
    features: ["Stereo 44.1 kHz", "Universal compat"],
    featured: false,
    badge: undefined as string | undefined,
  },
  {
    Icon: Disc3,
    title: "Library Ready",
    meta: "MP3 + ID3v2.4 + lyrics",
    badge: "Most popular" as string | undefined,
    desc: "MP3 at 190 kbps with cover art, title, artist, album, year and synced lyrics baked in. Drops cleanly into Apple Music, Plex, Rekordbox, foobar2000.",
    features: ["Cover art", "ID3 tags", "Synced lyrics", "Auto-detected from YouTube Music"],
    featured: true,
  },
];

const FAQS = [
  {
    q: "Is StroyGetter really free?",
    a: "Yes — fully free, unlimited downloads, no signup. The project is open source under the MIT license and runs on a small server in the EU. If you want to help, the GitHub repo accepts contributions.",
  },
  {
    q: "Is downloading YouTube videos legal?",
    a: "It depends on your jurisdiction and what you download. StroyGetter is intended for personal use of content you own, public-domain content, or content explicitly licensed for download. Only download what you have the right to.",
  },
  {
    q: "Why does Library Ready conversion take longer?",
    a: "We make a second call to fetch metadata (artist, album, lyrics) from open music databases, fetch the high-resolution cover art from YouTube Music, and embed everything into the ID3 tags. The whole roundtrip usually adds 15–25 seconds.",
  },
  {
    q: "Do you store the videos on your servers?",
    a: "No. The converter streams the file directly to your browser as soon as it's ready. Nothing is cached, logged, or kept. Our analytics only counts anonymous page views.",
  },
  {
    q: "Which browsers are supported?",
    a: "Any modern browser released after 2023. We test on Chrome, Firefox, Safari and Edge. Mobile Safari and Chrome on Android also work.",
  },
  {
    q: "Can I download age-restricted or private videos?",
    a: "No — we only handle videos that are publicly available without a YouTube login. Age-restricted videos that require sign-in cannot be fetched.",
  },
];

const GLOSSARY = [
  { term: "MP4 container", def: ".mp4" },
  { term: "H.264 codec", def: "AVC" },
  { term: "MP3 bitrate", def: "kbps" },
  { term: "ID3 tags", def: "v2.4" },
  { term: "Resolution", def: "px" },
  { term: "Sample rate", def: "kHz" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to download a YouTube video with StroyGetter",
          description:
            "Download any public YouTube video as MP4, MP3 or Library Ready in three steps — no install, no signup.",
          step: HOW_STEPS.map((s) => ({
            "@type": "HowToStep",
            name: s.title,
            text: s.body,
          })),
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
      <section className="bg-stroy-500 px-4 py-20 md:py-28" id="home">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            Download YouTube videos
            <br />
            as MP4 or MP3.
            <br />
            <em className="font-light italic text-white/78">free, online, no signup.</em>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            The open-source YouTube downloader. Paste any public link, choose your format, and save
            it for offline viewing or archiving. No browser extension, no desktop app required.
          </p>

          <Suspense fallback={<SkeletonInput />}>
            <GetterInput />
          </Suspense>

          <div className="mt-6 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> Unlimited downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> No ads, ever
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-stroy-300" /> Open source
            </span>
          </div>
          <p className="mt-3 text-xs italic text-white/50">
            Please only download content you own or have the rights to.
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="how-it-works">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                How it works
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                From URL to file in three steps, no install.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              No browser extension, no desktop app, no signup. Everything runs in your tab.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-white/10 bg-white/[0.025] p-8"
              >
                <span className="absolute right-7 top-7 font-mono text-xs tracking-wider text-white/40">
                  {s.n}
                </span>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <s.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMATS ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24" id="formats">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                Output formats
              </p>
              <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
                One conversion, three useful files.
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/70 md:text-right">
              Video stays at source resolution — we don&apos;t transcode. Audio at constant 190
              kbps.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FORMATS.map((f) => (
              <div
                key={f.title}
                className={`flex flex-col gap-4 rounded-2xl border p-7 ${
                  f.featured ? "border-stroy-300/30 bg-stroy-700" : "border-white/6 bg-stroy-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/6 text-stroy-100">
                    <f.Icon size={18} />
                  </div>
                  {f.badge && (
                    <span className="rounded-full bg-stroy-300 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stroy-900">
                      {f.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="mb-1 text-[19px] font-bold tracking-tight">{f.title}</h3>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                    {f.meta}
                  </p>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-white/75">{f.desc}</p>
                <ul className="flex flex-wrap gap-1.5">
                  {f.features.map((feat) => (
                    <li
                      key={feat}
                      className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70"
                    >
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs italic text-white/50">
            Video resolution is inherited from the YouTube source. We never upscale or re-encode the
            picture stream.
          </p>
        </div>
      </section>

      {/* ── FAQ + GLOSSARY ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24" id="faq">
        <div className="mx-auto max-w-9xl">
          <div className="grid gap-14 md:grid-cols-[1.4fr_1fr]">
            {/* FAQ */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
                FAQ
              </p>
              <h2 className="mb-8 text-balance text-4xl font-bold leading-tight tracking-tight">
                Common questions, plain answers.
              </h2>
              <Accordion type="single" collapsible className="flex flex-col gap-2">
                {FAQS.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={`faq-${i}`}
                    className="rounded-xl border border-white/10 bg-white/[0.02] px-5 data-[state=open]:border-white/20 data-[state=open]:bg-white/[0.04]"
                  >
                    <AccordionTrigger className="py-4 text-left text-[15px] font-semibold hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm leading-[1.65] text-white/75">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Glossary + GitHub */}
            <aside id="glossary" className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/6 bg-black/18 p-7">
                <h3 className="mb-1.5 text-xl font-bold tracking-tight">
                  YouTube downloader glossary
                </h3>
                <p className="mb-5 text-sm leading-snug text-white/65">
                  Quick definitions of the technical terms used on this page.
                </p>
                <div className="flex flex-col gap-1">
                  {GLOSSARY.map((g) => (
                    <div
                      key={g.term}
                      className="flex cursor-default items-center justify-between rounded-lg px-3.5 py-3 text-sm transition-colors hover:bg-white/5"
                    >
                      <span className="font-semibold">{g.term}</span>
                      <span className="font-mono text-[11px] text-white/50">{g.def}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-4 rounded-2xl border border-white/10 p-5 transition-colors hover:border-white/20 hover:bg-white/[0.02]"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-stroy-700">
                  <SiGithub size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">Open source on GitHub</p>
                  <p className="text-xs text-white/65">Self-host or contribute · MIT licensed</p>
                </div>
                <span className="text-white/60">→</span>
              </Link>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
