"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowLeft, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import logo from "@/assets/logo-white.svg";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Formats", href: "/#formats" },
  { label: "FAQ", href: "/#faq" },
  { label: "Guide", href: "/how-to-download-youtube-videos" },
  { label: "Updates", href: "/updates" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFetch = pathname.startsWith("/fetch");
  const [mobileOpen, setMobileOpen] = useState(false);

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
        aria-label="StroyGetter home"
      >
        <Image src={logo} height={36} alt="" aria-hidden="true" />
        <span className="text-xl font-bold tracking-tight">StroyGetter</span>
      </Link>

      {/* Compact fetch nav — logo + "← New search" only */}
      {isFetch ? (
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          New search
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
              GitHub
            </a>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-2 text-white/78 transition-colors hover:bg-white/8 hover:text-white md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
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
                  GitHub
                </a>
              </nav>
            </div>
          )}
        </>
      )}
    </header>
  );
}
