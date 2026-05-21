"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowLeft, Menu, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import logo from "@/assets/logo-white.svg";
import { LocaleSwitcher } from "@/components/custom/LocaleSwitcher";
import { Link, usePathname } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFetch = pathname.startsWith("/fetch");
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");

  const NAV_LINKS = [
    { label: t("howItWorks"), href: "/#how-it-works" },
    { label: t("formats"), href: "/#formats" },
    { label: t("faq"), href: "/#faq" },
    { label: t("guide"), href: "/how-to-download-youtube-videos" },
    { label: t("updates"), href: "/updates" },
  ];

  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-white/8 bg-stroy-500",
        isHome ? "px-4 py-6 md:px-14" : "px-4 py-4 md:px-14"
      )}
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-3 text-white no-underline"
        aria-label={t("home")}
      >
        <Image src={logo} height={36} alt="" aria-hidden="true" />
        <span className="text-xl font-bold tracking-tight">StroyGetter</span>
      </Link>

      {/* Compact fetch nav */}
      {isFetch ? (
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          {t("newSearch")}
        </Link>
      ) : (
        <>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-white/78 transition-colors duration-200 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 rounded-full border border-white/18 px-3.5 py-1.5 text-sm text-white transition-colors duration-200 hover:border-white/40"
              aria-label="StroyGetter on GitHub"
            >
              <SiGithub size={14} />
              {t("github")}
            </a>
            <LocaleSwitcher />
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 text-white/78 transition-colors hover:bg-white/8 hover:text-white md:hidden"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Mobile menu overlay */}
          {mobileOpen && (
            <div className="absolute inset-x-0 top-full z-50 border-b border-white/8 bg-stroy-500 px-4 py-4 md:hidden">
              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {NAV_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-lg px-4 py-3 text-sm text-white/78 transition-colors hover:bg-white/8 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {l.label}
                  </Link>
                ))}
                <a
                  href={siteConfig.githubUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-white/78 transition-colors hover:bg-white/8 hover:text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  <SiGithub size={14} />
                  {t("github")}
                </a>
                <div className="mt-2 px-4 py-2">
                  <LocaleSwitcher />
                </div>
              </nav>
            </div>
          )}
        </>
      )}
    </header>
  );
}
