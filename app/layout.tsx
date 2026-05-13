import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { JsonLd } from "@/components/custom/JsonLd";
import { SiteFooter } from "@/components/custom/SiteFooter";
import { SiteHeader } from "@/components/custom/SiteHeader";
import { siteConfig } from "@/lib/site-config";

const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Light.woff2", weight: "300", style: "normal" },
    {
      path: "./fonts/Satoshi-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    { path: "./fonts/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Satoshi-Medium.woff2", weight: "500", style: "normal" },
    {
      path: "./fonts/Satoshi-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    { path: "./fonts/Satoshi-Bold.woff2", weight: "700", style: "normal" },
    {
      path: "./fonts/Satoshi-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    { path: "./fonts/Satoshi-Black.woff2", weight: "900", style: "normal" },
    {
      path: "./fonts/Satoshi-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
    {
      path: "./fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/" },
  title: {
    default: "StroyGetter — Free YouTube Video Downloader",
    template: "%s — StroyGetter",
  },
  description:
    "Download YouTube videos as MP4 or MP3 for free. No signup, no ads, no install. Supports up to 4K, MP3 audio at 190 kbps, and Library Ready with cover art, ID3 tags and synced lyrics.",
  keywords: [
    "youtube downloader free",
    "télécharger vidéo youtube mp4",
    "youtube to mp3",
    "download youtube video",
    "stroygetter",
    "stroy",
    "free video downloader",
    "youtube mp4 download",
    "youtube mp3 converter",
  ],
  publisher: "StroyCo",
  openGraph: {
    type: "website",
    title: "StroyGetter — Free YouTube Video Downloader",
    siteName: "StroyGetter",
    description:
      "Download YouTube videos as MP4 or MP3, free and without software. Supports up to 4K, MP3 audio, and Library Ready with full ID3 metadata.",
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
    google: "ZO0XEa1dBNGM8tkB6TiNCSxOss9mLdtQZD8iJF49dIo",
    yandex: "be615c3f5ef3d5fb",
  },
  other: { "msvalidate.01": "486F933C672E42FA6F606CDF0B603A83" },
};

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "StroyGetter",
  url: siteConfig.url,
  description:
    "Free online YouTube video downloader. Download YouTube videos as MP4 (up to 4K) or MP3 audio (190 kbps), or as Library Ready MP3 with cover art, ID3 tags and synced lyrics. No signup, no ads, no install.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements:
    "Requires a modern browser (Chrome, Firefox, Safari, Edge 2023+)",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${satoshi.variable} font-satoshi antialiased`}>
        <JsonLd data={webAppJsonLd} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
      <GoogleAnalytics gaId="G-X2X4B9LKDW" />
    </html>
  );
}
