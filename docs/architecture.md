## Architecture

```text
app/
  [locale]/
    page.tsx          # Home — URL input
    fetch/page.tsx    # Quality selection after URL submitted
    tiktok/page.tsx   # TikTok downloader page
    youtube/page.tsx  # YouTube-specific landing
    legal/            # DMCA, privacy, ToS pages
    updates/page.tsx  # Changelog
  api/video-converter/route.ts  # GET endpoint: streams download/merge/serve
components/custom/    # GetterInput, VideoSelect, VideoLoading, etc.
functions/            # Server actions: fetchVideoinfos, fetchTiktokInfos, getYoutubeUrl, resolveVideoUrl
lib/
  serverUtils.ts      # initializeConf, selectYtDlpPath, sanitizeFilename, yt_validate
  video-download.ts   # Core download orchestration
  route-utils.ts      # Shared route helpers (streaming, headers)
  rate-limiter.ts     # Per-IP rate limiting
  ytdlp-binary.ts     # yt-dlp binary selection
  ytdlp-cookies.ts    # Cookie file injection
  server-conf.ts      # Runtime config (env var parsing)
  types.ts
scripts/cleanup.ts    # Cron job: deletes old cached files + DB records
prisma/schema.prisma  # SQLite: Video (url unique) → File (hash unique)
```
