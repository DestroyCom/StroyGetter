# TikTok Downloader — Design Spec

**Date:** 2026-05-27  
**Branch:** `feat/tiktok-downlaoder`  
**Status:** Approved

---

## Overview

Add TikTok video downloading to StroyGetter alongside existing YouTube support. The feature reuses the existing yt-dlp binary (which natively supports TikTok), adapts the current UI components to be source-aware, and introduces dedicated SEO landing pages for `/tiktok` and `/youtube` while updating the home `/` to cover both platforms.

Blog article and i18n translations are deferred to a second pass after functional validation.

---

## Scope

**In scope:**
- TikTok URL validation and source detection
- TikTok metadata fetching via yt-dlp `--dump-json`
- 3 fixed TikTok download formats: video with watermark, video without watermark, audio MP3
- New API routes: `/api/download/tiktok-video` and `/api/download/tiktok-audio`
- Source-aware `VideoSelect` component (YouTube tabs vs TikTok tabs)
- Source-aware `resolveVideoUrl` server action (replaces `searchQuery` / `getYoutubeUrl`)
- New pages: `/[locale]/tiktok/page.tsx`, `/[locale]/youtube/page.tsx`
- Updated `/[locale]/page.tsx` home wording for YouTube + TikTok
- i18n: new translation keys for all new wording (all 4 locales: en, fr-FR, es-419, pt-BR)
- Unit + integration tests

**Out of scope (deferred):**
- Blog article about TikTok downloading
- TikTok "Library Ready" equivalent (YouTube-exclusive feature)
- TikTok search by keyword (no equivalent to YouTube innertube search)
- Resolution picker for TikTok (yt-dlp selects best automatically)

---

## Architecture

### Source detection

**`lib/serverUtils.ts`** — two new exported functions:

```ts
// Validates a TikTok video URL. Supports:
//   https://www.tiktok.com/@user/video/ID
//   https://tiktok.com/@user/video/ID
//   https://vm.tiktok.com/SHORTCODE/
export function tiktok_validate(url: string): "video" | false

// Determines platform from URL. Returns null for unrecognised URLs.
export function detectSource(url: string): "youtube" | "tiktok" | null
```

`detectSource` calls `yt_validate` and `tiktok_validate` internally — no new regex duplication.

### URL resolution

**`functions/resolveVideoUrl.ts`** replaces `functions/getYoutubeUrl.ts`:

```ts
"use server";
export const resolveVideoUrl = async (query: string): Promise<string>
```

Behaviour:
- If `detectSource(query) === "youtube"` → return as-is (valid YouTube URL)
- If `detectSource(query) === "tiktok"` → return as-is (valid TikTok URL)
- Otherwise → treat as YouTube search query via innertube (existing behaviour)
- If innertube search finds nothing → throw `"No video found"`

`GetterInput.tsx` imports `resolveVideoUrl` instead of `searchQuery`. No visual change.

### TikTok format sentinels

**`lib/types.ts`** — new export:

```ts
export const TIKTOK_ITAG = {
  WATERMARK:    301,
  NO_WATERMARK: 302,
  AUDIO:        303,
} as const;
```

These sentinel numbers are internal only and never passed to yt-dlp directly.  
`FormatData.itag` type remains `number` — no interface change.

### Metadata fetching

**`functions/fetchVideoinfos.ts`** — `getVideoInfos` becomes source-aware:

```ts
export const getVideoInfos = async (url: string) => {
  const source = detectSource(url);
  if (source === "tiktok") return getTikTokInfos(url);
  return getYoutubeInfos(url); // existing logic, extracted into helper
};
```

**`getTikTokInfos(url)`** (internal helper, same file or `functions/fetchTiktokInfos.ts`):
- Calls yt-dlp with `--dump-json --no-playlist`
- Extracts: `title`, `uploader` (→ `author`), `duration`, `thumbnail`
- Returns fixed format list using `TIKTOK_ITAG` sentinels:

```ts
[
  { itag: TIKTOK_ITAG.WATERMARK,    qualityLabel: "Video (with watermark)" },
  { itag: TIKTOK_ITAG.NO_WATERMARK, qualityLabel: "Video (no watermark)"   },
  { itag: TIKTOK_ITAG.AUDIO,        qualityLabel: "Audio only (MP3)"       },
]
```

