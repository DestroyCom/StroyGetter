import { Shield } from "lucide-react";
import Link from "next/link";

const LEGAL_NAV = [
  { href: "/legal/terms", label: "Terms of use" },
  { href: "/legal/privacy", label: "Privacy policy" },
  { href: "/legal/cookies", label: "Cookies & analytics" },
  { href: "/legal/dmca", label: "DMCA / takedown" },
  { href: "/legal/contact", label: "Contact" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-stroy-500 px-4 py-12 md:px-14">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <aside>
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            Legal
          </p>
          <nav className="flex flex-col gap-1" aria-label="Legal pages navigation">
            {LEGAL_NAV.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2.5 text-sm text-white/65 transition-all hover:bg-white/4 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-xl bg-black/20 p-4 text-xs leading-relaxed text-white/65">
            <Shield size={16} className="mb-2 text-stroy-300" />
            StroyGetter doesn&apos;t host video content. We&apos;re a converter, not a library.
          </div>
        </aside>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
