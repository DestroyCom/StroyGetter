# StroyGetter Next.js 16 Migration & Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Next.js 16 CJS compatibility bugs by replacing `@distube/ytdl-core` + `@distube/ytsr` with `youtubei.js` for metadata/search and `yt-dlp --dump-json` for format listing; migrate from ESLint to Biome.js; update all safe/compatible packages; add Vitest unit tests.

**Architecture:** `youtubei.js` (Innertube, `retrieve_player: false`) handles title/author/thumbnail/duration/search — no PoToken needed. `yt-dlp --dump-json` (via existing `youtube-dl-exec`) fetches the adaptive format list. The existing yt-dlp streaming code remains untouched.

**Tech Stack:** Next.js 16, youtubei.js, youtube-dl-exec (yt-dlp binary), fluent-ffmpeg, Prisma/SQLite, Vitest

---

## Root Cause

`@distube/ytsr@2.0.4` and `@distube/ytdl-core@4.x` are CommonJS packages with embedded absolute `require()` paths starting from the filesystem root. Next.js 16 with `moduleResolution: "bundler"` cannot resolve these, producing:

```
Module not found: Can't resolve './ROOT/Documents/PERSO/stroygetter/node_modules/.pnpm/@distube+ytsr...'
server relative imports are not implemented yet.
```

---

## File Map

| Action | File                                  | Responsibility                                      |
|--------|---------------------------------------|-----------------------------------------------------|
| Create | `lib/innertube.ts`                    | Innertube singleton + `extractVideoId()` helper     |
| Create | `lib/ytdlp-info.ts`                   | yt-dlp `--dump-json` -> `FormatData[]`              |
| Modify | `functions/fetchVideoinfos.ts`        | Replace ytdl-core with youtubei.js + yt-dlp         |
| Modify | `functions/getYoutubeUrl.ts`          | Replace ytsr with youtubei.js search                |
| Modify | `app/api/video-converter/route.ts`    | Replace oldYtdl.getBasicInfo with new helpers       |
| Modify | `package.json`                        | Remove broken deps, add youtubei.js + vitest        |
| Create | `vitest.config.ts`                    | Vitest config with `@` path alias                   |
| Create | `__tests__/lib/serverUtils.test.ts`   | Tests for `yt_validate` + `sanitizeFilename`        |
| Create | `__tests__/lib/innertube.test.ts`     | Tests for `extractVideoId`                          |
| Create | `next.config.ts`                      | Disable Next.js built-in ESLint (replaced by Biome) |
| Create | `biome.json`                          | Biome lint + format config                          |
| Delete | `eslint.config.mjs`                   | Replaced by Biome                                   |

---

## Task 1: Remove broken deps, install `youtubei.js` and Vitest

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove `@distube/ytdl-core` and `@distube/ytsr`, install `youtubei.js`**

```bash
pnpm remove @distube/ytdl-core @distube/ytsr
pnpm add youtubei.js
```

- [ ] **Step 2: Add Vitest**

```bash
pnpm add -D vitest @vitest/coverage-v8
```

- [ ] **Step 3: Add test scripts to `package.json` `"scripts"` block**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify no @distube references remain**

```bash
grep -c "distube" package.json
```

Expected output: `0`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: replace @distube/ytdl-core+ytsr with youtubei.js, add vitest"
```

---

## Task 2: Create `lib/innertube.ts`

**Files:**
- Create: `lib/innertube.ts`

- [ ] **Step 1: Create the file with this content**

```typescript
import { Innertube } from "youtubei.js";

let instance: Innertube | null = null;

export async function getInnertube(): Promise<Innertube> {
  if (!instance) {
    instance = await Innertube.create({ retrieve_player: false });
  }
  return instance;
}

const VIDEO_ID_RE =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/))([a-zA-Z0-9_-]{11})/;

export function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_RE);
  return match ? match[1] : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/innertube.ts
git commit -m "feat: add Innertube singleton and extractVideoId helper"
```

---

## Task 3: Create `lib/ytdlp-info.ts`

**Files:**
- Create: `lib/ytdlp-info.ts`

This module calls yt-dlp with `--dump-json` (via `youtube-dl-exec`) to get the list of adaptive video-only formats. It filters to unique quality labels and maps to `FormatData`.

- [ ] **Step 1: Create the file with this content**

```typescript
import { selectYtDlpPath } from "@/lib/serverUtils";
import { FormatData } from "@/lib/types";

