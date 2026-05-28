# Design — Unit tests + CI pipeline

Date: 2026-05-28

## Context

StroyGetter already uses Vitest with 4 test files (serverUtils, song-matching, innertube, and integration tests for YouTube/TikTok). Tests run nightly via `scheduled_tests.yml` but:

1. The scheduled CI is currently broken — pnpm version unresolved.
2. No tests run on push/PR (no blocking gate).
3. Several pure/near-pure modules have zero coverage.

## Goals

- Fix broken CI (pnpm version error).
- Add a fast unit-test gate that runs on every push/PR.
- Keep integration tests (real network) on the nightly cron only.
- Cover 6 untested modules with meaningful unit tests.

## Approach chosen: A — Unit on PR, integration on cron

Unit tests are fast, deterministic, and safe for CI. Integration tests (hitting real YouTube/TikTok APIs) are kept on the nightly schedule to avoid flaky PR failures.

## Changes

### 1. `package.json`

Add `"packageManager": "pnpm@10.32.1"` — fixes pnpm version resolution for all workflows.

Add script: `"test:unit": "vitest run __tests__/lib/"` — runs only lib unit tests.

### 2. New `.github/workflows/ci.yml`

Triggers on `push` and `pull_request`. Runs `pnpm test:unit`.

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

### 3. New unit test files

| File | Module under test | Key scenarios |
|---|---|---|
| `__tests__/lib/rate-limiter.test.ts` | `lib/rate-limiter.ts` | Under limit, at limit, sliding window expiry |
| `__tests__/lib/route-utils.test.ts` | `lib/route-utils.ts` | `buildContentDisposition` with accents/unicode, `cleanFiles` existing/missing |
| `__tests__/lib/api-guard.test.ts` | `lib/api-guard.ts` | `getClientIp` header fallback chain, `guardApiRequest` same-origin/cross-origin/rate-limited |
| `__tests__/lib/ytdlp-cookies.test.ts` | `lib/ytdlp-cookies.ts` | No env var, env set but file missing, env set and file exists |
| `__tests__/lib/lyrics/lrc-to-sylt.test.ts` | `lib/lyrics/lrc-to-sylt.ts` | 2-digit vs 3-digit sub, empty lines, whitespace |
| `__tests__/lib/lyrics/vtt-to-sylt.test.ts` | `lib/lyrics/vtt-to-sylt.ts` | HH:MM:SS vs MM:SS timestamps, YouTube duplicate dedup, HTML tag stripping |

## Out of scope

- `ytdlp-info.ts` (requires yt-dlp binary mock — complexity not worth it now)
- `innertube.ts` integration path (already has a test file)
- React components (no jsdom setup in this project)
