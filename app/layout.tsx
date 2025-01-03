import type { Metadata } from "next";
import { Nunito_Sans, Nunito } from "next/font/google";
import "./globals.css";
import { SiGithub } from "@icons-pack/react-simple-icons";

import logo from "@/assets/logo.svg";
import { Separator } from "@/components/ui/separator";
import getConfig from "next/config";
import Image from "next/image";
import { GoogleAnalytics } from "@next/third-parties/google";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  weight: "400",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stroygetter.stroyco.eu"),
  alternates: {
    canonical: "/",
  },
  title: "StroyGetter",
  description: "Get your videos, the easy way.",
  keywords: ["video", "download", "audio", "free", "no ads", "converter"],
  publisher: "StroyCo",
  openGraph: {
    title: "StroyGetter",
    siteName: "StroyGetter - Download any youtube video for free !",
    description: "Download any youtube video for free in any resolution",
    url: "https://stroygetter.stroyco.eu/",
    images: "/og-image.png",
  },
  twitter: {
    title: "StroyGetter - Download any youtube video for free !",
    description:
      "No ads. Unlimited downloads. Download videos at max quality (available) for free and without software !",
    site: "@ADSantoine",
  },
  verification: {
    google: "ZO0XEa1dBNGM8tkB6TiNCSxOss9mLdtQZD8iJF49dIo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { publicRuntimeConfig } = getConfig();
  const version = publicRuntimeConfig?.version;

  return (
    <html lang="en">
      <body
        className={`${nunitoSans.variable} ${nunito.variable} font-sans antialiased`}
      >
        <header className="flex justify-between bg-primary px-4 py-2">
          <div className="flex justify-start">
            <Image src={logo} height={96} alt="StroyGetter" />
            <h1 className="my-auto ml-4 text-3xl font-bold">StroyGetter</h1>
          </div>
          <div className="hidden flex-col md:flex">
            <a
              className="flex transition-all hover:opacity-50"
              href="https://github.com/DestroyCom/StroyGetter"
              target="_blank"
              rel="noreferrer noopener"
              title="Code source of StroyGetter"
            >
              <SiGithub className="mr-4" />{" "}
              <p className="underline">The project code</p>
            </a>
          </div>
        </header>
        <main>{children}</main>
        <section id="faq" className="mx-auto mt-4 w-11/12">
          <h3 className="w-11/12 text-2xl font-bold">FAQ</h3>
          <div className="flex flex-col lg:flex-row lg:justify-between">
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">What is StroyGetter ?</h2>
              <p>
                StroyGetter is a{" "}
                <a
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Youtube
                </a>{" "}
                downloader, so you can download almost any video{" "}
                <span className="italic">(of your own)</span> in any available
                quality.
                <br />
                Audio-only conversion is also available.
              </p>
            </div>
            <Separator
              orientation="vertical"
              className="mx-4 hidden h-40 w-0.5 bg-primary/50 lg:block"
            />
            <Separator className="my-4 h-0.5 w-full bg-primary/50 lg:hidden" />
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">
                Why use StroyGetter and not another alternative?
              </h2>
              <p>
                StroyGetter is totally free and requires no software download to
                achieve maximum video quality.
                <br />
                What&apos;s more, StroyGetter is Open-Source, meaning that
                anyone can view the code or contribute to it, which limits any
                possible security loopholes.
              </p>
            </div>
          </div>
          <Separator className="my-4 h-0.5 w-full bg-primary/50" />
          <div className="flex flex-col lg:flex-row lg:justify-between">
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">
                Totally free, where&apos;s the catch ?
              </h2>
              <p>
                There&apos;s no catch, we just use statistical tools to find out
                how people use the site and count visitors, and that&apos;s it.
                Of course, depending on traffic, we reserve the right to add
                non-intrusive ads to finance server costs.
              </p>
            </div>
            <Separator
              orientation="vertical"
              className="mx-4 hidden h-40 w-0.5 bg-primary/50 lg:block"
            />
            <Separator className="my-4 h-0.5 w-full bg-primary/50 lg:hidden" />
            <div className="w-full lg:w-1/2">
              <h2 className="my-2 text-xl">Why is my conversion slow ?</h2>
              <p>
                The conversion speed depends on the quality of the video you
                want to download. The higher the quality, the longer the
                conversion time.
                <br />
                If you have a slow internet connection or if a lot of people are
                using the site at the same time, the conversion may be impacted
                as well.
              </p>
            </div>
          </div>
        </section>
        <footer className="mx-auto my-4 text-center">
          <a
            className="text-sm hover:cursor-pointer hover:underline hover:opacity-75"
            href="https://portfolio.stroyco.eu/"
          >
            StroyGetter - {version}
          </a>
        </footer>
      </body>
      <GoogleAnalytics gaId="G-X2X4B9LKDW" />
    </html>
  );
}
