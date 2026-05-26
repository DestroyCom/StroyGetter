import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  /**
   * Packages that must NOT be bundled by Turbopack/webpack — kept external so
   * Node resolves them from node_modules at runtime.
   *
   * Next.js 16.1+ (PR #86884) already adds pino, pino-pretty, pino-roll and
   * thread-stream to the built-in default list. We declare them explicitly for
   * clarity and add the ones that were missed:
   *
   *   • pino-abstract-transport — required by pino/lib/worker.js inside its
   *     worker thread; NOT in the built-in list, NOT traceable statically by
   *     Turbopack → must be declared explicitly so nft copies the actual files.
   *
   * See: https://github.com/vercel/next.js/issues/86099
   *      https://github.com/vercel/next.js/issues/84766
   */
  serverExternalPackages: [
    "sharp",
    "ffmpeg-static",
    "prisma",
    "youtube-dl-exec",
    // pino runtime — worker threads need these at runtime, not bundled
    "pino",
    "pino-pretty",
    "pino-roll",
    "pino-abstract-transport",
    "thread-stream",
  ],
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=600, stale-while-revalidate=60",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
