import { SiGithub } from "@icons-pack/react-simple-icons";
import { Check, ChevronDown, CircleCheckBig, ClipboardCopy, Download, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// ─── helpers ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-1 text-2xl font-bold text-foreground">{title}</h2>
      <Separator className="mb-6 bg-primary/30" />
      {children}
    </section>
  );
}

function Token({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ColorSwatch({ name, cssVar, hex }: { name: string; cssVar: string; hex: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border shadow-sm">
      <div className="h-20 w-full" style={{ backgroundColor: hex }} title={hex} />
      <div className="flex flex-col gap-0.5 bg-card p-3">
        <span className="font-semibold text-card-foreground">{name}</span>
        <span className="font-mono text-xs text-muted-foreground">{cssVar}</span>
        <span className="font-mono text-xs text-muted-foreground">{hex}</span>
      </div>
    </div>
  );
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-black">Design System</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Référence visuelle des tokens, composants et patterns de{" "}
          <span className="font-semibold text-foreground">StroyGetter</span>.
        </p>
      </div>

      {/* ── 1. COLORS ──────────────────────────────────────────────────────── */}
      <Section title="Couleurs">
        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold uppercase tracking-widest text-muted-foreground">
            Palette de marque
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <ColorSwatch name="Brand Dark" cssVar="—" hex="#081721" />
            <ColorSwatch name="Primary" cssVar="--primary" hex="#102F42" />
            <ColorSwatch name="Secondary" cssVar="--secondary" hex="#205D83" />
            <ColorSwatch name="Background Hero" cssVar="--background-rgb" hex="#206083" />
            <ColorSwatch name="White" cssVar="--primary-foreground" hex="#F8FAFC" />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold uppercase tracking-widest text-muted-foreground">
            Tokens sémantiques (light)
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <ColorSwatch name="Background" cssVar="--background" hex="#FFFFFF" />
            <ColorSwatch name="Foreground" cssVar="--foreground" hex="#0A0A0A" />
            <ColorSwatch name="Card" cssVar="--card" hex="#FFFFFF" />
            <ColorSwatch name="Muted" cssVar="--muted" hex="#F5F5F5" />
            <ColorSwatch name="Muted FG" cssVar="--muted-foreground" hex="#737373" />
            <ColorSwatch name="Border" cssVar="--border" hex="#E5E5E5" />
            <ColorSwatch name="Destructive" cssVar="--destructive" hex="#EF4444" />
            <ColorSwatch name="Ring" cssVar="--ring" hex="#0A0A0A" />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-base font-semibold uppercase tracking-widest text-muted-foreground">
            Charts
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { n: "Chart 1", hex: "#E8613A" },
              { n: "Chart 2", hex: "#3A9E7E" },
              { n: "Chart 3", hex: "#2B4D5E" },
              { n: "Chart 4", hex: "#EDBE54" },
              { n: "Chart 5", hex: "#F0852A" },
            ].map(({ n, hex }) => (
              <ColorSwatch
                key={n}
                name={n}
                cssVar={`--${n.toLowerCase().replace(" ", "-")}`}
                hex={hex}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── 2. TYPOGRAPHY ──────────────────────────────────────────────────── */}
      <Section title="Typographie">
        <div className="mb-6 rounded-lg border border-border bg-card p-6">
          <p className="mb-1 font-mono text-xs text-muted-foreground">
            Police principale — Satoshi (woff2, variable 300–900)
          </p>
          <p className="text-5xl font-black">StroyGetter</p>
          <p className="mt-1 text-2xl font-bold">Download any video for free!</p>
          <p className="mt-1 text-xl font-semibold">Unlimited downloads. Ads free.</p>
          <p className="mt-1 text-base font-medium">No software required. Open-source.</p>
          <p className="mt-1 text-sm font-normal">
            StroyGetter is a free, open-source video downloader.
          </p>
          <p className="mt-1 text-xs font-light italic">
            Conversion may take some time. Please be patient.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Classe</th>
                <th className="pb-2 pr-4 font-medium">Taille</th>
                <th className="pb-2 pr-4 font-medium">Graisse</th>
                <th className="pb-2 font-medium">Utilisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                {
                  cls: "text-5xl font-black",
                  size: "3rem / 48px",
                  w: "900",
                  usage: "Titre principal hero",
                },
                {
                  cls: "text-5xl font-bold",
                  size: "3rem / 48px",
                  w: "700",
                  usage: "Titre hero (h2)",
                },
                {
                  cls: "text-5xl font-semibold",
                  size: "3rem / 48px",
                  w: "600",
                  usage: "Titre header (h1)",
                },
                {
                  cls: "text-2xl font-bold",
                  size: "1.5rem / 24px",
                  w: "700",
                  usage: "Titre section FAQ (h2)",
                },
                { cls: "text-xl", size: "1.25rem / 20px", w: "400", usage: "Sous-titre FAQ (h3)" },
                {
                  cls: "text-lg font-medium",
                  size: "1.125rem / 18px",
                  w: "500",
                  usage: "Bouton search",
                },
                { cls: "text-base", size: "1rem / 16px", w: "400", usage: "Corps, durée vidéo" },
                {
                  cls: "text-sm font-light italic",
                  size: "0.875rem / 14px",
                  w: "300 italic",
                  usage: "Note de bas de page",
                },
                { cls: "text-xs", size: "0.75rem / 12px", w: "400", usage: "Version footer, mono" },
              ].map((row) => (
                <tr key={row.cls}>
                  <td className="py-2 pr-4 font-mono text-xs">{row.cls}</td>
                  <td className="py-2 pr-4">{row.size}</td>
                  <td className="py-2 pr-4">{row.w}</td>
                  <td className="py-2 text-muted-foreground">{row.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── 3. SPACING & RADIUS ────────────────────────────────────────────── */}
      <Section title="Espacement & Radius">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Border Radius</h3>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "--radius-sm", cls: "rounded-sm", val: "0.25rem" },
                { label: "--radius-md", cls: "rounded-md", val: "0.375rem" },
                { label: "--radius (lg)", cls: "rounded-lg", val: "0.5rem" },
                { label: "rounded-full", cls: "rounded-full", val: "9999px" },
              ].map(({ label, cls, val }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`h-12 w-12 bg-primary ${cls}`} />
                  <span className="font-mono text-xs text-muted-foreground">{val}</span>
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Espacement clé</h3>
            <div className="flex flex-col gap-2 text-sm">
              {[
                { label: "p-2.5 (input padding)", val: "0.625rem" },
                { label: "px-4 py-2 (btn secondary)", val: "1rem / 0.5rem" },
                { label: "px-5 py-2.5 (btn primary)", val: "1.25rem / 0.625rem" },
                { label: "py-8 (sections)", val: "2rem" },
                { label: "mx-auto w-11/12 (content)", val: "91.666%" },
                { label: "md:w-4/6 (form)", val: "66.666%" },
              ].map(({ label, val }) => (
                <Token key={label} label={label} value={val} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. ICONS ──────────────────────────────────────────────────────── */}
      <Section title="Icônes">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="font-semibold">lucide-react</span> (taille standard : 24px) ·{" "}
            <span className="font-semibold">@icons-pack/react-simple-icons</span>
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: <ClipboardCopy size={24} />, name: "ClipboardCopy" },
              { icon: <Download size={24} />, name: "Download" },
              { icon: <Loader2 size={24} className="animate-spin" />, name: "Loader2" },
              { icon: <CircleCheckBig size={24} />, name: "CircleCheckBig" },
              { icon: <ChevronDown size={24} />, name: "ChevronDown" },
              { icon: <Check size={24} />, name: "Check" },
              { icon: <SiGithub size={24} />, name: "SiGithub" },
            ].map(({ icon, name }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
                  {icon}
                </div>
                <span className="font-mono text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── 5. UI COMPONENTS ──────────────────────────────────────────────── */}
      <Section title="Composants UI (shadcn/ui)">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Progress */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Progress</h3>
            <div className="flex flex-col gap-4">
              {[0, 33, 66, 100].map((v) => (
                <div key={v}>
                  <p className="mb-1 text-xs text-muted-foreground">{v}%</p>
                  <Progress value={v} />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Skeleton</h3>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-full rounded-full bg-black/10" />
              <Skeleton className="h-4 w-3/4 bg-black/10" />
              <Skeleton className="h-4 w-1/2 bg-black/10" />
            </div>
          </div>

          {/* Separator */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Separator</h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">Horizontal — bg-primary/50</p>
                <Separator className="h-0.5 bg-primary/50" />
              </div>
              <div className="flex h-16 items-center gap-4">
                <p className="text-xs text-muted-foreground">Vertical</p>
                <Separator orientation="vertical" className="h-full w-0.5 bg-primary/50" />
                <p className="text-sm">Contenu</p>
              </div>
            </div>
          </div>

          {/* Select */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">Select (Quality picker)</h3>
            <Select defaultValue="1080p">
              <SelectTrigger className="border-primary bg-secondary text-white outline-primary">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                {["2160p", "1440p", "1080p", "720p", "480p", "360p"].map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
                <SelectItem value="audio">Audio (mp3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* ── 6. CUSTOM COMPONENTS ──────────────────────────────────────────── */}
      <Section title="Composants Custom">
        {/* GetterInput — static preview */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">GetterInput</h3>
          <div className="rounded-lg border border-border bg-primary p-6">
            <div className="mx-auto flex w-full flex-col justify-center md:w-4/6">
              <div className="relative my-4 w-full">
                <input
                  type="text"
                  placeholder="Please enter a youtube video URL or a search query"
                  readOnly
                  className="block w-full rounded-md border border-[#081721] bg-[#081721] p-2.5 text-white focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center overflow-hidden rounded-r-md bg-secondary/25 px-4">
                  <ClipboardCopy size={24} />
                </div>
              </div>
              <button
                type="button"
                disabled
                className="mx-auto rounded-md border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white opacity-50 sm:w-auto"
              >
                Search
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Utilisé sur <code>/</code> et <code>/fetch</code> — champ URL + bouton clipboard +
            bouton search.
          </p>
        </div>

        {/* SkeletonInput */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">SkeletonInput</h3>
          <div className="rounded-lg border border-border bg-primary p-6">
            <div className="mx-auto flex w-full flex-col justify-center md:w-4/6">
              <div className="relative my-4 w-full">
                <Skeleton className="h-[3em] w-full rounded-full bg-black/60" />
              </div>
              <button
                type="button"
                disabled
                className="mx-auto rounded-full border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-center text-lg font-medium text-white opacity-50 sm:w-auto"
              >
                Loading
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Fallback Suspense affiché pendant le chargement de <code>GetterInput</code>.
          </p>
        </div>

        {/* VideoEmpty */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">VideoEmpty</h3>
          <div className="rounded-lg border border-border py-8">
            <div className="mx-auto my-2 flex h-auto w-11/12 rounded-lg border-2 border-dashed border-[#102F42]">
              <p className="mx-auto my-10 md:my-24">Please search a video first !</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            État vide affiché sur <code>/</code> avant toute recherche.
          </p>
        </div>

        {/* VideoLoading */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">VideoLoading</h3>
          <div className="rounded-lg border border-border py-8">
            <div className="mx-auto my-2 flex min-h-40 w-11/12 rounded-lg border-2 border-dashed border-[#102F42]">
              <Loader2 className="m-auto animate-spin text-primary" size={64} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Spinner affiché pendant le fetch des infos vidéo.
          </p>
        </div>

        {/* VideoSelect — static preview */}
        <div className="mb-6">
          <h3 className="mb-3 font-semibold">VideoSelect</h3>
          <div className="rounded-lg border border-border py-8">
            <div className="mx-auto my-2 flex h-auto min-h-40 w-11/12 rounded-lg border-2 border-dashed border-primary py-2 md:py-4 lg:text-xl">
              <div className="mx-2 hidden w-4/12 md:flex">
                <div className="m-auto aspect-video w-full rounded-lg bg-muted" />
              </div>
              <div className="my-auto flex w-full flex-col md:w-8/12">
                <h3 className="mx-2 line-clamp-2 font-semibold">
                  Titre de la vidéo YouTube — example title
                </h3>
                <p className="mx-2 text-right text-base italic">Nom de l&apos;auteur</p>
                <p className="mx-2 text-right text-sm font-light italic">(342 seconds)</p>
                <div className="mx-2 flex flex-col justify-end md:my-2 md:flex-row">
                  <Select defaultValue="1080p">
                    <SelectTrigger className="my-0.5 w-full border-primary bg-secondary text-white outline-primary md:mx-2 md:h-auto">
                      <SelectValue placeholder="Quality" />
                    </SelectTrigger>
                    <SelectContent>
                      {["1080p", "720p", "480p"].map((q) => (
                        <SelectItem key={q} value={q}>
                          {q}
                        </SelectItem>
                      ))}
                      <SelectItem value="audio">Audio (mp3)</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    className="flex w-full flex-row justify-center rounded-lg border-2 border-transparent bg-[#102F42] px-4 py-2 text-center font-bold text-white transition-all ease-in-out hover:cursor-pointer hover:border-primary hover:bg-secondary md:mx-2"
                  >
                    Download <Download className="ml-2" size={24} />
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-sm font-extralight italic opacity-80 md:text-base md:font-light">
              Conversion may take some time. <br />
              Please be patient and do not reload the page.
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Carte principale de sélection de qualité + téléchargement sur <code>/fetch</code>.
          </p>
        </div>
      </Section>

      {/* ── 7. LAYOUT PATTERNS ────────────────────────────────────────────── */}
      <Section title="Patterns de Layout">
        <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Hero Section",
              desc: "bg-primary · py-8 · texte centré · form mx-auto w-4/6",
            },
            {
              name: "Content Width",
              desc: "mx-auto w-11/12 (sections) · max-w-5xl (design system)",
            },
            {
              name: "Header",
              desc: "flex justify-between · bg-primary · px-4 py-2 · logo + titre + lien GitHub",
            },
            {
              name: "FAQ Grid",
              desc: "flex-col lg:flex-row · w-full lg:w-1/2 · séparé par un Separator",
            },
            {
              name: "Video Card",
              desc: "border-2 border-dashed border-primary · rounded-lg · flex row (thumbnail + infos)",
            },
            {
              name: "Footer",
              desc: "my-4 text-center · lien versionné",
            },
          ].map(({ name, desc }) => (
            <div key={name} className="rounded-lg border border-border bg-card p-4">
              <p className="font-semibold">{name}</p>
              <p className="mt-1 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 8. STATES ─────────────────────────────────────────────────────── */}
      <Section title="États des boutons">
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-lg font-medium text-white transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-[#205D83] hover:bg-[#102F42]"
            >
              Search
            </button>
            <span className="text-xs text-muted-foreground">Default</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled
              className="rounded-md border border-solid border-transparent bg-[#205D83] px-5 py-2.5 text-lg font-medium text-white opacity-50"
            >
              Search
            </button>
            <span className="text-xs text-muted-foreground">Disabled</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="flex flex-row justify-center rounded-lg border-2 border-transparent bg-[#102F42] px-4 py-2 font-bold text-white transition-all ease-in-out hover:cursor-pointer hover:border-primary hover:bg-secondary"
            >
              Download <Download className="ml-2" size={24} />
            </button>
            <span className="text-xs text-muted-foreground">Download default</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="flex flex-row justify-center rounded-lg border-2 border-primary bg-secondary px-4 py-2 font-bold text-white"
            >
              Download <Download className="ml-2" size={24} />
            </button>
            <span className="text-xs text-muted-foreground">Download hover</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="flex items-center rounded-md bg-secondary px-4 py-2.5 transition-all hover:cursor-pointer hover:bg-secondary/60"
            >
              <ClipboardCopy size={24} />
            </button>
            <span className="text-xs text-muted-foreground">Clipboard (active)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="flex items-center rounded-md bg-secondary/25 px-4 py-2.5 opacity-50"
            >
              <ClipboardCopy size={24} />
            </button>
            <span className="text-xs text-muted-foreground">Clipboard (no perm)</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
