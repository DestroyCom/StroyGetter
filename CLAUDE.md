# StroyGetter (Next.js 16, pnpm)

Next.js 16 YouTube video downloader. Downloads streams via yt-dlp, merges audio+video with FFmpeg, caches results in SQLite.

## Commands

```bash
pnpm dev             # Development server
pnpm build           # Production build (also runs copy-binaries.js postbuild)
pnpm start           # Start production server
pnpm lint            # Biome lint
pnpm knip            # Dead code detection
pnpm db:deploy       # Run Prisma migrations + generate client
```

## Architecture

```
app/
  page.tsx            # Home — URL input
  fetch/page.tsx      # Quality selection after URL submitted
  api/video-converter/route.ts  # GET endpoint: streams download/merge/serve
components/custom/    # GetterInput, VideoSelect, VideoLoading, etc.
functions/            # Server actions (fetchVideoinfos, getYoutubeUrl)
lib/
  serverUtils.ts      # initializeConf, selectYtDlpPath, sanitizeFilename, yt_validate
  types.ts
scripts/cleanup.ts    # Cron job: deletes old cached files + DB records
prisma/schema.prisma  # SQLite: Video (url unique) → File (hash unique)
```

## Environment Variables

All vars are **server-only runtime** — no `NEXT_PUBLIC_*`. Configure in docker-compose; never rebuild the image to change these.

```
DATABASE_URL=file:./database/dev.db   # SQLite path (required)
CLEANUP_INTERVAL=7                    # Days before file expiry (default: 7 prod, 1 dev)
CRON=0 0 * * *                        # Cleanup schedule (default: daily prod, every min dev)
MAX_FILESIZE=8G                       # Max size per yt-dlp stream (default: 8G). Passed as --max-filesize to yt-dlp.
SITE_URL=https://stroygetter.fr       # Canonical base URL — sitemap, robots.txt, OpenGraph, JSON-LD (default: stroygetter.fr)
GOOGLE_SITE_VERIFICATION=<token>      # Google Search Console verification token
YANDEX_SITE_VERIFICATION=<token>      # Yandex Webmaster verification token
BING_SITE_VERIFICATION=<token>        # Bing Webmaster token (msvalidate.01)
EMAIL_DMCA=dmca@...                   # DMCA contact email shown in legal pages
EMAIL_PRIVACY=privacy@...            # Privacy contact email shown in legal pages
```

## Key Patterns

**Two ytdl libraries**: `youtubei.js` (via `lib/innertube.ts`) is used for metadata + format list via `getBasicInfo()`. Actual stream downloading uses `youtube-dl-exec` (yt-dlp binary) via `selectYtDlpPath()`. Format parsing is in `lib/ytdlp-info.ts`.

**Temp directory structure**: Dev uses `./temp/{source,cached}`, production uses `/temp/stroygetter/{source,cached}`. Created automatically on first request via `initializeConf()`.

**File caching**: Merged MP4s are stored in `temp/cached/` and indexed in the `File` table by URL+quality. Repeat requests for the same URL+quality are served from cache without re-downloading.

**Audio path**: `quality=audio` streams directly (ffmpeg → PassThrough → Response). Thumbnail fetched to a temp file for album art embedding, deleted after ffmpeg closes.

## i18n — Adding a new locale or language variant

Active locales (BCP 47): `en`, `fr-FR`, `es-419`, `pt-BR`.

**To add a new locale** (e.g. `fr-CA`, `pt-PT`, `es-MX`):

1. Add the locale code to `locales` in `i18n/routing.ts`
2. Create `messages/<locale>.json` — copy the closest existing locale as a base
3. Add a display label in `components/custom/LocaleSwitcher.tsx` (`LOCALE_LABELS`)
4. Translate `messages/<locale>.json`

Everything else (sitemap, hreflang alternates, static params) auto-updates via `buildAlternates()` in `i18n/metadata.ts` and `routing.locales`.

**Locale code conventions used here:**

- Generic English: `en` (covers all regions — do NOT use `en-US`)
- French France: `fr-FR`
- Latin American Spanish: `es-419` (UN M.49 region code, Google-supported)
- Brazilian Portuguese: `pt-BR`

## Prisma 7 Notes

**Singleton required**: Always use `import { prisma } from "@/lib/prisma"` — never `new PrismaClient()`. Prisma 7 requires a `PrismaLibSql` driver adapter; bare `new PrismaClient()` throws at runtime.

**No `$disconnect()` on singleton**: Calling `prisma.$disconnect()` on the shared instance breaks subsequent requests/cron runs.

**Security hook on Write tool**: Files containing ytdl `.exec` calls trigger a Write-tool block. Use the Edit tool for surgical changes to `route.ts` and similar files.

## Deployment

**Docker**: `docker-compose up -d` (uses `Dockerfile`, mounts SQLite + temp via volume).

**Live URL**: `https://stroygetter.fr` (configured via `SITE_URL` env var at runtime).

**Release pipeline**: Push to the `prod` branch (not `master`) triggers CI: creates git tag from commit message → builds Docker image → publishes GitHub release.

**CI secret**: The `.env` file is injected from the `ENVFILE` GitHub secret during image builds. Never committed.

**Binary copy**: `copy-binaries.js` runs postbuild to copy the yt-dlp binary into `.next/standalone/`. This is required for the standalone output to work.
