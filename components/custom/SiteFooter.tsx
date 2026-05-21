import Image from "next/image";
import { useTranslations } from "next-intl";
import logo from "@/assets/logo.svg";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="bg-stroy-900 border-t-2 border-white/10 pt-16 pb-8">
      <div className="mx-auto max-w-9xl px-4 md:px-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-3 text-white no-underline">
              <Image
                src={logo}
                height={32}
                alt=""
                aria-hidden="true"
                className="brightness-0 invert"
              />
              <span className="text-lg font-semibold tracking-tight">StroyGetter</span>
            </Link>
            <p className="mb-4 max-w-[300px] text-sm leading-relaxed text-white/65">
              {t("tagline")}
            </p>
            <div className="flex items-center gap-3 text-xs text-white/55">
              <span>{t("mitLicensed")}</span>
              <span className="size-1 rounded-full bg-current" />
              <span>{t("openSource")}</span>
            </div>
          </div>

          {/* Tool */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              {t("sectionTool")}
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  {t("toolDownloader")}
                </Link>
              </li>
              <li>
                <Link href="/#formats" className="transition-colors hover:text-white">
                  {t("toolFormats")}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="transition-colors hover:text-white">
                  {t("toolHowItWorks")}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="transition-colors hover:text-white">
                  {t("toolFaq")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              {t("sectionLearn")}
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <Link href="/updates" className="transition-colors hover:text-white">
                  {t("learnUpdates")}
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-download-youtube-videos"
                  className="transition-colors hover:text-white"
                >
                  {t("learnHowTo")}
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="transition-colors hover:text-white">
                  {t("learnGlossary")}
                </Link>
              </li>
              <li>
                <Link href="/#formats" className="transition-colors hover:text-white">
                  {t("learnMp4vsMp3")}
                </Link>
              </li>
              <li>
                <Link href="/#formats" className="transition-colors hover:text-white">
                  {t("learnLibraryReady")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Related */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              {t("sectionRelated")}
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <a
                  href={siteConfig.stroycoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-white"
                >
                  StroyCo ↗
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.discordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-white"
                >
                  StroyCord ↗
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.botUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition-colors hover:text-white"
                >
                  Stroybot ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>{t("copyright", { year: new Date().getFullYear() })}</span>
          <nav className="flex flex-wrap gap-4 md:gap-6" aria-label="Legal navigation">
            <Link href="/legal/terms" className="transition-colors hover:text-white">
              {t("legalTerms")}
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-white">
              {t("legalPrivacy")}
            </Link>
            <Link href="/legal/dmca" className="transition-colors hover:text-white">
              {t("legalDmca")}
            </Link>
            <Link href="/legal/cookies" className="transition-colors hover:text-white">
              {t("legalCookies")}
            </Link>
            <Link href="/legal/contact" className="transition-colors hover:text-white">
              {t("legalContact")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
