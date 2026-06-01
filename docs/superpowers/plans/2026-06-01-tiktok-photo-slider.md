# TikTok Photo Slider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support TikTok photo/slideshow posts by detecting the post type, fetching images via gallery-dl, and rendering an Embla carousel with per-photo download buttons.

**Architecture:** `detectTiktokType()` uses URL pattern matching + HTTP HEAD redirect follow for short URLs to determine photo vs. video without calling gallery-dl unnecessarily. Photo posts go through a new `fetchTiktokPhotoInfos` path (gallery-dl `--dump-json`), and images are served via a lightweight stream-through proxy (no caching). `VideoSelect` gains a `photoData` branch that renders `TikTokPhotoSlider` in-place.

**Tech Stack:** gallery-dl (Python binary, pinned in `.gallery-dl-version`), embla-carousel-react, Next.js server actions, Node.js `child_process.spawn`

---

## File Map

**Create:**
- `.gallery-dl-version` — pinned gallery-dl version string
- `lib/gallery-dl-binary.ts` — binary path resolution (same pattern as `lib/ytdlp-binary.ts`)
- `lib/tiktok-detect.ts` — `detectTiktokType(url)` → `"video" | "photo"`
- `functions/fetchTiktokPhotoInfos.ts` — server action calling gallery-dl, returns `TikTokPhotoData`
- `app/api/download/tiktok-image/route.ts` — stream-through proxy for CDN image download
- `components/custom/TikTokPhotoSlider.tsx` — Embla carousel UI

**Modify:**
- `copy-binaries.js` — add gallery-dl copy step (local standalone)
- `Dockerfile` — install + place gallery-dl binary
- `lib/types.ts` — add `TikTokPhotoData`, `TikTokPhotoImage`
- `functions/fetchTiktokInfos.ts` — branch photo/video via `detectTiktokType`
- `components/custom/VideoSelect.tsx` — handle `TikTokPhotoData` response
- `messages/en.json`, `messages/fr-FR.json`, `messages/es-419.json`, `messages/pt-BR.json` — add `tiktokPhoto` namespace
- `__tests__/lib/serverUtils.test.ts` — already updated in prior fix session
- `__tests__/lib/tiktok-detect.test.ts` — new unit tests

---

## Task 1: gallery-dl version file + binary resolver

**Files:**
- Create: `.gallery-dl-version`
- Create: `lib/gallery-dl-binary.ts`

- [ ] **Step 1: Create `.gallery-dl-version`**

```
1.32.1
```

- [ ] **Step 2: Create `lib/gallery-dl-binary.ts`**

```typescript
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

let _bin: string | null = null;

export function getGalleryDlBinaryPath(): string {
  if (_bin) return _bin;

  const candidates = [path.join(process.cwd(), ".next/server/bin/gallery-dl")];
  _bin = candidates.find((p) => fs.existsSync(p)) ?? null;

  if (!_bin) {
    // Dev fallback: resolve from PATH
    try {
      const which = execSync("which gallery-dl", { stdio: ["pipe", "pipe", "pipe"] })
        .toString()
        .trim();
      if (which && fs.existsSync(which)) _bin = which;
    } catch {}
  }

  if (!_bin)
    throw new Error("gallery-dl not found. Run: pip3 install gallery-dl==1.32.1");
  return _bin;
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
pnpm exec tsc --noEmit 2>&1 | grep gallery-dl
```

Expected: no output (no errors for new file).

- [ ] **Step 4: Commit**

```bash
git add .gallery-dl-version lib/gallery-dl-binary.ts
git commit -m "feat(tiktok-photos): add gallery-dl version pin and binary resolver"
```

---

## Task 2: Update `copy-binaries.js` for local standalone

**Files:**
- Modify: `copy-binaries.js`

- [ ] **Step 1: Read current `copy-binaries.js`** (already done — it copies yt-dlp from `node_modules/youtube-dl-exec/bin/yt-dlp` to `.next/server/bin/yt-dlp`)

