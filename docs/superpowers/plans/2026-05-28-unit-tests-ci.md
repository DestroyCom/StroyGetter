# Unit Tests + CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 unit test files covering untested pure/near-pure modules, fix the broken pnpm CI error, and add a `ci.yml` workflow that runs unit tests on every push/PR.

**Architecture:** Unit tests live in `__tests__/lib/` and are fast/deterministic (no network, no yt-dlp binary). Integration tests remain in `__tests__/integration/` and are only run by the nightly `scheduled_tests.yml`. A new `ci.yml` workflow runs `pnpm test:unit` (`vitest run __tests__/lib/`) on every push and PR.

**Tech Stack:** Vitest 4, Node.js test environment, `vi.mock` for fs/env, GitHub Actions.

---

## File Map

| Action | Path |
|---|---|
| Modify | `package.json` |
| Create | `.github/workflows/ci.yml` |
| Create | `__tests__/lib/rate-limiter.test.ts` |
| Create | `__tests__/lib/route-utils.test.ts` |
| Create | `__tests__/lib/api-guard.test.ts` |
| Create | `__tests__/lib/ytdlp-cookies.test.ts` |
| Create | `__tests__/lib/lyrics/lrc-to-sylt.test.ts` |
| Create | `__tests__/lib/lyrics/vtt-to-sylt.test.ts` |

---

### Task 1: Fix pnpm CI error + add `test:unit` script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `packageManager` and `test:unit` to `package.json`**

In `package.json`, add `"packageManager"` at top level and `"test:unit"` to scripts:

```json
{
  "name": "stroygetter",
  "version": "3.11.0",
  "packageManager": "pnpm@10.32.1",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "node copy-binaries.js",
    "start": "next start",
    "lint": "biome check .",
    "format": "biome format . --write",
    "knip": "knip",
    "db:deploy": "prisma migrate deploy && prisma generate",
    "test": "vitest run",
    "test:unit": "vitest run __tests__/lib/",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Verify the fix locally**

```bash
pnpm test:unit
```

Expected: vitest runs (0 tests collected yet — that's fine), exits 0.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "fix(ci): declare packageManager pnpm@10.32.1, add test:unit script"
```

---

### Task 2: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm test:unit
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add unit test gate on every push and PR"
```

---

### Task 3: Tests for `lib/rate-limiter.ts`

**Files:**
- Create: `__tests__/lib/rate-limiter.test.ts`
- Reference: `lib/rate-limiter.ts` — `isRateLimited(ip: string): boolean`, window=60s, max=10

- [ ] **Step 1: Write the tests**

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import after vi.useFakeTimers so Date.now is faked from the start
vi.useFakeTimers();

import { isRateLimited } from "@/lib/rate-limiter";

// The module keeps a module-level Map. Re-import a fresh instance each suite.
describe("isRateLimited", () => {
  beforeEach(() => {
    vi.setSystemTime(0);
    // Reset the internal buckets by re-importing a fresh module instance
    vi.resetModules();
  });

  it("returns false for the first request", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    expect(fn("1.2.3.4")).toBe(false);
  });

  it("allows up to 10 requests in the window", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) {
      expect(fn("1.2.3.4")).toBe(false);
    }
  });

  it("blocks the 11th request within the window", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    expect(fn("1.2.3.4")).toBe(true);
  });

  it("does not affect a different IP", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    expect(fn("5.6.7.8")).toBe(false);
  });

  it("allows requests again after the window expires", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    for (let i = 0; i < 10; i++) fn("1.2.3.4");
    // Advance past the 60-second window
    vi.setSystemTime(61_000);
    expect(fn("1.2.3.4")).toBe(false);
  });

  it("uses a sliding window — only old timestamps expire", async () => {
    const { isRateLimited: fn } = await import("@/lib/rate-limiter");
    // 9 requests at t=0
    for (let i = 0; i < 9; i++) fn("1.2.3.4");
    // Advance 30s, add 1 more (total 10 in window starting from t=0)
    vi.setSystemTime(30_000);
    expect(fn("1.2.3.4")).toBe(false); // 10th — allowed
    // 11th — should be blocked (t=0..30s = 10 timestamps still in window)
    expect(fn("1.2.3.4")).toBe(true);
    // Advance to t=61s — the 9 timestamps from t=0 expire, 1 at t=30s remains
    vi.setSystemTime(61_000);
    expect(fn("1.2.3.4")).toBe(false); // only 1+1=2 in window now
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/rate-limiter.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/rate-limiter.test.ts
git commit -m "test: rate-limiter — window, threshold, per-IP isolation, expiry"
```

