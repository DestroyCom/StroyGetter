# StroyGetter

An open-source YouTube video downloader built with Next.js. Paste a URL, pick a quality, download — audio or video.

Live at [stroygetter.stroyco.eu](https://stroygetter.stroyco.eu).

> **DISCLAIMER** — For personal and educational use only. By using this project you agree not to download content you do not hold the copyright for. Contributors cannot be held responsible for misuse or violation of any platform's terms of service.

---

## How it works

1. User pastes a YouTube URL on the home page
2. `youtubei.js` fetches video metadata and available formats
3. User picks a quality (or audio-only MP3)
4. The server downloads audio and video streams in parallel via `yt-dlp`, then merges them with FFmpeg using a lossless remux (`-c:v copy -c:a copy`)
5. The merged file is cached in SQLite — repeat requests for the same URL + quality are served instantly from disk

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Package manager | pnpm |
| Database | SQLite via Prisma 7 |
| Video metadata | `youtubei.js` |
| Video download | `youtube-dl-exec` (yt-dlp) |
| Muxing | FFmpeg |
| Styling | Tailwind CSS + shadcn/ui |
| Container | Docker (multi-stage, standalone output) |

## Project structure

```text
app/
  page.tsx                      # Home — URL input
  fetch/page.tsx                # Quality picker after URL submitted
  api/video-converter/route.ts  # GET: download, merge, stream, cache
components/custom/              # GetterInput, VideoSelect, VideoLoading
functions/                      # Server actions (fetchVideoinfos, getYoutubeUrl)
lib/
  serverUtils.ts                # initializeConf, selectYtDlpPath, yt_validate
  innertube.ts                  # youtubei.js singleton
  ytdlp-info.ts                 # Format parsing
  types.ts
scripts/cleanup.ts              # Cron: delete expired files + DB records
prisma/schema.prisma            # SQLite: Video → File
```

---

## Local development

### Requirements

- Node.js 22+
- pnpm
- FFmpeg in PATH (or the `ffmpeg-static` fallback is used automatically)

### Setup

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL at minimum
pnpm db:deploy                # run Prisma migrations + generate client
pnpm dev                      # starts on http://localhost:3000
```

### Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | — | **Required.** SQLite path, e.g. `file:./database/dev.db` |
| `CLEANUP_INTERVAL` | `7` (prod) / `1` (dev) | Days before cached files expire |
| `CRON` | `0 0 * * *` (prod) / `*/1 * * * *` (dev) | Cleanup cron schedule |
| `MAX_FILESIZE` | `8G` | Max size per downloaded stream passed to yt-dlp (`--max-filesize`). Prevents disk exhaustion from oversized videos. |

### With Docker (local)

```bash
docker-compose up -d
```

App is available on port **3002**.  
Cached downloads and the SQLite database are persisted in `./data` (mounted as `/temp/stroygetter`).

> **Upgrade note:** If you previously used `./docker_videos`, move or copy its contents into `./data` to keep existing cached files and database state.
---

## Releasing a new version

Go to **GitHub → Actions → Release → Run workflow**, pick a bump type, and everything runs automatically.

| Bump type | Example: current `3.3.0` | When to use |
| --- | --- | --- |
| `patch` | `3.3.0` → `3.3.1` | Bug fixes, minor tweaks |
| `minor` | `3.3.0` → `3.4.0` | New features, backwards-compatible |
| `major` | `3.3.0` → `4.0.0` | Breaking changes |

### What happens automatically

```text
release.yml (workflow_dispatch: patch | minor | major)
  └─ bump     — increments package.json, commits "chore: release vX.Y.Z", creates & pushes git tag
  └─ docker   — builds Docker image, pushes destcom/stroygetter:vX.Y.Z + :latest
  └─ github-release — creates GitHub release with auto-generated changelog (runs only if docker succeeds)
```

If the Docker build fails, the GitHub release is not created. The `package.json` commit and git tag are still pushed — re-run the `docker` and `github-release` jobs manually from the Actions UI if needed.

---

## CI workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `release.yml` | Manual (Actions tab) | **Main release pipeline** — bump, tag, Docker, GitHub release |
| `build_web_image.yml` | Called / manual | Build & push Docker image |
| `deploy_prerelease.yml` | Called / manual | Build & push `alpha` image |
| `create_tag.yml` | Called / manual | Create Git tag from commit message |
| `create_release.yml` | Called / manual | Create GitHub release |
| `deploy_version.yml` | Push to `prod` | Legacy release pipeline (push-based) |
| `dependabot_release.yml` | Dependabot PR merged | Auto-release on `@distube/` dep update |
| `dependabot_auto_approve.yml` | Dependabot PR opened | Auto-approve Dependabot PRs |

Builds use **Docker BuildX** with GitHub Actions cache (`type=gha`) for fast incremental rebuilds.

---

## Available commands

```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Biome lint
pnpm knip         # Dead code detection
pnpm db:deploy    # Run Prisma migrations + generate client
```