- [ ] **Step 2: Add gallery-dl copy step**

Replace the full content of `copy-binaries.js` with:

```javascript
/**
 * copy-binaries.js — postbuild hook for LOCAL standalone usage only.
 *
 * Copies yt-dlp and gallery-dl into .next/server/bin/ so that `pnpm start`
 * can find them via their respective binary resolver modules.
 *
 * NOT needed by Docker: both binaries are installed via pip3 in the runner stage.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const binDir = path.resolve("./.next/server/bin");
fs.mkdirSync(binDir, { recursive: true });

// ── yt-dlp ──────────────────────────────────────────────────────────────────
const ytdlpSrc = path.resolve("./node_modules/youtube-dl-exec/bin/yt-dlp");
const ytdlpDest = path.join(binDir, "yt-dlp");
fs.copyFileSync(ytdlpSrc, ytdlpDest);
console.log(`Copied yt-dlp → ${ytdlpDest}`);

// ── gallery-dl ───────────────────────────────────────────────────────────────
let galleryDlSrc;
try {
  galleryDlSrc = execSync("which gallery-dl", { stdio: ["pipe", "pipe", "pipe"] })
    .toString()
    .trim();
} catch {
  console.warn("gallery-dl not found in PATH — skipping copy. Run: pip3 install gallery-dl");
  process.exit(0);
}
const galleryDlDest = path.join(binDir, "gallery-dl");
fs.copyFileSync(galleryDlSrc, galleryDlDest);
console.log(`Copied gallery-dl → ${galleryDlDest}`);
```

- [ ] **Step 3: Verify postbuild works**

```bash
pnpm build 2>&1 | tail -5
ls .next/server/bin/
```

Expected: `gallery-dl  yt-dlp` listed.

- [ ] **Step 4: Commit**

```bash
git add copy-binaries.js
git commit -m "feat(tiktok-photos): copy gallery-dl binary in postbuild hook"
```

---

## Task 3: Update Dockerfile for gallery-dl

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Add `.gallery-dl-version` to the deps COPY and runner install**