---

### Task 4: Tests for `lib/route-utils.ts`

**Files:**
- Create: `__tests__/lib/route-utils.test.ts`
- Reference: `lib/route-utils.ts` — `buildContentDisposition(title, ext)`, `cleanFiles(paths)`

- [ ] **Step 1: Write the tests**

```typescript
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildContentDisposition, cleanFiles } from "@/lib/route-utils";

describe("buildContentDisposition", () => {
  it("returns attachment header with encoded filename", () => {
    const result = buildContentDisposition("My Video", "mp4");
    expect(result).toBe(`attachment; filename="${encodeURIComponent("My Video")}.mp4"`);
  });

  it("strips combining diacritics (accents)", () => {
    const result = buildContentDisposition("Résumé naïf", "mp3");
    // After NFKD + diacritic strip + encodeURIComponent: "Resume%20naif"
    expect(result).toContain("Resume%20naif");
  });

  it("falls back to ext when title is empty", () => {
    const result = buildContentDisposition("", "mp4");
    expect(result).toBe(`attachment; filename="${encodeURIComponent("mp4")}.mp4"`);
  });

  it("percent-encodes spaces and special chars", () => {
    const result = buildContentDisposition("A & B (feat. C)", "mp4");
    expect(result).not.toContain(" ");
    expect(result).toContain(".mp4");
  });
});

describe("cleanFiles", () => {
  let tmpDir: string;
  let file1: string;
  let file2: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sg-test-"));
    file1 = path.join(tmpDir, "a.txt");
    file2 = path.join(tmpDir, "b.txt");
    fs.writeFileSync(file1, "a");
    fs.writeFileSync(file2, "b");
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
  });

  it("deletes existing files", () => {
    cleanFiles([file1, file2]);
    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(false);
  });

  it("does not throw for non-existent paths", () => {
    expect(() => cleanFiles([path.join(tmpDir, "ghost.txt")])).not.toThrow();
  });

  it("deletes only the files listed", () => {
    cleanFiles([file1]);
    expect(fs.existsSync(file1)).toBe(false);
    expect(fs.existsSync(file2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/route-utils.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/route-utils.test.ts
git commit -m "test: route-utils — buildContentDisposition encoding, cleanFiles"
```

---

### Task 5: Tests for `lib/api-guard.ts`

**Files:**
- Create: `__tests__/lib/api-guard.test.ts`
- Reference: `lib/api-guard.ts` — `getClientIp(request)`, `guardApiRequest(request)`
- Note: `guardApiRequest` calls `isRateLimited` — mock it to avoid state leakage.

- [ ] **Step 1: Write the tests**

```typescript
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limiter", () => ({
  isRateLimited: vi.fn().mockReturnValue(false),
}));

import { isRateLimited } from "@/lib/rate-limiter";
import { getClientIp, guardApiRequest } from "@/lib/api-guard";

function makeRequest(headers: Record<string, string> = {}, url = "https://example.com/api/test") {
  return new Request(url, { headers });
}

describe("getClientIp", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const req = makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = makeRequest({ "x-real-ip": "9.10.11.12" });
    expect(getClientIp(req)).toBe("9.10.11.12");
  });

  it("falls back to 'unknown' when both headers are absent", () => {
    const req = makeRequest();
    expect(getClientIp(req)).toBe("unknown");
  });
});

describe("guardApiRequest", () => {
  it("returns null for a same-origin request (sec-fetch-site: same-origin)", () => {
    const req = makeRequest({ "sec-fetch-site": "same-origin" });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns null for a same-site request", () => {
    const req = makeRequest({ "sec-fetch-site": "same-site" });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns null when referer host matches request host", () => {
    const req = makeRequest({
      referer: "https://example.com/page",
      host: "example.com",
    });
    expect(guardApiRequest(req)).toBeNull();
  });

  it("returns 403 for a cross-origin request with no referer match", () => {
    const req = makeRequest({
      "sec-fetch-site": "cross-site",
      referer: "https://attacker.com",
      host: "example.com",
    });
    const response = guardApiRequest(req);
    expect(response?.status).toBe(403);
  });

  it("returns 403 when both sec-fetch-site and referer are absent", () => {
    const req = makeRequest();
    const response = guardApiRequest(req);
    expect(response?.status).toBe(403);
  });

  it("returns 429 when the IP is rate-limited", () => {
    vi.mocked(isRateLimited).mockReturnValueOnce(true);
    const req = makeRequest({ "sec-fetch-site": "same-origin" });
    const response = guardApiRequest(req);
    expect(response?.status).toBe(429);
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/api-guard.test.ts
```

