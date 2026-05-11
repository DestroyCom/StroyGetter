import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookies & analytics",
  description: "StroyGetter cookies and analytics disclosure.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="mb-45">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stroy-300">
        Last updated · 7 May 2026
      </p>
      <h1 className="mb-8 text-4xl font-bold tracking-tight md:text-[44px]">Cookies & analytics</h1>

      <div className="space-y-8 text-sm leading-[1.75] text-white/82">
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">01</span>
            First-party cookies
          </h2>
          <p>
            StroyGetter sets no first-party cookies. We have no login, no session, no preferences
            stored in your browser.
          </p>
        </div>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">02</span>Google Analytics 4
          </h2>
          <p>
            We use Google Analytics 4 to count page visits and understand which features are used
            most. GA4 may set a{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono">_ga</code> measurement
            cookie in your browser. This cookie identifies a session anonymously — it contains no
            personal data.
          </p>
        </div>
        <div>
          <h2 className="mb-3 flex items-baseline gap-3 text-xl font-bold tracking-tight">
            <span className="font-mono text-sm text-stroy-300">03</span>Opting out
          </h2>
          <p>
            You can prevent the GA4 cookie by installing the{" "}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              className="text-stroy-200 underline underline-offset-3 hover:text-white"
              target="_blank"
              rel="noreferrer noopener"
            >
              Google Analytics opt-out browser add-on
            </a>
            , or by using any browser-level content blocker (uBlock Origin, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}