- DB upsert: same pattern as YouTube (non-fatal if fails)
- Error handling: wraps yt-dlp errors, returns `{ error: string }`

> **Note from live test:** yt-dlp `--dump-json` on `@honor_france/video/7568900679792708896` returns `title`, `uploader`, `duration` (int, seconds), `thumbnail` (URL). All fields confirmed present.

### yt-dlp format selectors (confirmed by live test)

| TikTok format | yt-dlp selector | Notes |
|---|---|---|
| With watermark | `download` | Fixed format_id, h264+aac, no resolution metadata |
| Without watermark | `best[format_id!=download]` | yt-dlp picks best — 1080p h265 on test video |
| Audio only | `best[format_id!=download]` + FFmpeg audio extract | No separate audio-only stream on TikTok |

### New API routes

#### `/api/download/tiktok-video/route.ts`

- Query params: `url` (string), `quality` (`"301"` or `"302"`)
- Validates `tiktok_validate(url)`; returns 400 on failure
- Maps quality param to yt-dlp format selector via `TIKTOK_ITAG`
- Downloads to `temp/source/` via `youtube-dl-exec`
- Streams file directly (no FFmpeg merge needed — TikTok formats are muxed)
- Caches in `temp/cached/` + DB record (same `File` model, `url+quality` key)
- Content-Disposition: `attachment; filename="<sanitized_title>.mp4"`

#### `/api/download/tiktok-audio/route.ts`

- Query param: `url` (string)
- Downloads best non-watermark format to `temp/source/`
- FFmpeg extracts audio → MP3 (same pattern as `/api/download/audio`)
- No ID3 tagging, no cover art (Library Ready is YouTube-only)
- Content-Disposition: `attachment; filename="<sanitized_title>.mp3"`

### VideoSelect — source-aware tabs

`VideoSelect.tsx` receives a `source: "youtube" | "tiktok"` prop passed from the `/fetch` page.

**YouTube tabs (existing):** Library Ready · MP4 · MP3  
**TikTok tabs (new):** Video (watermark) · Video (no watermark) · Audio

TikTok tabs never show a resolution dropdown (formats are fixed).  
TikTok tabs call `/api/download/tiktok-video?url=...&quality=301|302` or `/api/download/tiktok-audio?url=...`.

The "Library Ready" callout block is hidden when `source === "tiktok"`.

### `/fetch` page — source detection

`/[locale]/fetch/page.tsx` reads `videoUrl` from search params, calls `detectSource(videoUrl)`, and passes `source` as a prop to `VideoSelect`. No other changes to the page.

---

## New pages

### `/[locale]/tiktok/page.tsx`

Dedicated TikTok landing page. Same structure as home (hero → how it works → formats → FAQ). Key differences:
- Title/desc: "Download TikTok videos — free, no watermark, no signup"
- `GetterInput` unchanged (auto-detection handles routing)
- Formats section: 3 cards — Video with watermark / Video without watermark / Audio MP3
- No Library Ready section
- FAQ: TikTok-specific questions (watermark removal, supported URLs, etc.)
- SEO meta: targeted "TikTok downloader" keywords
- No `noindex` — this page should be indexed

### `/[locale]/youtube/page.tsx`

Dedicated YouTube landing page. Functionally identical to current home content:
- Library Ready featured
- MP4 and MP3 formats
- Full FAQ and glossary
- Title/desc explicitly mentions YouTube
- No TikTok content

### `/[locale]/page.tsx` (updated home)

Updated wording to reflect dual-platform support:
- Hero title: "Download YouTube & TikTok videos…"
- Hero badges: replace "YouTube only" badge with "YouTube & TikTok"
- Hero desc: mention both platforms; keep Library Ready highlighted as YouTube-exclusive
- Formats section: 4 cards — Library Ready (⭐ YouTube), MP4 (YouTube), TikTok No Watermark, Audio MP3 (both)
- FAQ: add 2–3 TikTok questions alongside existing YouTube ones
- Library Ready section label: "YouTube exclusive" badge to clarify scope

