import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.svg";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="bg-stroy-900 border-t-2 border-white/10 pt-16 pb-8">
      <div className="mx-auto max-w-9xl px-4 md:px-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="mb-4 flex items-center gap-3 text-white no-underline"
            >
              <Image
                src={logo}
                height={32}
                alt=""
                aria-hidden="true"
                className="brightness-0 invert"
              />
              <span className="text-lg font-semibold tracking-tight">
                StroyGetter
              </span>
            </Link>
            <p className="mb-4 max-w-[300px] text-sm leading-relaxed text-white/65">
              Free, open-source YouTube downloader. No signup, no ads, no
              installs. Download MP4 video or MP3 audio directly from your
              browser.
            </p>
            <div className="flex items-center gap-3 text-xs text-white/55">
              <span>MIT licensed</span>
              <span className="size-1 rounded-full bg-current" />
              <span>Open source</span>
            </div>
          </div>

          {/* Tool */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Tool
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Downloader
                </Link>
              </li>
              <li>
                <Link
                  href="/#formats"
                  className="hover:text-white transition-colors"
                >
                  Supported formats
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Learn
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <Link
                  href="/updates"
                  className="hover:text-white transition-colors"
                >
                  Updates &amp; changelog
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-download-youtube-videos"
                  className="hover:text-white transition-colors"
                >
                  How to download a YouTube video
                </Link>
              </li>
              <li>
                <Link
                  href="/#faq"
                  className="hover:text-white transition-colors"
                >
                  YouTube glossary
                </Link>
              </li>
              <li>
                <Link
                  href="/#formats"
                  className="hover:text-white transition-colors"
                >
                  MP4 vs MP3
                </Link>
              </li>
              <li>
                <Link
                  href="/#formats"
                  className="hover:text-white transition-colors"
                >
                  Library Ready explained
                </Link>
              </li>
            </ul>
          </div>

          {/* Related */}
          <div>
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
              Related
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-white/78">
              <li>
                <a
                  href={siteConfig.stroycoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  StroyCo ↗
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.discordUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  StroyCord ↗
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.botUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-white transition-colors"
                >
                  Stroybot ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/8 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {`${new Date().getFullYear()} `} StroyCo · For personal &amp;
            educational use only.
          </span>
          <nav
            className="flex flex-wrap gap-4 md:gap-6"
            aria-label="Legal navigation"
          >
            <Link
              href="/legal/terms"
              className="hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/legal/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/legal/dmca"
              className="hover:text-white transition-colors"
            >
              DMCA
            </Link>
            <Link
              href="/legal/cookies"
              className="hover:text-white transition-colors"
            >
              Cookies
            </Link>
            <Link
              href="/legal/contact"
              className="hover:text-white transition-colors"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
