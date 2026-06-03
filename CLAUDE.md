# StroyGetter (Next.js 16, pnpm)

Next.js 16 video downloader (YouTube + TikTok). Downloads streams via yt-dlp, merges audio+video with FFmpeg, caches results in SQLite.

## Reference Docs

| Document                                  | Quand l'utiliser                       |
| ----------------------------------------- | -------------------------------------- |
| [Architecture](docs/architecture.md)      | Structure des fichiers et dossiers     |
| [Environment Variables](docs/env-vars.md) | Configuration docker-compose / runtime |
| [i18n Guide](docs/i18n-guide.md)          | Ajouter une nouvelle locale            |
| [Deployment](docs/deployment.md)          | Release pipeline, Docker, CI           |

## Commands

```bash
pnpm dev             # Development server
pnpm build           # Production build (also runs copy-binaries.js postbuild)
pnpm start           # Start production server
pnpm format          # Biome format (write)
pnpm lint            # Biome lint
pnpm knip            # Dead code detection
pnpm db:deploy       # Run Prisma migrations + generate client
pnpm test            # Run all tests (vitest)
pnpm test:unit       # Unit tests only (lib/)
pnpm test:watch      # Watch mode
```

## Key Patterns

**Three binaries**: `youtubei.js` (via `lib/innertube.ts`) is used for YouTube metadata + format list. `youtube-dl-exec` (yt-dlp binary, `selectYtDlpPath()`) handles YouTube/TikTok video downloads. `gallery-dl` (`lib/gallery-dl-binary.ts`) handles TikTok photo slideshows. Versions pinned in `.ytdlp-version` and `.gallery-dl-version`.

**TikTok post type detection**: `lib/tiktok-detect.ts` → `detectTiktokType(url)`. Uses URL pattern matching for `/video/` or `/photo/` paths; HTTP HEAD redirect follow for short URLs (`vm.tiktok.com`, `tiktok.com/t/`). Photo posts → `functions/fetchTiktokPhotoInfos.ts` (gallery-dl). Video posts → `functions/fetchTiktokInfos.ts` (yt-dlp).

**TikTok photo download**: Images not cached on disk. `/api/download/tiktok-image` is a stream-through proxy fetching from TikTok CDN at click time. CDN URLs expire ~48h — no caching needed for typical sessions.

**Temp directory structure**: Dev uses `./temp/{source,cached}`, production uses `/temp/stroygetter/{source,cached}`. Created automatically on first request via `initializeConf()`.

**File caching**: Merged MP4s are stored in `temp/cached/` and indexed in the `File` table by URL+quality. Repeat requests for the same URL+quality are served from cache without re-downloading.

**Audio path**: `quality=audio` streams directly (ffmpeg → PassThrough → Response). Thumbnail fetched to a temp file for album art embedding, deleted after ffmpeg closes.

## Prisma 7 Notes

**Singleton required**: Always use `import { prisma } from "@/lib/prisma"` — never `new PrismaClient()`. Prisma 7 requires a `PrismaLibSql` driver adapter; bare `new PrismaClient()` throws at runtime.

**No `$disconnect()` on singleton**: Calling `prisma.$disconnect()` on the shared instance breaks subsequent requests/cron runs.

**Security hook on Write tool**: Files containing ytdl `.exec` calls trigger a Write-tool block. Use the Edit tool for surgical changes to `route.ts` and similar files.