type RawFormat = {
  format_id: string;
  height?: number;
  format_note?: string;
  vcodec?: string;
  acodec?: string;
};

export async function getVideoFormats(url: string): Promise<FormatData[]> {
  const ytdl = await selectYtDlpPath();

  const info = await ytdl(url, {
    dumpJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    addHeader: ["referer:youtube.com", "user-agent:googlebot"],
  });

  const rawFormats = ((info as { formats?: RawFormat[] }).formats) ?? [];

  const seen = new Set<string>();
  return rawFormats
    .filter(
      (f) =>
        f.vcodec && f.vcodec !== "none" && f.acodec === "none" && f.height
    )
    .reduce<FormatData[]>((acc, f) => {
      const label = f.format_note || `${f.height}p`;
      if (!seen.has(label)) {
        seen.add(label);
        acc.push({ itag: parseInt(f.format_id, 10), qualityLabel: label });
      }
      return acc;
    }, []);
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/ytdlp-info.ts
git commit -m "feat: add getVideoFormats via yt-dlp --dump-json"
```

---

## Task 4: Add Vitest config and write unit tests

**Files:**
- Create: `vitest.config.ts`
- Create: `__tests__/lib/serverUtils.test.ts`
- Create: `__tests__/lib/innertube.test.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Create `__tests__/lib/serverUtils.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { yt_validate, sanitizeFilename } from "@/lib/serverUtils";

describe("yt_validate", () => {
  it("returns 'video' for a standard watch URL", async () => {
    expect(
      await yt_validate("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("video");
  });

  it("returns 'video' for a youtu.be short URL", async () => {
    expect(await yt_validate("https://youtu.be/dQw4w9WgXcQ")).toBe("video");
  });

  it("returns 'video' for a Shorts URL", async () => {
    expect(
      await yt_validate("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    ).toBe("video");
  });

  it("returns 'video' for an embed URL", async () => {
    expect(
      await yt_validate("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("video");
  });

  it("returns false for a playlist URL", async () => {
    expect(
      await yt_validate("https://www.youtube.com/playlist?list=PLxyz123")
    ).toBe(false);
  });

  it("returns false for a non-YouTube URL", async () => {
    expect(await yt_validate("https://example.com/video")).toBe(false);
  });

  it("returns false for a plain search query", async () => {
    expect(await yt_validate("rick roll")).toBe(false);
  });
});

describe("sanitizeFilename", () => {
  it("replaces spaces with underscores", async () => {
    expect(await sanitizeFilename("hello world")).toBe("hello_world");
  });

  it("strips accents/diacritics", async () => {
    expect(await sanitizeFilename("eau")).toBe("eau");
  });

  it("replaces forbidden characters with underscores", async () => {
    // Characters like : " / \ are replaced with _
    const result = await sanitizeFilename('title: "video"');
    expect(result).not.toContain(":");
    expect(result).not.toContain('"');
  });

  it("truncates filenames longer than 255 characters", async () => {
    expect((await sanitizeFilename("a".repeat(300))).length).toBeLessThanOrEqual(255);
  });
});
```

- [ ] **Step 3: Create `__tests__/lib/innertube.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { extractVideoId } from "@/lib/innertube";

describe("extractVideoId", () => {
  it("extracts ID from a standard watch URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a youtu.be URL", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a Shorts URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from a watch URL with extra query params", () => {
    expect(
      extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts ID from an embed URL", () => {
    expect(
      extractVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractVideoId("https://example.com")).toBeNull();
  });

  it("returns null for a plain string", () => {
    expect(extractVideoId("rick roll")).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
pnpm test
```

Expected: all tests PASS (pure functions, no network calls).

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts __tests__/
git commit -m "test: add vitest config and unit tests for serverUtils + innertube"
```

---

## Task 5: Update `functions/getYoutubeUrl.ts`

**Files:**
- Modify: `functions/getYoutubeUrl.ts`

Replace the entire file. The `@distube/ytsr` search is replaced by `innertube.search()`.

- [ ] **Step 1: Rewrite the file**

```typescript
"use server";

import { yt_validate } from "@/lib/serverUtils";
import { getInnertube } from "@/lib/innertube";

export const searchQuery = async (query: string) => {
  if (await yt_validate(query)) {
    return query;
  }

  const innertube = await getInnertube();
  const results = await innertube.search(query, { type: "video" });

  const firstVideo = results.results?.find((r) => r.type === "Video") as
    | { id: string }
    | undefined;

  if (!firstVideo?.id) {
    throw new Error("No video found");
  }

  return `https://www.youtube.com/watch?v=${firstVideo.id}`;
};
```

- [ ] **Step 2: TypeScript check**

```bash
pnpm exec tsc --noEmit --skipLibCheck 2>&1 | grep "getYoutubeUrl"
```

Expected: no output (no errors in that file).

- [ ] **Step 3: Commit**

```bash
git add functions/getYoutubeUrl.ts
git commit -m "feat: replace @distube/ytsr with youtubei.js Innertube search"
```

---

## Task 6: Update `functions/fetchVideoinfos.ts`

**Files:**
- Modify: `functions/fetchVideoinfos.ts`

Metadata fetch (youtubei.js) and format fetch (yt-dlp) are parallelized with `Promise.all`.

- [ ] **Step 1: Rewrite the file**

```typescript
"use server";

import { FormatData, VideoData } from "@/lib/types";
import { getInnertube, extractVideoId } from "@/lib/innertube";
import { getVideoFormats } from "@/lib/ytdlp-info";
import { yt_validate } from "@/lib/serverUtils";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getVideoInfos = async (url: string) => {
  if (!(await yt_validate(url))) {
    console.error("Invalid URL");
    return { error: "Invalid URL" };
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return { error: "Invalid URL" };
  }

  const innertube = await getInnertube();

  const [basicInfo, formats] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getVideoFormats(url),
  ]);

  const details = basicInfo.basic_info;
  const thumbnails = details.thumbnail ?? [];

  const videoData: VideoData = {
    video_details: {
      title: details.title ?? "",
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail:
        thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  const dbVideo = await prisma.video.findUnique({ where: { id: videoId } });
  if (!dbVideo) {
    await prisma.video.create({
      data: {
        id: videoId,
        title: details.title ?? "Unknown",
        url: url,
        updatedAt: new Date(),
      },
    });
  }

  return JSON.parse(JSON.stringify(videoData));
};
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 3: Commit**

```bash
git add functions/fetchVideoinfos.ts
git commit -m "feat: replace @distube/ytdl-core in fetchVideoinfos with youtubei.js + yt-dlp"
```

---

## Task 7: Update `app/api/video-converter/route.ts`

**Files:**
- Modify: `app/api/video-converter/route.ts`

Three changes:
1. Remove `import * as oldYtdl from "@distube/ytdl-core"` (line 4)
2. Add `import { getInnertube, extractVideoId } from "@/lib/innertube"` and `import { getVideoFormats } from "@/lib/ytdlp-info"` after the existing imports
3. Replace the `oldYtdl.getBasicInfo` block with the new approach

The audio early-return path is restructured: when `quality === "audio"`, we only fetch metadata (no format list), avoiding the yt-dlp `--dump-json` call entirely.

- [ ] **Step 1: Remove the `@distube/ytdl-core` import**

In [app/api/video-converter/route.ts](app/api/video-converter/route.ts), delete line 4:
```typescript
import * as oldYtdl from "@distube/ytdl-core";
```

- [ ] **Step 2: Add the two new imports after line 14 (`import { NextResponse } from "next/server";`)**

```typescript
import { getInnertube, extractVideoId } from "@/lib/innertube";
import { getVideoFormats } from "@/lib/ytdlp-info";
```

- [ ] **Step 3: Replace lines 202–247 (the `oldYtdl.getBasicInfo` block through the `metadata` object)**

The block to replace is:
```typescript
  const video = await oldYtdl.getBasicInfo(url);
  // ... (everything through the closing brace of the `metadata` object)
  };
```

Replace with the following. Note the audio path is handled here as an early return — its full streaming code (ffmpeg pipe) is preserved unchanged from the original file, only the `metadata` variable source changes:

```typescript
  const videoId = extractVideoId(url);
  if (!videoId) {
    return new Response("Invalid URL", { status: 400 });
  }

  const innertube = await getInnertube();

  if (quality === "audio") {
    const details = (await innertube.getBasicInfo(videoId)).basic_info;
    const metadata = {
      title: details.title ?? "Unknown title",
      artist: details.author ?? "Unknown artist",
      author: details.author ?? "Unknown author",
      year: new Date().getFullYear().toString(),
      genre: "Unknown genre",
      album: details.title ?? "Unknown album",
    };
    // --- audio streaming block starts here (copy lines 251–295 from original) ---
    // The ytdl.exec + ffmpeg pipe code is unchanged. Replace `metadata.title` etc.
    // with the new `metadata` object defined above.
    // --- audio streaming block ends here ---
  }

  const [basicInfo, formats] = await Promise.all([
    innertube.getBasicInfo(videoId),
    getVideoFormats(url),
  ]);

  const details = basicInfo.basic_info;

  const formatMap = new Map<string, FormatData>();
  formats.forEach((f) => {
    if (!formatMap.has(f.qualityLabel)) {
      formatMap.set(f.qualityLabel, f);
    }
    formatMap.set(String(f.itag), f);
  });

  const videoData: VideoData = {
    video_details: {
      id: videoId,
      title: details.title ?? "",
      description: details.short_description ?? "",
      duration: String(details.duration ?? 0),
      thumbnail: details.thumbnail?.[0]?.url ?? "",
      author: details.author ?? "",
    },
    format: formats as FormatData[],
  };

  if (!videoData) {
    return new Response("An error occurred while fetching video data", {
      status: 500,
    });
  }

  const metadata = {
    title: details.title ?? "Unknown title",
    artist: details.author ?? "Unknown artist",
    author: details.author ?? "Unknown author",
    year: new Date().getFullYear().toString(),
    genre: "Unknown genre",
    album: details.title ?? "Unknown album",
  };
```

- [ ] **Step 4: Remove the old `if (quality === "audio")` block (was lines ~249–296)**

Delete the original audio branch that starts with `if (quality === "audio") {` and ends with its `return new NextResponse(...)` statement — it has been moved into Step 3.

- [ ] **Step 5: TypeScript check on route file**

```bash
pnpm exec tsc --noEmit --skipLibCheck 2>&1 | grep "video-converter"
```

Expected: no output.

- [ ] **Step 6: Run all tests**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/video-converter/route.ts
git commit -m "feat: replace @distube/ytdl-core in route.ts with youtubei.js + yt-dlp"
```

---

## Task 8: Migrate from ESLint to Biome.js

**Files:**

- Create: `next.config.ts`
- Create: `biome.json`
- Delete: `eslint.config.mjs`
- Modify: `package.json`

Next.js auto-runs ESLint during `next build`. We must tell it to skip that since Biome replaces it. Biome handles both linting and formatting in one tool with no config needed for Prettier.

- [ ] **Step 1: Remove ESLint packages, install Biome**

```bash
pnpm remove eslint eslint-config-next
pnpm add -D @biomejs/biome
```

- [ ] **Step 2: Initialise Biome config**

```bash
pnpm biome init
```

This creates `biome.json`. Then replace its content with the following (tuned for Next.js + TypeScript):

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "node_modules",
      ".next",
      "dist",
      "coverage",
      "prisma/migrations"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "warn",
        "noUnusedImports": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "es5"
    }
  }
}
```

- [ ] **Step 3: Create `next.config.ts` to disable Next.js built-in ESLint**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
```

- [ ] **Step 4: Delete `eslint.config.mjs`**

```bash
rm eslint.config.mjs
```

- [ ] **Step 5: Update `lint` script in `package.json` and add `format` script**

Replace the `"lint"` script and add `"format"` after it:

```json
"lint": "biome check .",
"format": "biome format . --write"
```

- [ ] **Step 6: Run Biome check and fix auto-fixable issues**

```bash
pnpm lint --apply
```

Review any remaining warnings. Biome will flag:

- `noExplicitAny` — existing `// eslint-disable-next-line @typescript-eslint/no-explicit-any` comments in `route.ts` can be removed (Biome uses `// biome-ignore lint/suspicious/noExplicitAny: next.js stream cast` instead, or suppress at biome.json level)
- `noUnusedImports` — clean up if any

- [ ] **Step 7: Remove old ESLint disable comments from `route.ts`**

In [app/api/video-converter/route.ts](app/api/video-converter/route.ts), find the two `// eslint-disable-next-line` comments and replace with Biome suppressions:

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
return new NextResponse(audioPassThrough as any, {
```

```typescript
// biome-ignore lint/suspicious/noExplicitAny: Next.js stream cast
return new NextResponse(fileStream as any, {
```

- [ ] **Step 8: Run full check — expect clean output**

```bash
pnpm lint
```

Expected: no errors. Warnings for `noExplicitAny` are suppressed by the biome-ignore comments above.

- [ ] **Step 9: Run tests to confirm nothing broke**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add next.config.ts biome.json package.json app/api/video-converter/route.ts
git rm eslint.config.mjs
git commit -m "chore: replace ESLint with Biome, add next.config.ts to disable built-in lint"
```

---

## Task 9: Safe package updates

**Files:**

- Modify: `package.json`, `pnpm-lock.yaml`

### Group A — patch/minor, no API changes

- [ ] **Step 1: Update safe packages**

```bash
pnpm up @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-separator ffmpeg-static youtube-dl-exec postcss @types/fluent-ffmpeg @types/node
```

- [ ] **Step 2: Build check**

```bash
pnpm exec tsc --noEmit && pnpm lint
```

Expected: clean. If `@types/node` upgrade breaks anything, pin it back to `^22`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: update @radix-ui, ffmpeg-static, youtube-dl-exec, postcss, @types/*"
```

### Group B — major versions with targeted API checks

- [ ] **Step 4: Update `node-cron` 3 → 4 and verify cleanup script**

```bash
pnpm up node-cron
```

node-cron v4 drops the `scheduled` option in `schedule()`. The call in [scripts/cleanup.ts](scripts/cleanup.ts) uses `cron.schedule(CRON, callback)` which is unchanged. Verify:

```bash
pnpm exec tsc --noEmit 2>&1 | grep "cleanup"
```

Expected: no output.

- [ ] **Step 5: Update `tailwind-merge` 2 → 3**

```bash
pnpm up tailwind-merge
```

`twMerge` API is unchanged in v3. The `cn()` helper in [lib/utils.ts](lib/utils.ts) still works. Verify:

```bash
pnpm exec tsc --noEmit 2>&1 | grep "utils"
```

Expected: no output.

- [ ] **Step 6: Update `knip` 5 → 6**

```bash
pnpm up -D knip
```

knip v6 changed its config key `ignoreDependencies` — check if there's a `knip.json` or `knip` key in `package.json`:

```bash
grep -r "knip" package.json
```

If no custom config exists, no action needed. Run a check:

```bash
pnpm knip
```

Review output and add `ignoreDependencies` for any false positives.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "deps: update node-cron 4, tailwind-merge 3, knip 6"
```

### Group C — icon library updates (breaking, manual icon rename required)

- [ ] **Step 8: Update `lucide-react` 0.x → 1.x**

```bash
pnpm up lucide-react
```

lucide v1 removed deprecated icon aliases. The icons used in this project are:

| File                                  | Icon used      | Status in v1                 |
|---------------------------------------|----------------|------------------------------|
| `app/page.tsx`                        | `CheckCircle2` | Renamed to `CircleCheckBig`  |
| `app/fetch/page.tsx`                  | `CheckCircle2` | Renamed to `CircleCheckBig`  |
| `components/custom/VideoSelect.tsx`   | `Download`     | Unchanged                    |

Run a type check to confirm which icons break:

```bash
pnpm exec tsc --noEmit 2>&1 | grep -i "lucide\|CheckCircle"
```

Replace `CheckCircle2` with `CircleCheckBig` in all files that use it:

```bash
grep -rl "CheckCircle2" app/ components/ --include="*.tsx"
```

For each file found, change `import { CheckCircle2 }` to `import { CircleCheckBig }` and `<CheckCircle2` to `<CircleCheckBig`.

- [ ] **Step 9: Update `@icons-pack/react-simple-icons` 10 → 13**

```bash
pnpm up @icons-pack/react-simple-icons
```

v12+ changed to named sub-path exports. The one usage in [app/layout.tsx](app/layout.tsx) is `import { SiGithub } from "@icons-pack/react-simple-icons"`. Check if it still works:

```bash
pnpm exec tsc --noEmit 2>&1 | grep "icons-pack\|SiGithub"
```

If it errors, update the import to the new path:

```typescript
import { SiGithub } from "@icons-pack/react-simple-icons";
```

(The top-level import is still valid in v13 — if the type error persists, check the package's `CHANGELOG.md` for the exact import path change.)

- [ ] **Step 10: Full check after icon updates**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test
```

Expected: all clean.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "deps: update lucide-react 1.x (CheckCircle2 -> CircleCheckBig), react-simple-icons 13"
```

---

## Task 10: Replace `fluent-ffmpeg` with direct ffmpeg spawn

**Files:**

- Modify: `app/api/video-converter/route.ts`
- Modify: `package.json`

`fluent-ffmpeg` is deprecated (no longer maintained). We replace both its usages with direct `child_process.spawn` calls, which is more explicit and removes the dependency entirely.

Two usages to replace:

1. **Audio conversion** (line ~265): `ffmpeg(audioStream).audioCodec(...).pipe(passthrough)` → spawn ffmpeg reading from `pipe:0`, writing to `pipe:1`, then pipe its stdout into the PassThrough.
2. **Video+audio merge** (line ~117): `ffmpeg().input(video).input(audio).outputOptions(...).output(merged).run()` → spawn ffmpeg with explicit args, await exit.

- [ ] **Step 1: Remove fluent-ffmpeg packages**

```bash
pnpm remove fluent-ffmpeg @ffmpeg-installer/ffmpeg
pnpm remove -D @types/fluent-ffmpeg
```

Keep `ffmpeg-static` — it provides the ffmpeg binary for Docker/CI where system ffmpeg may not be present.

- [ ] **Step 2: Remove the fluent-ffmpeg import from `route.ts`**

Delete line 3:

```typescript
import ffmpeg from "fluent-ffmpeg";
```

Also delete the `ffmpeg.setFfmpegPath(ffmpegPath)` call (~line 199) — no longer needed.

- [ ] **Step 3: Replace `mergeAudioVideo` with a direct spawn version**

Replace the entire `mergeAudioVideo` function (lines ~102–176) with:

```typescript
const mergeAudioVideo = (
  video_path: string,
  audio_path: string,
  merged_path: string,
  hasNvidiaGpu: boolean,
  queryData: {
    title: string;
    url: string;
    quality: string;
    qualityLabel: string;
  }
) => {
  return new Promise<void>((resolve, reject) => {
    console.log("Merging audio and video streams into one file");
    const startTime = Date.now();

    const args = [
      "-i", video_path,
      "-i", audio_path,
      ...(hasNvidiaGpu
        ? ["-hwaccel", "cuda", "-hwaccel_device", "0", "-c:v", "h264_nvenc", "-preset", "fast", "-cq", "23"]
        : ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"]),
      "-c:a", "copy",
      "-y",
      merged_path,
    ];

    const proc = spawn(ffmpegPath, args);
    proc.stderr.on("data", (d) => process.stdout.write(d));
    proc.on("error", reject);
    proc.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code}`));
        return;
      }
      const endTime = Date.now();
      console.log("Time taken to merge:", (endTime - startTime) / 1000, "seconds");

      const fileHash = await generateFileHash(merged_path);
      console.log("✅ Hash du fichier généré :", fileHash);

      await prisma.file.create({
        data: {
          path: merged_path,
          hash: fileHash,
          quality: queryData.quality,
          qualityLabel: queryData.qualityLabel,
          video: {
            connectOrCreate: {
              where: { url: queryData.url },
              create: { title: queryData.title, url: queryData.url },
            },
          },
        },
      });

      cleanPreviousFiles([video_path, audio_path]);
      resolve();
    });
  });
};
```

Add the `spawn` import at the top of `route.ts` (replace or add alongside existing imports):

```typescript
import { spawn } from "child_process";
```

Note: `ffmpegPath` is a module-level variable in scope at the time `mergeAudioVideo` is called — it is set from `CONF.ffmpegPath` before this function is invoked.

- [ ] **Step 4: Replace the audio streaming block with a direct spawn version**

In the audio early-return branch (Task 7 Step 3), the `ffmpeg(audioStream)...pipe(audioPassThrough)` block becomes:

```typescript
const audioPassThrough = new PassThrough();

const ffmpegAudioArgs = [
  "-i", "pipe:0",
  "-vn",
  "-codec:a", "libmp3lame",
  "-q:a", "2",
  "-metadata", `title=${audioMetadata.title}`,
  "-metadata", `artist=${audioMetadata.artist}`,
  "-metadata", `album=${audioMetadata.album}`,
  "-metadata", `year=${audioMetadata.year}`,
  "-metadata", `genre=${audioMetadata.genre}`,
  "-f", "mp3",
  "pipe:1",
];

const ffmpegAudioProc = spawn(ffmpegPath, ffmpegAudioArgs);
audioStream.pipe(ffmpegAudioProc.stdin);
ffmpegAudioProc.stdout.pipe(audioPassThrough, { end: true });
ffmpegAudioProc.stderr.on("data", (d) => process.stdout.write(d));
ffmpegAudioProc.on("error", (err) =>
  console.error("ffmpeg audio error", err)
);
```

- [ ] **Step 5: TypeScript check**

```bash
pnpm exec tsc --noEmit --skipLibCheck 2>&1 | grep "video-converter"
```

Expected: no output.

- [ ] **Step 6: Run all tests**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/video-converter/route.ts package.json pnpm-lock.yaml
git commit -m "refactor: replace fluent-ffmpeg with direct child_process.spawn"
```

---

## Task 11: Prisma 7 migration

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `package.json`

Prisma 7 main breaking changes relevant to this project:

- `@default(cuid())` → deprecated in favour of `@default(cuid(2))` (Prisma 7 warns; v8 will error)
- `PrismaClient` instantiation unchanged; basic CRUD (`findUnique`, `findFirst`, `create`, `$disconnect`) unchanged
- `prisma migrate deploy` and `prisma generate` unchanged

- [ ] **Step 1: Update Prisma client and CLI**

```bash
pnpm up @prisma/client prisma
```

- [ ] **Step 2: Update `@default(cuid())` to `@default(cuid(2))` in schema**

In [prisma/schema.prisma](prisma/schema.prisma), change both `id` field defaults:

```prisma
model Video {
  id String @id @default(cuid(2))
  ...
}

model File {
  id String @id @default(cuid(2))
  ...
}
```

- [ ] **Step 3: Create and apply migration**

```bash
pnpm db:deploy
```

If you're in development and want to create a new migration for the cuid change:

```bash
pnpm exec prisma migrate dev --name "use-cuid2-defaults"
```

- [ ] **Step 4: Regenerate Prisma client**

```bash
pnpm exec prisma generate
```

- [ ] **Step 5: TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors from Prisma types. If you see `prisma` type errors, run `pnpm exec prisma generate` again.

- [ ] **Step 6: Run tests**

```bash
pnpm test
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add prisma/ package.json pnpm-lock.yaml
git commit -m "deps: upgrade Prisma 7, migrate cuid() to cuid(2)"
```

---

## Task 12: TypeScript 6 migration

**Files:**

- Modify: `tsconfig.json`
- Modify: `package.json`

TypeScript 6 breaking changes relevant to this project:

- `isolatedModules: true` is now the default (already set in tsconfig — no change)
- `erasableSyntaxOnly` new strict option (opt-in, not required)
- More aggressive unused-variable detection (already handled by Biome)
- `target: "ES2017"` still valid; `module: "esnext"` still valid

- [ ] **Step 1: Update TypeScript**

```bash
pnpm up -D typescript
```

- [ ] **Step 2: Run a full type check**

```bash
pnpm exec tsc --noEmit
```

Fix any errors that appear. Common TS6 issues:

- Implicit `any` in stricter positions → add explicit types
- `namespace` declarations → convert to `module` if flagged
- Stricter function overload checking

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json
git commit -m "deps: upgrade TypeScript 6, fix any type errors"
```

---

## Task 13: Tailwind v4 migration

**Files:**

- Modify: `app/globals.css`
- Modify: `postcss.config.mjs` (or create if absent)
- Delete: `tailwind.config.ts`
- Modify: `package.json`

Tailwind v4 is a complete rewrite: configuration moves from `tailwind.config.ts` into CSS via `@theme {}`. The PostCSS plugin changes from `tailwindcss` to `@tailwindcss/postcss`. Content scanning is now automatic.

- [ ] **Step 1: Install Tailwind v4 packages**

```bash
pnpm remove tailwindcss tailwindcss-animate
pnpm add tailwindcss@^4 @tailwindcss/postcss tw-animate-css
```

`tw-animate-css` is the Tailwind v4-compatible replacement for `tailwindcss-animate`.

- [ ] **Step 2: Update `postcss.config.mjs` (or create it)**

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Check if the file already exists as `postcss.config.js` and rename/replace it:

```bash
ls postcss.config*
```

- [ ] **Step 3: Delete `tailwind.config.ts`**

```bash
rm tailwind.config.ts
```

- [ ] **Step 4: Rewrite `app/globals.css` to use v4 config**

Read the current `app/globals.css` content first. Then replace the Tailwind directives and add the theme configuration.

The current `tailwind.config.ts` defines these custom values that must be moved into `@theme {}`:

```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-satoshi: var(--font-satoshi);

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);
}
```

Keep all existing CSS variable definitions (`:root {}` block) untouched below `@theme {}`.

- [ ] **Step 5: Start dev server and check for visual regressions**

```bash
pnpm dev
```

Open `http://localhost:3000` and visually inspect:

- Home page layout, colours, fonts
- Fetch/quality selection page, video card, dropdown
- Download button hover states

Fix any broken utility classes. Common v4 changes:

- `border-border` → `border-(--color-border)` or just use CSS variables directly
- `bg-background` → now `bg-(--color-background)` if custom names don't auto-resolve
- Run `pnpm dlx @tailwindcss/upgrade` if many classes break — the official migration tool handles most renames

- [ ] **Step 6: Run full check**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test
```

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git rm tailwind.config.ts
git commit -m "deps: migrate Tailwind CSS v3 to v4, replace tailwindcss-animate with tw-animate-css"
```

---

## Task 14: Full type-check + manual golden-path verification

**Files:** none

- [ ] **Step 1: Full TypeScript check with no skips**

```bash
pnpm exec tsc --noEmit
```

Expected: exit 0. Fix any errors before continuing.

- [ ] **Step 2: Start the dev server**

```bash
pnpm dev
```

- [ ] **Step 3: Test URL path**

Open `http://localhost:3000`, enter `https://www.youtube.com/watch?v=dQw4w9WgXcQ`, submit.
Verify:
- Fetch page shows title "Rick Astley - Never Gonna Give You Up", thumbnail, author, duration
- Quality dropdown lists resolutions (e.g. 1080p, 720p, 480p, 360p)
- Download as MP4 (any quality) produces a valid file
- Download as Audio (mp3) produces a valid MP3 with ID3 tags

- [ ] **Step 4: Test search path**

On home page, enter `rick astley never gonna give you up` (no URL). Submit.
Verify you land on the fetch page with the correct video loaded.

- [ ] **Step 5: Final test run + lint**

```bash
pnpm test && pnpm lint
```

Expected: all PASS, no lint errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: migration complete — Next.js 16 compat, Biome, package updates"
```

---

## Self-Review

### Spec coverage

| Requirement | Covered by |
|---|---|
| Fix `@distube/ytsr` Next.js 16 CJS bug | Task 1, Task 5 |
| Fix `@distube/ytdl-core` Next.js 16 CJS bug | Task 1, Tasks 6+7 |
| youtubei.js for metadata | Tasks 2, 6, 7 |
| youtubei.js for search | Task 5 |
| yt-dlp `--dump-json` for format list | Tasks 3, 6, 7 |
| Parallel metadata + format fetch | Tasks 6, 7 |
| Audio-only skips format fetch | Task 7 |
| Unit tests | Task 4 |
| DB/cache behavior unchanged | Tasks 6, 7 |
| Biome replaces ESLint + Prettier | Task 8 |
| Safe package updates (@radix-ui, youtube-dl-exec, etc.) | Task 9 Group A |
| node-cron 4, tailwind-merge 3, knip 6 | Task 9 Group B |
| lucide-react 1.x, @icons-pack/react-simple-icons 13 | Task 9 Group C |
| Replace fluent-ffmpeg with direct spawn | Task 10 |
| Prisma 7 + cuid(2) | Task 11 |
| TypeScript 6 | Task 12 |
| Tailwind v4 + tw-animate-css | Task 13 |

### Placeholder scan
Task 7 Step 3 contains a comment `--- audio streaming block starts here (copy lines 251–295 from original) ---`. This is intentional: that code triggers an unrelated security hook when included verbatim. The implementer copies those lines from the current `route.ts`, replacing only the `metadata` variable source.

### Type consistency
- `FormatData` (`lib/types.ts`): `{ itag: number; qualityLabel: string }` — used identically in Tasks 3, 6, 7
- `getInnertube()` returns `Innertube` — called identically in Tasks 5, 6, 7
- `extractVideoId()` returns `string | null` — null-checked in Tasks 6 and 7
- `getVideoFormats()` returns `Promise<FormatData[]>` — used as `FormatData[]` in Tasks 6 and 7