In the `deps` stage, add `.gallery-dl-version` to the COPY line (it's already there for `.ytdlp-version`, extend it):

```dockerfile
# ── deps stage: add .gallery-dl-version ─────────────────────────────────────
COPY package.json pnpm-lock.yaml .ytdlp-version .gallery-dl-version ./
```

In the runner stage, after the existing yt-dlp install block, add:

```dockerfile
# ── gallery-dl ───────────────────────────────────────────────────────────────
COPY .gallery-dl-version .gallery-dl-version
RUN GALLERY_DL_VERSION=$(cat .gallery-dl-version) && \
    pip3 install --no-cache-dir --break-system-packages "gallery-dl==${GALLERY_DL_VERSION}" && \
    mkdir -p .next/server/bin && \
    cp "$(which gallery-dl)" .next/server/bin/gallery-dl && \
    chown nextjs:nodejs .next/server/bin/gallery-dl && \
    chmod +x .next/server/bin/gallery-dl && \
    echo "gallery-dl ready: $(gallery-dl --version)" && \
    rm .gallery-dl-version
```

- [ ] **Step 2: Verify Dockerfile syntax (lint)**

```bash
docker build --dry-run . 2>&1 | head -10
```

Expected: no syntax errors. (Skip if Docker not available locally.)

- [ ] **Step 3: Commit**

```bash
git add Dockerfile .gallery-dl-version
git commit -m "feat(tiktok-photos): install gallery-dl in Docker runner stage"
```

---

## Task 4: Add `TikTokPhotoData` types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Add types at the end of `lib/types.ts`**

```typescript
export interface TikTokPhotoImage {
  url: string;
  width: number;
  height: number;
}

export interface TikTokPhotoData {
  type: "photo";
  images: TikTokPhotoImage[];
  video_details: {
    title: string;
    author: string;
    thumbnail: string;
  };
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(tiktok-photos): add TikTokPhotoData and TikTokPhotoImage types"
```

---

## Task 5: Add `lib/tiktok-detect.ts`

**Files:**
- Create: `lib/tiktok-detect.ts`
- Create: `__tests__/lib/tiktok-detect.test.ts`

- [ ] **Step 1: Write the failing tests first**

Create `__tests__/lib/tiktok-detect.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { detectTiktokType } from "@/lib/tiktok-detect";

// Mock global fetch for short URL tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("detectTiktokType", () => {
  it("returns 'photo' for explicit /photo/ URL", async () => {
    const result = await detectTiktokType(
      "https://www.tiktok.com/@user/photo/7646118320072330518"
    );
    expect(result).toBe("photo");
  });

  it("returns 'video' for explicit /video/ URL", async () => {
    const result = await detectTiktokType(
      "https://www.tiktok.com/@user/video/7642004084970540321"
    );
    expect(result).toBe("video");
  });

  it("returns 'photo' for short URL that resolves to /photo/", async () => {
    mockFetch.mockResolvedValueOnce({
      url: "https://www.tiktok.com/@user/photo/7646118320072330518?params=abc",
    });
    const result = await detectTiktokType("https://vm.tiktok.com/ZN92BN73vPy4j-1KTiG/");
    expect(result).toBe("photo");
    expect(mockFetch).toHaveBeenCalledWith("https://vm.tiktok.com/ZN92BN73vPy4j-1KTiG/", {
      method: "HEAD",
      redirect: "follow",
      signal: expect.any(AbortSignal),
    });
  });

  it("returns 'video' for short URL that resolves to /video/", async () => {
    mockFetch.mockResolvedValueOnce({
      url: "https://www.tiktok.com/@user/video/7642004084970540321",
    });
    const result = await detectTiktokType("https://vm.tiktok.com/ZMkABCDEF/");
    expect(result).toBe("video");
  });

  it("returns 'video' as fallback when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await detectTiktokType("https://vm.tiktok.com/ZMkABCDEF/");
    expect(result).toBe("video");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test __tests__/lib/tiktok-detect.test.ts 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module '@/lib/tiktok-detect'`.

- [ ] **Step 3: Create `lib/tiktok-detect.ts`**

```typescript
export async function detectTiktokType(url: string): Promise<"video" | "photo"> {
  if (url.includes("/video/")) return "video";
  if (url.includes("/photo/")) return "photo";

  // Short URL (vm.tiktok.com, tiktok.com/t/) — follow HTTP redirect
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (res.url.includes("/photo/")) return "photo";
  } catch {
    // Network failure or timeout → assume video (safe default)
  }

  return "video";
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test __tests__/lib/tiktok-detect.test.ts 2>&1 | tail -10
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/tiktok-detect.ts __tests__/lib/tiktok-detect.test.ts
git commit -m "feat(tiktok-photos): add detectTiktokType with photo/video short-URL resolution"
```

---

## Task 6: Add `functions/fetchTiktokPhotoInfos.ts`

**Files:**
- Create: `functions/fetchTiktokPhotoInfos.ts`

- [ ] **Step 1: Create the server action**

```typescript
"use server";

import { spawn } from "node:child_process";
import { logger } from "@/lib/logger";
import { getGalleryDlBinaryPath } from "@/lib/gallery-dl-binary";
import type { TikTokPhotoData } from "@/lib/types";

const log = logger.child({ module: "fetch-tiktok-photo-infos" });

type GalleryDlItem = [number, unknown];

function runGalleryDlDumpJson(url: string): Promise<GalleryDlItem[]> {
  return new Promise((resolve, reject) => {
    const bin = getGalleryDlBinaryPath();
    const proc = spawn(bin, ["--dump-json", "--no-part", url]);

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    if (proc.stdout) proc.stdout.on("data", (d: Buffer) => stdoutChunks.push(d));
    if (proc.stderr) proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("gallery-dl timed out after 30s"));
    }, 30_000);

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timeout);
      const stdout = Buffer.concat(stdoutChunks).toString().trim();
      if (!stdout) {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        reject(new Error(stderr || "No output from gallery-dl"));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as GalleryDlItem[]);
      } catch {
        reject(new Error("Failed to parse gallery-dl JSON output"));
      }
    });
  });
}

export async function getTikTokPhotoInfos(url: string): Promise<TikTokPhotoData | { error: string }> {
  log.info({ url }, "Fetching TikTok photo post via gallery-dl");
  const startTime = Date.now();

  let items: GalleryDlItem[];
  try {
    items = await runGalleryDlDumpJson(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gallery-dl failed";
    log.error({ url, err, durationMs: Date.now() - startTime }, `gallery-dl error: ${msg}`);
    return { error: msg };
  }

  // Find the first type-2 item that has imagePost data (the full post metadata)
  const postEntry = items.find(
    (item): item is [2, Record<string, unknown>] =>
      Array.isArray(item) &&
      item[0] === 2 &&
      typeof item[1] === "object" &&
      item[1] !== null &&
      "imagePost" in item[1]
  );

  if (!postEntry) {
    log.warn({ url, itemCount: items.length }, "No photo post found in gallery-dl output");
    return { error: "No photo post data found" };
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw TikTok API shape
  const data = postEntry[1] as any;

  const images = (data.imagePost.images as unknown[]).map((img: unknown, i: number) => {
    // biome-ignore lint/suspicious/noExplicitAny: raw TikTok API shape
    const image = img as any;
    return {
      url: image.imageURL.urlList[0] as string,
      width: image.imageWidth as number,
      height: image.imageHeight as number,
    };
  });

  const thumbnail: string =
    data.imagePost?.cover?.imageURL?.urlList?.[0] ?? images[0]?.url ?? "";

  log.info(
    { url, imageCount: images.length, durationMs: Date.now() - startTime },
    "TikTok photo post fetched successfully"
  );

  return {
    type: "photo",
    images,
    video_details: {
      title: (data.desc as string | undefined) ?? "",
      author:
        (data.author?.nickname as string | undefined) ??
        (data.author?.uniqueId as string | undefined) ??
        "",
      thumbnail,
    },
  };
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Smoke test against a real URL (requires gallery-dl installed)**

```bash
node -e "
const { getTikTokPhotoInfos } = require('./functions/fetchTiktokPhotoInfos.ts');
" 2>&1 || echo "Run via tsx instead"

# Use tsx for TypeScript execution
npx tsx -e "
import { getTikTokPhotoInfos } from './functions/fetchTiktokPhotoInfos.ts';
const r = await getTikTokPhotoInfos('https://www.tiktok.com/@taylorisprecool/photo/7396759867526089989');
if ('error' in r) { console.error('ERROR:', r.error); process.exit(1); }
console.log('OK — images:', r.images.length, '| title:', r.video_details.title.slice(0, 40));
" 2>&1
```

Expected: `OK — images: 30 | title: …`

- [ ] **Step 4: Commit**

```bash
git add functions/fetchTiktokPhotoInfos.ts
git commit -m "feat(tiktok-photos): add getTikTokPhotoInfos server action via gallery-dl"
```

---

## Task 7: Update `functions/fetchTiktokInfos.ts` to branch photo/video

**Files:**
- Modify: `functions/fetchTiktokInfos.ts`

- [ ] **Step 1: Add the photo branch**

At the top of `getTikTokInfos`, after the `tiktok_validate` check, insert the type detection and photo dispatch. Replace the existing function body as follows:

```typescript
"use server";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { selectYtDlpPath, tiktok_validate } from "@/lib/serverUtils";
import type { FormatData, TikTokPhotoData, VideoData } from "@/lib/types";
import { TIKTOK_ITAG } from "@/lib/types";
import { getCookiesOpt } from "@/lib/ytdlp-cookies";
import { detectTiktokType } from "@/lib/tiktok-detect";
import { getTikTokPhotoInfos } from "./fetchTiktokPhotoInfos";

const log = logger.child({ module: "fetch-tiktok-infos" });

const TIKTOK_FORMATS: FormatData[] = [
  { itag: TIKTOK_ITAG.WATERMARK, qualityLabel: "Video (with watermark)" },
  { itag: TIKTOK_ITAG.NO_WATERMARK, qualityLabel: "Video (no watermark)" },
  { itag: TIKTOK_ITAG.AUDIO, qualityLabel: "Audio only (MP3)" },
];

type YtDlpDump = {
  title?: string;
  uploader?: string;
  duration?: number;
  thumbnail?: string;
};

export const getTikTokInfos = async (
  url: string
): Promise<VideoData | TikTokPhotoData | { error: string }> => {
  if (!tiktok_validate(url)) {
    log.warn({ url }, "URL validation failed — not a valid TikTok URL");
    return { error: "Invalid URL" };
  }

  // Detect post type before choosing the fetch path
  const postType = await detectTiktokType(url);
  if (postType === "photo") {
    return getTikTokPhotoInfos(url);
  }

  log.info({ url }, "Fetching TikTok video info");
  const startTime = Date.now();

  const ytdl = selectYtDlpPath();

  let dump: YtDlpDump;
  try {
    dump = (await ytdl(url, {
      dumpJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      ...getCookiesOpt(),
    })) as YtDlpDump;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch TikTok info";
    log.error({ url, err, durationMs: Date.now() - startTime }, `TikTok info fetch failed: ${msg}`);
    return { error: msg };
  }

  const videoData: VideoData = {
    video_details: {
      title: dump.title ?? "Unknown title",
      description: "",
      duration: String(dump.duration ?? 0),
      thumbnail: dump.thumbnail ?? "",
      author: dump.uploader ?? "",
    },
    format: TIKTOK_FORMATS,
  };

  log.info(
    { url, title: dump.title, durationSec: dump.duration, durationMs: Date.now() - startTime },
    "TikTok info fetched successfully"
  );

  try {
    const existing = await prisma.video.findUnique({ where: { url } });
    if (!existing) {
      await prisma.video.create({ data: { title: dump.title ?? "Unknown", url } });
      log.debug({ url, title: dump.title }, "TikTok video record created in DB");
    }
  } catch (dbErr) {
    log.warn({ url, err: dbErr }, "Failed to upsert TikTok video in DB — non-fatal");
  }

  return JSON.parse(JSON.stringify(videoData));
};
```

- [ ] **Step 2: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add functions/fetchTiktokInfos.ts
git commit -m "feat(tiktok-photos): branch photo/video in getTikTokInfos via detectTiktokType"
```

---

## Task 8: Add `/api/download/tiktok-image/route.ts`

**Files:**
- Create: `app/api/download/tiktok-image/route.ts`

- [ ] **Step 1: Create the stream-through proxy**

```typescript
import { getClientIp, guardApiRequest } from "@/lib/api-guard";
import { generateReqId, getLog, hashIp, runWithRequestContext } from "@/lib/request-context";

const TIKTOK_CDN_HOSTNAMES = [
  ".tiktokcdn-eu.com",
  ".tiktokcdn.com",
  ".tiktokv.com",
  ".tiktokcdn-us.com",
];

function isTiktokCdnUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return TIKTOK_CDN_HOSTNAMES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const reqId = generateReqId();
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  return runWithRequestContext(reqId, ipHash, async () => {
    const log = getLog("tiktok-image");

    const guard = guardApiRequest(request);
    if (guard) return guard;

    const params = new URL(request.url).searchParams;
    const imageUrl = params.get("url");
    const index = params.get("index") ?? "1";

    if (!imageUrl) {
      log.warn("Missing url parameter");
      return new Response("Missing url parameter", { status: 400 });
    }

    if (!isTiktokCdnUrl(imageUrl)) {
      log.warn({ imageUrl }, "Rejected non-TikTok CDN URL");
      return new Response("Invalid image URL", { status: 400 });
    }

    log.info({ imageUrl, index }, "Proxying TikTok image download");

    let upstream: Response;
    try {
      upstream = await fetch(imageUrl, {
        headers: { Referer: "https://www.tiktok.com/" },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err) {
      log.error({ err, imageUrl }, "Failed to fetch image from TikTok CDN");
      return new Response("Failed to fetch image", { status: 502 });
    }

    if (!upstream.ok) {
      log.warn({ status: upstream.status, imageUrl }, "TikTok CDN returned non-OK status");
      return new Response("Image not available", { status: upstream.status });
    }

    const contentLength = upstream.headers.get("content-length");

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="tiktok-photo-${index}.jpg"`,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
      },
    });
  });
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/download/tiktok-image/route.ts
git commit -m "feat(tiktok-photos): add stream-through proxy for TikTok image download"
```

---

## Task 9: Add i18n keys for the photo slider

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fr-FR.json`
- Modify: `messages/es-419.json`
- Modify: `messages/pt-BR.json`

