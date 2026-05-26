import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/custom/JsonLd";
import { SiteFooter } from "@/components/custom/SiteFooter";
import { SiteHeader } from "@/components/custom/SiteHeader";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";
import "../globals.css";

const satoshi = localFont({
  src: [
    { path: "../fonts/Satoshi-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Satoshi-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "../fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Satoshi-Italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Satoshi-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Satoshi-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
    { path: "../fonts/Satoshi-BlackItalic.woff2", weight: "900", style: "italic" },
    { path: "../fonts/Satoshi-Variable.woff2", weight: "300 900", style: "normal" },
    { path: "../fonts/Satoshi-VariableItalic.woff2", weight: "300 900", style: "italic" },
  ],
  variable: "--font-satoshi",
});

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: tMeta("homeTitle"),
      template: `%s — StroyGetter`,
    },
    description: tMeta("homeDesc"),
    keywords: [
      "youtube to mp3 with album art",
      "youtube to mp3 id3 tags",
      "youtube to mp3 with cover art",
      "youtube mp3 with lyrics",
      "library ready mp3",
      "youtube downloader free",
      "télécharger vidéo youtube mp4",
      "youtube to mp3",
      "download youtube video",
      "stroygetter",
      "free video downloader",
      "youtube mp4 download",
      "youtube mp3 converter",
    ],
    publisher: "StroyCo",
    openGraph: {
      type: "website",
      locale: "en_US",
      title: "StroyGetter — Free YouTube Video Downloader",
      siteName: "StroyGetter",
      description:
        "Download YouTube music as Library Ready MP3 with cover art, ID3 tags and synced lyrics or grab MP4 up to 4K. Free, no signup, no ads.",
      url: `${siteConfig.url}/`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "StroyGetter — Free YouTube Video Downloader",
      description:
        "No ads. Unlimited downloads. Download videos at max quality for free — no software required.",
      images: [`${siteConfig.url}/twitter-image.png`],
    },
    verification: {
      google: siteConfig.googleVerification || undefined,
      yandex: siteConfig.yandexVerification || undefined,
    },
    other: siteConfig.bingVerification ? { "msvalidate.01": siteConfig.bingVerification } : {},
  };
}

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "StroyGetter",
  url: siteConfig.url,
  description:
    "Free online YouTube video downloader. Download YouTube videos as MP4 (up to 4K) or MP3 audio (190 kbps), or as Library Ready MP3 with cover art, ID3 tags and synced lyrics. No signup, no ads, no install.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires a modern browser (Chrome, Firefox, Safari, Edge 2023+)",
  featureList: [
    "Download YouTube videos as MP4",
    "Download YouTube audio as MP3",
    "Library Ready MP3 with ID3 tags and synced lyrics",
    "No signup required",
    "No ads",
    "Open source",
  ],
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  author: {
    "@type": "Organization",
    name: "StroyCo",
    url: siteConfig.stroycoUrl,
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className={`${satoshi.variable} font-satoshi antialiased flex min-h-dvh flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <JsonLd data={webAppJsonLd} />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
      {siteConfig.umamiUrl && (
        <>
          <Script
            src={`${siteConfig.umamiUrl}/script.js`}
            data-website-id={siteConfig.umamiWebsiteId}
            strategy="afterInteractive"
          />
          <Script
            src={`${siteConfig.umamiUrl}/recorder.js`}
            data-website-id={siteConfig.umamiWebsiteId}
            data-sample-rate="0.15"
            data-mask-level="moderate"
            data-max-duration="300000"
            strategy="afterInteractive"
          />
        </>
      )}
    </html>
  );
}