Expected: 9 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/api-guard.test.ts
git commit -m "test: api-guard — getClientIp header chain, guardApiRequest origin/rate-limit"
```

---

### Task 6: Tests for `lib/ytdlp-cookies.ts`

**Files:**
- Create: `__tests__/lib/ytdlp-cookies.test.ts`
- Reference: `lib/ytdlp-cookies.ts` — `getCookiesArgs(): string[]`, `getCookiesOpt(): { cookies?: string }`

- [ ] **Step 1: Write the tests**

```typescript
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("getCookiesArgs", () => {
  let tmpFile: string;
  const originalEnv = process.env.COOKIES_PATH;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `cookies-test-${Date.now()}.txt`);
  });

  afterEach(() => {
    process.env.COOKIES_PATH = originalEnv;
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("returns [] when COOKIES_PATH is not set", async () => {
    delete process.env.COOKIES_PATH;
    const { getCookiesArgs } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesArgs()).toEqual([]);
  });

  it("returns [] when COOKIES_PATH points to a missing file", async () => {
    process.env.COOKIES_PATH = "/tmp/does-not-exist-sg.txt";
    const { getCookiesArgs } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesArgs()).toEqual([]);
  });

  it("returns ['--cookies', path] when the file exists", async () => {
    fs.writeFileSync(tmpFile, "# Netscape HTTP Cookie File\n");
    process.env.COOKIES_PATH = tmpFile;
    const { getCookiesArgs } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesArgs()).toEqual(["--cookies", tmpFile]);
  });
});