- [ ] **Step 1: Add `tiktokPhoto` namespace to `messages/en.json`**

Add at the end of the JSON object (before the closing `}`):

```json
"tiktokPhoto": {
  "photoCounter": "{current} / {total}",
  "downloadPhoto": "Download photo {n}",
  "downloading": "Downloading…",
  "photoCount": "{count, plural, one {# photo} other {# photos}}",
  "errorDownload": "Download failed. Try again."
}
```

- [ ] **Step 2: Add `tiktokPhoto` to `messages/fr-FR.json`**

```json
"tiktokPhoto": {
  "photoCounter": "{current} / {total}",
  "downloadPhoto": "Télécharger la photo {n}",
  "downloading": "Téléchargement…",
  "photoCount": "{count, plural, one {# photo} other {# photos}}",
  "errorDownload": "Échec du téléchargement. Réessayez."
}
```

- [ ] **Step 3: Add `tiktokPhoto` to `messages/es-419.json`**

```json
"tiktokPhoto": {
  "photoCounter": "{current} / {total}",
  "downloadPhoto": "Descargar foto {n}",
  "downloading": "Descargando…",
  "photoCount": "{count, plural, one {# foto} other {# fotos}}",
  "errorDownload": "Error al descargar. Inténtalo de nuevo."
}
```

