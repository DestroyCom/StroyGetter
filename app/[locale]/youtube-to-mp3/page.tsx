import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AudioConverterLanding } from "@/components/custom/AudioConverterLanding";
import { buildAlternates } from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/youtube-to-mp3";
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("ytMp3Title"),
    description: t("ytMp3Desc"),
    alternates: buildAlternates(locale, path),
    openGraph: {
      title: t("ytMp3Title"),
      description: t("ytMp3Desc"),
      url: `${siteConfig.url}/${locale}${path}`,
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ytMp3Title"),
      description: t("ytMp3Desc"),
      images: ["/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function YouTubeToMP3Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AudioConverterLanding variant="mp3" />;
}