describe("getCookiesOpt", () => {
  let tmpFile: string;
  const originalEnv = process.env.COOKIES_PATH;

  beforeEach(() => {
    tmpFile = path.join(os.tmpdir(), `cookies-opt-test-${Date.now()}.txt`);
  });

  afterEach(() => {
    process.env.COOKIES_PATH = originalEnv;
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("returns {} when COOKIES_PATH is not set", async () => {
    delete process.env.COOKIES_PATH;
    const { getCookiesOpt } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesOpt()).toEqual({});
  });

  it("returns {} when COOKIES_PATH file is missing", async () => {
    process.env.COOKIES_PATH = "/tmp/does-not-exist-sg.txt";
    const { getCookiesOpt } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesOpt()).toEqual({});
  });

  it("returns { cookies: path } when the file exists", async () => {
    fs.writeFileSync(tmpFile, "# Netscape HTTP Cookie File\n");
    process.env.COOKIES_PATH = tmpFile;
    const { getCookiesOpt } = await import("@/lib/ytdlp-cookies");
    expect(getCookiesOpt()).toEqual({ cookies: tmpFile });
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/ytdlp-cookies.test.ts
```

Expected: 6 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/ytdlp-cookies.test.ts
git commit -m "test: ytdlp-cookies — env absent, file missing, file present"
```

---

### Task 7: Tests for `lib/lyrics/lrc-to-sylt.ts`

**Files:**
- Create: `__tests__/lib/lyrics/lrc-to-sylt.test.ts`
- Reference: `lib/lyrics/lrc-to-sylt.ts` — `lrcToSylt(lrc: string): SyltEntry[]`
  - `SyltEntry = { text: string; timeStamp: number }` (timeStamp in ms)
  - Sub-second format: `[MM:SS.HH]` (hundredths × 10) or `[MM:SS.MMM]` (milliseconds)

- [ ] **Step 1: Write the tests**

```typescript
import { describe, expect, it } from "vitest";
import { lrcToSylt } from "@/lib/lyrics/lrc-to-sylt";

describe("lrcToSylt", () => {
  it("parses a single line with 2-digit sub (hundredths)", () => {
    const result = lrcToSylt("[00:01.23] Hello world");
    expect(result).toEqual([{ text: "Hello world", timeStamp: 1_230 }]);
  });

  it("parses a single line with 3-digit sub (milliseconds)", () => {
    const result = lrcToSylt("[00:01.234] Hello world");
    expect(result).toEqual([{ text: "Hello world", timeStamp: 1_234 }]);
  });

  it("converts minutes correctly", () => {
    const result = lrcToSylt("[02:30.00] Chorus");
    expect(result).toEqual([{ text: "Chorus", timeStamp: 150_000 }]);
  });

  it("trims whitespace from text", () => {
    const result = lrcToSylt("[00:00.50]   Spaced   ");
    expect(result[0].text).toBe("Spaced");
  });

  it("skips lines without a valid LRC timestamp", () => {
    const lrc = "[ti:Song Title]\n[00:01.00] First line\nno timestamp here";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("First line");
  });

  it("skips blank text lines (e.g. instrumental breaks)", () => {
    const lrc = "[00:01.00]\n[00:02.00] Real line";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Real line");
  });

  it("parses multiple lines in order", () => {
    const lrc = "[00:01.00] Line one\n[00:02.50] Line two\n[00:04.00] Line three";
    const result = lrcToSylt(lrc);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ text: "Line one", timeStamp: 1_000 });
    expect(result[1]).toEqual({ text: "Line two", timeStamp: 2_500 });
    expect(result[2]).toEqual({ text: "Line three", timeStamp: 4_000 });
  });

  it("returns empty array for empty input", () => {
    expect(lrcToSylt("")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/lyrics/lrc-to-sylt.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/lyrics/lrc-to-sylt.test.ts
git commit -m "test: lrc-to-sylt — 2/3-digit sub, minutes, blank lines, multi-line"
```

---

### Task 8: Tests for `lib/lyrics/vtt-to-sylt.ts`

**Files:**
- Create: `__tests__/lib/lyrics/vtt-to-sylt.test.ts`
- Reference: `lib/lyrics/vtt-to-sylt.ts` — `vttToSylt(vtt: string): SyltEntry[]`
  - Timestamps: `HH:MM:SS.mmm --> ...` or `MM:SS.mmm --> ...`
  - Strips HTML tags from text
  - Deduplicates consecutive identical lines (YouTube word-level VTT behavior)

- [ ] **Step 1: Write the tests**

```typescript
import { describe, expect, it } from "vitest";
import { vttToSylt } from "@/lib/lyrics/vtt-to-sylt";

const WEBVTT_HEADER = "WEBVTT\n\n";

describe("vttToSylt", () => {
  it("parses a single cue with MM:SS.mmm timestamp", () => {
    const vtt = `${WEBVTT_HEADER}00:01.500 --> 00:02.000\nHello world`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Hello world", timeStamp: 1500 }]);
  });

  it("parses a single cue with HH:MM:SS.mmm timestamp", () => {
    const vtt = `${WEBVTT_HEADER}00:02:30.000 --> 00:02:31.000\nChorus line`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Chorus line", timeStamp: 150_000 }]);
  });

  it("strips HTML tags from cue text", () => {
    const vtt = `${WEBVTT_HEADER}00:01.000 --> 00:02.000\n<c>Hello</c> <b>world</b>`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Hello world", timeStamp: 1000 }]);
  });

  it("deduplicates consecutive identical cues (YouTube word-level VTT)", () => {
    const vtt = [
      WEBVTT_HEADER,
      "00:01.000 --> 00:02.000\nHello",
      "",
      "00:01.500 --> 00:02.500\nHello",
      "",
      "00:02.000 --> 00:03.000\nworld",
    ].join("\n");
    const result = vttToSylt(vtt);
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe("Hello");
    expect(result[1].text).toBe("world");
  });

  it("skips the WEBVTT header block", () => {
    const vtt = `WEBVTT\n\n00:01.000 --> 00:02.000\nOnly line`;
    expect(vttToSylt(vtt)).toHaveLength(1);
  });

  it("joins multiple text lines in a cue with a space", () => {
    const vtt = `${WEBVTT_HEADER}00:01.000 --> 00:02.000\nLine one\nLine two`;
    expect(vttToSylt(vtt)).toEqual([{ text: "Line one Line two", timeStamp: 1000 }]);
  });

  it("skips cues with no text after stripping", () => {
    const vtt = `${WEBVTT_HEADER}00:01.000 --> 00:02.000\n<b></b>`;
    expect(vttToSylt(vtt)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(vttToSylt("")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run and confirm they pass**

```bash
pnpm test:unit __tests__/lib/lyrics/vtt-to-sylt.test.ts
```

Expected: 8 tests pass.

- [ ] **Step 3: Commit**

```bash
git add __tests__/lib/lyrics/vtt-to-sylt.test.ts
git commit -m "test: vtt-to-sylt — HH/MM timestamps, HTML strip, YouTube dedup, multi-line"
```

---

### Task 9: Final smoke-run

- [ ] **Step 1: Run the full unit suite**

```bash
pnpm test:unit
```

Expected: all tests across `__tests__/lib/` pass (rate-limiter, route-utils, api-guard, ytdlp-cookies, lyrics/lrc-to-sylt, lyrics/vtt-to-sylt, plus existing serverUtils/song-matching/innertube).

- [ ] **Step 2: Push the branch**

```bash
git push
```

Expected: the new `ci.yml` workflow triggers on GitHub Actions and all unit tests pass.