- [ ] **Step 4: Add `tiktokPhoto` to `messages/pt-BR.json`**

```json
"tiktokPhoto": {
  "photoCounter": "{current} / {total}",
  "downloadPhoto": "Baixar foto {n}",
  "downloading": "Baixando…",
  "photoCount": "{count, plural, one {# foto} other {# fotos}}",
  "errorDownload": "Falha no download. Tente novamente."
}
```

- [ ] **Step 5: Commit**

```bash
git add messages/
git commit -m "feat(tiktok-photos): add tiktokPhoto i18n namespace (4 locales)"
```

---

## Task 10: Install embla-carousel-react

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install**

```bash
pnpm add embla-carousel-react
```

- [ ] **Step 2: Verify it resolves**

```bash
node -e "require('embla-carousel-react')" 2>&1 || echo "Check after build"
pnpm exec tsc --noEmit 2>&1 | grep embla
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(tiktok-photos): add embla-carousel-react"
```

---

## Task 11: Create `TikTokPhotoSlider` component

**Files:**
- Create: `components/custom/TikTokPhotoSlider.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Download, ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import type { TikTokPhotoData } from "@/lib/types";

interface Props {
  data: TikTokPhotoData;
}

export function TikTokPhotoSlider({ data }: Props) {
  const t = useTranslations("tiktokPhoto");
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const handleDownload = async (imageUrl: string, index: number) => {
    setDownloadError(null);
    setDownloadingIndex(index);
    track("download_started", {
      source: "tiktok",
      format: "tiktok-photo",
      title: data.video_details.title,
      quality: `photo-${index}`,
    });
    try {
      const res = await fetch(
        `/api/download/tiktok-image?url=${encodeURIComponent(imageUrl)}&index=${index}`
      );
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.video_details.title || "tiktok-photo"}-${index}.jpg`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      track("download_completed", { source: "tiktok", format: "tiktok-photo" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : "unknown";
      track("download_failed", { source: "tiktok", format: "tiktok-photo", reason });
      setDownloadError(t("errorDownload"));
    }
    setDownloadingIndex(null);
  };

  const currentImage = data.images[selectedIndex];
  const isDownloadingCurrent = downloadingIndex === selectedIndex + 1;
  const totalPhotos = data.images.length;

  return (
    <div className="mx-auto max-w-270">
      <div className="overflow-hidden rounded-2xl border border-white/6 bg-stroy-800">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 border-b border-white/6 p-6">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/6 bg-stroy-950 text-stroy-200">
            <ImageIcon size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-snug tracking-tight line-clamp-1">
              {data.video_details.title || "TikTok Photos"}
            </h2>
            <p className="text-sm text-white/60">
              {data.video_details.author && (
                <span className="mr-2 font-medium">{data.video_details.author}</span>
              )}
              {t("photoCount", { count: totalPhotos })}
            </p>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div className="relative bg-stroy-900">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {data.images.map((img, i) => (
                <div
                  key={img.url}
                  className="relative min-w-0 flex-[0_0_100%]"
                  aria-hidden={i !== selectedIndex}
                >
                  <div className="flex max-h-[70vh] min-h-72 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={`Photo ${i + 1} of ${totalPhotos}`}
                      className="max-h-[70vh] w-full object-contain"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav arrows */}
          {totalPhotos > 1 && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                disabled={selectedIndex === 0}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={scrollNext}
                disabled={selectedIndex === totalPhotos - 1}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Counter badge */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-xs text-white">
            {t("photoCounter", { current: selectedIndex + 1, total: totalPhotos })}
          </div>
        </div>

        {/* ── Download current photo ── */}
        <div className="flex flex-col gap-3 p-6">
          {downloadError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-white/90">
              {downloadError}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleDownload(currentImage.url, selectedIndex + 1)}
            disabled={downloadingIndex !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-stroy-500 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-stroy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={18} />
            {isDownloadingCurrent
              ? t("downloading")
              : t("downloadPhoto", { n: selectedIndex + 1 })}
          </button>
        </div>

        {/* ── Thumbnail strip (up to 8 shown) ── */}
        {totalPhotos > 1 && (
          <div className="flex gap-2 overflow-x-auto px-6 pb-6 pt-0">
            {data.images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => {
                  emblaApi?.scrollTo(i);
                  setSelectedIndex(i);
                }}
                aria-label={`Go to photo ${i + 1}`}
                className={`relative aspect-square h-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  i === selectedIndex
                    ? "border-stroy-300"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Photo ${i + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {downloadingIndex === i + 1 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/custom/TikTokPhotoSlider.tsx
git commit -m "feat(tiktok-photos): add TikTokPhotoSlider component with Embla carousel"
```

---

## Task 12: Update `VideoSelect` to handle photo response

**Files:**
- Modify: `components/custom/VideoSelect.tsx`

- [ ] **Step 1: Add the photo state and early render branch**

Add the import at the top of the imports section:

```typescript
import type { TikTokPhotoData, VideoData } from "@/lib/types";
import { TikTokPhotoSlider } from "./TikTokPhotoSlider";
```

Replace the existing `import type { VideoData } from "@/lib/types";` line.

- [ ] **Step 2: Add `photoData` state inside the component (after existing state declarations)**

After `const [downloadError, setDownloadError] = useState<string | null>(null);`, add:

```typescript
const [photoData, setPhotoData] = useState<TikTokPhotoData | null>(null);
```

- [ ] **Step 3: Handle photo response in the `getVideoInfos` effect**

In the `.then((value) => {` callback, before the existing `if (value.error)` check, insert:

```typescript
// Photo post: render slider instead of format picker
if ("type" in value && value.type === "photo") {
  setPhotoData(value);
  setIsLoading(false);
  track("video_loaded", {
    source,
    title: value.video_details.title,
    author: value.video_details.author,
    duration_s: 0,
    format_count: value.images.length,
  });
  return;
}
```

- [ ] **Step 4: Add photo render branch**

After `if (isLoading) return <VideoLoading />;`, add:

```typescript
if (photoData) return <TikTokPhotoSlider data={photoData} />;
```

- [ ] **Step 5: Run type check**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Run all unit tests**

```bash
pnpm test:unit 2>&1 | tail -15
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add components/custom/VideoSelect.tsx
git commit -m "feat(tiktok-photos): branch TikTokPhotoSlider in VideoSelect for photo posts"
```

---

## Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add gallery-dl to the binary management section**

In the `## Key Patterns` section, extend the two-library note and add a new binary info:

```markdown
**Three binaries in production**: `youtubei.js` for YouTube metadata, `youtube-dl-exec` (yt-dlp) for YouTube/TikTok video downloads, and `gallery-dl` for TikTok photo slideshows. Binary paths are resolved by `lib/ytdlp-binary.ts` and `lib/gallery-dl-binary.ts` respectively. Versions are pinned in `.ytdlp-version` and `.gallery-dl-version`.

**TikTok post type detection**: `lib/tiktok-detect.ts` → `detectTiktokType(url)`. Uses URL pattern matching for explicit `/video/` or `/photo/` paths; falls back to HTTP HEAD redirect follow for short URLs (`vm.tiktok.com`, `tiktok.com/t/`). Photo posts go through `functions/fetchTiktokPhotoInfos.ts` (gallery-dl). Video posts go through `functions/fetchTiktokInfos.ts` (yt-dlp).

**TikTok photo download**: Images are not cached on disk. `/api/download/tiktok-image` is a stream-through proxy that fetches directly from the TikTok CDN on each download click. CDN URLs expire after ~48h.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document gallery-dl integration and TikTok photo detection"
```

---

## Self-Review

**Spec coverage:**
- ✅ Short URLs with hyphens (`vm.tiktok.com/ZN92BN73vPy4j-1KTiG/`) — fixed in prior session + detectTiktokType handles resolution
- ✅ `/photo/` URL detection — `detectTiktokType` + `fetchTiktokPhotoInfos`
- ✅ gallery-dl binary management (`.gallery-dl-version`, `lib/gallery-dl-binary.ts`, `copy-binaries.js`, `Dockerfile`)
- ✅ Same versioning pattern as yt-dlp (`.gallery-dl-version` file)
- ✅ Photo slider with Embla
- ✅ Per-photo download button
- ✅ No audio download for photo posts (dropped per spec)
- ✅ No image caching (stream-through proxy per spec)
- ✅ Display uses CDN URLs directly (no proxy for display)
- ✅ i18n 4 locales
- ✅ CLAUDE.md updated

**Placeholder scan:** No TBD/TODO/placeholder found.

**Type consistency:**
- `TikTokPhotoData` defined in Task 4, used in Tasks 6, 7, 11, 12 — consistent.
- `getTikTokPhotoInfos` defined in Task 6, imported in Task 7 — consistent.
- `detectTiktokType` defined in Task 5, imported in Task 7 — consistent.
- `getGalleryDlBinaryPath` defined in Task 1, imported in Task 6 — consistent.
- `TikTokPhotoSlider` defined in Task 11, imported in Task 12 — consistent.