---

## i18n

New translation keys added to all 4 locale files (`en.json`, `fr-FR.json`, `es-419.json`, `pt-BR.json`):

| Namespace | New keys |
|---|---|
| `home` | Hero title/desc/badges updated; new FAQ items; TikTok format card |
| `tiktok` | Full page: hero, how-it-works, formats, FAQ (new namespace) |
| `youtube` | Full page: same as current `home` namespace content (new namespace) |
| `videoSelect` | `formatWatermark`, `formatNoWatermark`, `formatWatermarkSub`, `formatNoWatermarkSub` |
| `meta` | `tiktokTitle`, `tiktokDesc`, `youtubeTitle`, `youtubeDesc` |

Sitemap and hreflang alternates for `/tiktok` and `/youtube` are auto-generated by the existing `buildAlternates()` + `sitemap.ts` pattern — no manual changes needed.

---

## Tests

### Unit — `__tests__/lib/serverUtils.test.ts` (extend existing)

```
tiktok_validate
  ✓ accepts https://www.tiktok.com/@user/video/7568900679792708896
  ✓ accepts https://tiktok.com/@user/video/123
  ✓ accepts https://vm.tiktok.com/SHORTCODE/
  ✓ rejects YouTube URLs
  ✓ rejects bare domains
  ✓ rejects http (no https)

detectSource
  ✓ returns "youtube" for youtube.com URLs
  ✓ returns "youtube" for youtu.be URLs
  ✓ returns "tiktok" for tiktok.com URLs
  ✓ returns "tiktok" for vm.tiktok.com URLs
  ✓ returns null for unknown URLs
  ✓ returns null for plain text
```

### Unit — `__tests__/lib/ytdlp-info.test.ts` (new)

```
getTikTokFormats (pure — no network, just verifies static output)
  ✓ returns exactly 3 formats
  ✓ itags match TIKTOK_ITAG constants (301, 302, 303)
  ✓ qualityLabel strings are non-empty
```

### Integration — `__tests__/integration/tiktok-fetch.test.ts` (new)

Uses live URL `https://www.tiktok.com/@honor_france/video/7568900679792708896`.

```
getVideoInfos (TikTok)
  ✓ returns video_details with title, author, duration, thumbnail
  ✓ returns exactly 3 formats with itags 301, 302, 303
  ✓ title matches expected (partial match on "antenne")
```

Tagged with `@integration` / skippable in CI without network.

---

## Data flow summary

```
User pastes URL (any page)
  → resolveVideoUrl(query)
      → detectSource → "youtube" | "tiktok" | null (→ innertube search)
      → returns resolved URL
  → router.push("/fetch?videoUrl=<url>")

/fetch page
  → detectSource(videoUrl) → source
  → <VideoSelect source={source} />

VideoSelect
  if youtube → [Library Ready | MP4 | MP3] tabs
  if tiktok  → [Watermark | No Watermark | Audio] tabs
  → getVideoInfos(url)
      if tiktok → yt-dlp --dump-json → metadata + 3 fixed formats
      if youtube → innertube + yt-dlp (existing)
  → user picks format → handleDownload()
      if tiktok video → GET /api/download/tiktok-video?url=...&quality=301|302
      if tiktok audio → GET /api/download/tiktok-audio?url=...
      if youtube      → existing routes
```

---

## Open questions / risks

1. **h265 compatibility:** The best TikTok no-watermark format (`bytevc1_1080p`) uses h265, which is not supported in all browsers/players. Consider forcing h264 selector: `best[vcodec^=h264][format_id!=download]`. To be validated during implementation.

2. **vm.tiktok.com short URLs:** These are redirects. yt-dlp follows them fine; `tiktok_validate` needs to accept them without resolving the redirect at validation time.

3. **TikTok rate limiting:** yt-dlp warns about "impersonation" (see live test output). Downloads may fail for some videos without cookies. Same `COOKIES_PATH` env var mechanism applies.

4. **Caching key:** TikTok URLs include `@username` — they're stable. The `url+quality` cache key works as-is.
