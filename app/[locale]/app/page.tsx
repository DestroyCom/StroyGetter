import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  ArrowRight,
  Check,
  Download,
  ExternalLink,
  FileCheck,
  Film,
  Globe,
  History,
  Key,
  Monitor,
  Music,
  Pencil,
  Server,
  Shield,
  ShieldCheck,
  Smartphone,
  Terminal,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/custom/JsonLd";
import { buildAlternates } from "@/i18n/metadata";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return {
    title: tMeta("appTitle"),
    description: tMeta("appDesc"),
    alternates: buildAlternates(locale, "/app"),
    openGraph: {
      title: tMeta("appTitle"),
      description: tMeta("appDesc"),
      url: `${siteConfig.url}/${locale}/app`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: tMeta("appTitle"),
      description: tMeta("appDesc"),
      images: ["/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const RELEASES_URL = `${siteConfig.githubNativeUrl}/releases/latest`;

type ReleaseAssets = {
  version: string | null;
  windows: string | null;
  macos: string | null;
  linuxAppImage: string | null;
  linuxDeb: string | null;
};

async function fetchLatestRelease(): Promise<ReleaseAssets> {
  const empty: ReleaseAssets = {
    version: null,
    windows: null,
    macos: null,
    linuxAppImage: null,
    linuxDeb: null,
  };
  try {
    const res = await fetch(
      "https://api.github.com/repos/DestroyCom/Stroygetter-Native/releases/latest",
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        cache: "force-cache",
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return empty;
    const data = (await res.json()) as {
      tag_name?: string;
      assets?: { name: string; browser_download_url: string }[];
    };
    const assets = data.assets ?? [];
    const find = (pattern: RegExp) =>
      assets.find((a) => pattern.test(a.name))?.browser_download_url ?? null;
    return {
      version: data.tag_name ?? null,
      windows: find(/x64-setup\.exe$/),
      macos: find(/aarch64\.dmg$/),
      linuxAppImage: find(/amd64\.AppImage$/),
      linuxDeb: find(/amd64\.deb$/),
    };
  } catch {
    return empty;
  }
}

const SECURITY_CMDS = {
  sha256: "shasum -a 256 -c SHA256SUMS-PLATFORM.txt",
  attest: "gh attestation verify FILE --repo DestroyCom/Stroygetter-Native",
  gpg: "curl https://github.com/DestroyCom.gpg | gpg --import\ngpg --verify FILE.asc FILE",
} as const;

export default async function NativeAppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, release] = await Promise.all([
    getTranslations("nativeApp"),
    fetchLatestRelease(),
  ]);
  const { version: latestVersion } = release;

  const WHY = [
    { Icon: Server, title: t("why1Title"), body: t("why1Body") },
    { Icon: Zap, title: t("why2Title"), body: t("why2Body") },
    { Icon: Monitor, title: t("why3Title"), body: t("why3Body") },
  ];

  const PLATFORMS = [
    {
      Icon: Monitor,
      label: t("windowsLabel"),
      meta: t("windowsMeta"),
      desc: t("windowsDesc"),
      href: release.windows ?? RELEASES_URL,
      filename: "_x64-setup.exe",
    },
    {
      Icon: Monitor,
      label: t("macosAsLabel"),
      meta: t("macosAsMeta"),
      desc: t("macosAsDesc"),
      href: release.macos ?? RELEASES_URL,
      filename: "_aarch64.dmg",
    },
    {
      Icon: Terminal,
      label: t("linuxLabel"),
      meta: t("linuxMeta"),
      desc: t("linuxDesc"),
      hrefAppImage: release.linuxAppImage ?? RELEASES_URL,
      hrefDeb: release.linuxDeb ?? RELEASES_URL,
      filename: "_amd64.AppImage / _amd64.deb",
    },
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "StroyGetter Native",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Windows, macOS, Linux",
          offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          url: `${siteConfig.url}/${locale}/app`,
          downloadUrl: RELEASES_URL,
          author: {
            "@type": "Organization",
            name: "StroyCo",
            url: siteConfig.stroycoUrl,
          },
        }}
      />

      {/* ── HERO ── */}
      <section className="bg-stroy-500 px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3 text-[12px] font-bold uppercase tracking-widest text-stroy-300">
            <span>{t("label")}</span>
            {latestVersion && (
              <>
                <span className="opacity-40">·</span>
                <span>
                  {t("latestVersion")}
                  {latestVersion}
                </span>
              </>
            )}
          </div>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-6xl">
            {t("heroTitle")}
            <br />
            <em className="font-light italic text-white/78">{t("heroSubtitle")}</em>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/78">
            {t("heroDesc")}
          </p>

          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-base font-bold text-stroy-900 transition-colors hover:bg-stroy-100"
          >
            <Download size={18} />
            {t("downloadTitle")}
          </a>

          <div className="mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm text-white/70">
            {[t("badge1"), t("badge2"), t("badge3")].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5">
                <Check size={14} className="text-stroy-300" /> {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("whyLabel")}
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("whyTitle")}
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className="relative rounded-2xl border border-white/10 bg-white/2.5 p-8"
              >
                <span className="absolute right-7 top-7 font-mono text-xs tracking-wider text-white/40">
                  0{i + 1}
                </span>
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                  <item.Icon size={20} />
                </div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("featuresLabel")}
            </p>
            <h2 className="text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("featuresTitle")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Film, title: t("feat1Title"), desc: t("feat1Desc") },
              { Icon: Smartphone, title: t("feat2Title"), desc: t("feat2Desc") },
              { Icon: Monitor, title: t("feat3Title"), desc: t("feat3Desc") },
              { Icon: Music, title: t("feat4Title"), desc: t("feat4Desc"), featured: true },
              { Icon: Pencil, title: t("feat5Title"), desc: t("feat5Desc"), featured: true },
              { Icon: History, title: t("feat6Title"), desc: t("feat6Desc") },
              { Icon: Globe, title: t("feat7Title"), desc: t("feat7Desc") },
            ].map((f) => (
              <div
                key={f.title}
                className={`flex flex-col gap-4 rounded-2xl border p-7 ${"featured" in f && f.featured ? "border-stroy-300/30 bg-stroy-700" : "border-white/8 bg-stroy-800"}`}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/6 text-stroy-100">
                  <f.Icon size={18} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-[17px] font-bold tracking-tight">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section className="bg-stroy-500 px-4 py-20 md:px-14 md:py-24" id="download">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("downloadLabel")}
            </p>
            <h2 className="mb-3 text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("downloadTitle")}
            </h2>
            <p className="text-sm text-white/65">{t("downloadDesc")}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORMS.map((p) => {
              const isLinux = "hrefAppImage" in p;
              return isLinux ? (
                <div
                  key={p.label}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-stroy-700 p-8"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                    <p.Icon size={20} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-bold tracking-tight">{p.label}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                      {p.meta}
                    </p>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-white/70">{p.desc}</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={p.hrefAppImage}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
                    >
                      <Download size={14} />
                      {t("downloadAppImage")}
                    </a>
                    <a
                      href={p.hrefDeb}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
                    >
                      <Download size={14} />
                      {t("downloadDeb")}
                    </a>
                  </div>
                </div>
              ) : (
                <a
                  key={p.label}
                  href={p.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-stroy-700 p-8 transition-colors hover:border-white/25 hover:bg-stroy-600"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                    <p.Icon size={20} />
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-bold tracking-tight">{p.label}</h3>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                      {p.meta}
                    </p>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-white/70">{p.desc}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors group-hover:text-white">
                    <Download size={14} />
                    {t("downloadBtn", { platform: p.label })}
                  </span>
                </a>
              );
            })}

            {/* Android — community alternatives */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-stroy-700 p-8">
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="mb-1 text-xl font-bold tracking-tight">{t("androidLabel")}</h3>
                <p className="font-mono text-[11px] uppercase tracking-wider text-stroy-300">
                  {t("androidMeta")}
                </p>
              </div>
              <p className="flex-1 text-sm leading-relaxed text-white/70">{t("androidDesc")}</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/deniscerri/ytdlnis"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
                >
                  <ExternalLink size={14} />
                  YTDLnis
                </a>
                <a
                  href="https://github.com/junkfood02/Seal"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
                >
                  <ExternalLink size={14} />
                  Seal
                </a>
              </div>
            </div>
          </div>

          {/* ── FILE GUIDE ── */}
          <div className="mt-8 rounded-2xl border border-white/8 bg-stroy-800 px-6 py-5">
            <p className="mb-4 text-sm font-bold text-white/90">{t("fileGuideTitle")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: t("fileGuideWindows"), file: "_x64-setup.exe" },
                { label: t("fileGuideMac"), file: "_aarch64.dmg" },
                { label: t("fileGuideLinuxAppImage"), file: "_amd64.AppImage" },
                { label: t("fileGuideLinuxDeb"), file: "_amd64.deb" },
              ].map(({ label, file }) => (
                <div key={file} className="flex items-center justify-between gap-4 rounded-xl bg-white/4 px-4 py-2.5">
                  <span className="text-sm text-white/70">{label}</span>
                  <code className="shrink-0 rounded bg-black/30 px-2 py-0.5 font-mono text-[11px] text-stroy-300">
                    {file}
                  </code>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/40">{t("fileGuideNote")}</p>
          </div>

          <div className="mt-6 text-center">
            <a
              href={`${siteConfig.githubNativeUrl}/releases`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
            >
              <SiGithub size={14} />
              {t("allReleasesBtn")}
            </a>
          </div>
        </div>
      </section>

      {/* ── SECURITY ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto max-w-9xl">
          <div className="mb-10">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stroy-300">
              {t("securityLabel")}
            </p>
            <h2 className="mb-4 text-balance text-4xl font-bold leading-tight tracking-tight">
              {t("securityTitle")}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/70">{t("securityDesc")}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* SHA-256 */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/2.5 p-8">
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                <FileCheck size={20} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{t("sha256Title")}</h3>
                <p className="text-sm leading-relaxed text-white/70">{t("sha256Desc")}</p>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/40 px-5 py-4 font-mono text-[12px] text-stroy-200">
                {SECURITY_CMDS.sha256}
              </pre>
            </div>

            {/* GitHub Attestations */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/2.5 p-8">
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{t("attestTitle")}</h3>
                <p className="text-sm leading-relaxed text-white/70">{t("attestDesc")}</p>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/40 px-5 py-4 font-mono text-[12px] text-stroy-200">
                {SECURITY_CMDS.attest}
              </pre>
            </div>

            {/* GPG */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/2.5 p-8">
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                <Key size={20} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{t("gpgTitle")}</h3>
                <p className="text-sm leading-relaxed text-white/70">{t("gpgDesc")}</p>
              </div>
              <pre className="overflow-x-auto rounded-xl bg-black/40 px-5 py-4 font-mono text-[12px] leading-relaxed text-stroy-200">
                {SECURITY_CMDS.gpg}
              </pre>
            </div>

            {/* VirusTotal */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/2.5 p-8">
              <div className="flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold tracking-tight">{t("virusTitle")}</h3>
                <p className="text-sm leading-relaxed text-white/70">{t("virusDesc")}</p>
              </div>
              <a
                href={`${siteConfig.githubNativeUrl}/releases/latest`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-auto text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
              >
                {t("virusBtn")}
              </a>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a
              href={`${siteConfig.githubNativeUrl}/blob/main/SECURITY.md`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 text-sm font-semibold text-stroy-300 transition-colors hover:text-white"
            >
              <SiGithub size={14} />
              {t("securityDocsBtn")}
            </a>
          </div>
        </div>
      </section>

      {/* ── SOURCE + CTA ── */}
      <section className="bg-stroy-800 px-4 py-20 md:px-14 md:py-24">
        <div className="mx-auto grid max-w-9xl gap-5 md:grid-cols-2">
          {/* Open source card */}
          <div className="rounded-2xl border border-white/10 bg-white/2.5 p-10">
            <div className="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/6 bg-stroy-950">
              <SiGithub size={20} />
            </div>
            <h3 className="mb-3 text-2xl font-bold tracking-tight">{t("sourceTitle")}</h3>
            <p className="mb-6 text-sm leading-relaxed text-white/70">{t("sourceDesc")}</p>
            <a
              href={siteConfig.githubNativeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-xl border border-white/18 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/40"
            >
              <SiGithub size={14} />
              {t("sourceBtn")}
            </a>
          </div>

          {/* Web CTA card */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stroy-300/20 bg-stroy-700 p-10 text-center">
            <h3 className="mb-3 text-2xl font-bold tracking-tight">{t("ctaTitle")}</h3>
            <p className="mb-6 text-sm leading-relaxed text-white/70">{t("ctaDesc")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-2xl bg-stroy-500 px-8 py-4 text-base font-bold text-white transition-colors hover:bg-stroy-600"
            >
              {t("ctaBtn")}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
