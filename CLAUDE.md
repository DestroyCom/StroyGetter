# StroyGetter

Next.js 14 YouTube video downloader. Downloads streams via yt-dlp, merges audio+video with FFmpeg, caches results in SQLite.

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build (also runs copy-binaries.js postbuild)
npm run start        # Start production server
npm run lint         # ESLint
npm run knip         # Dead code detection
npm run db:deploy    # Run Prisma migrations + generate client
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

```
DATABASE_URL=file:./database/dev.db   # SQLite path (required)
CLEANUP_INTERVAL=7                    # Days before file expiry (default: 7 prod, 1 dev)
CRON=0 0 * * *                        # Cleanup schedule (default: daily prod, every min dev)
```

## Key Patterns

**Two ytdl libraries**: `@distube/ytdl-core` is used only for `getBasicInfo()` (fetching video metadata + format list). Actual stream downloading uses `youtube-dl-exec` (yt-dlp binary) via `selectYtDlpPath()`.

**Temp directory structure**: Dev uses `./temp/{source,cached}`, production uses `/temp/stroygetter/{source,cached}`. Created automatically on first request via `initializeConf()`.

**File caching**: Merged MP4s are stored in `temp/cached/` and indexed in the `File` table by hash. Repeat requests for the same URL+quality are served from cache without re-downloading.

**GPU acceleration**: On startup, detects NVIDIA GPU via `nvidia-smi` + checks `ffmpeg -hwaccels` for CUDA/NVENC. Uses `h264_nvenc` if available, otherwise `libx264 -preset ultrafast`.

**Audio path**: `quality=audio` streams directly (ffmpeg → PassThrough → Response). No temp file written.

## Deployment

**Docker**: `docker-compose up -d` (uses `Dockerfile`, mounts SQLite + temp via volume).

**Release pipeline**: Push to the `prod` branch (not `master`) triggers CI: creates git tag from commit message → builds Docker image → publishes GitHub release.

**CI secret**: The `.env` file is injected from the `ENVFILE` GitHub secret during image builds. Never committed.

**Binary copy**: `copy-binaries.js` runs postbuild to copy the yt-dlp binary into `.next/standalone/`. This is required for the standalone output to work.
