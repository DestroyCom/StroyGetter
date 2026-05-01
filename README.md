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

### With Docker (local)

```bash
docker-compose up -d
```

App is available on port **3002**.  
Videos are persisted in `./docker_videos` (mounted as `/temp/stroygetter`).

---

## Releasing a new version

The release pipeline is fully automated. Triggering it requires two steps:

### 1. Bump the version

Update `version` in `package.json`:

```bash
# example — bump to 3.4.0
npm version 3.4.0 --no-git-tag-version
# or edit package.json manually
```

### 2. Push to the `prod` branch

```bash
git add package.json
git commit -m "3.4.0"
git push origin HEAD:prod
```

The commit message becomes the Git tag. Keep it clean — alphanumeric, dots, hyphens only (other characters are replaced with `-`).

### What the pipeline does automatically

```text
push to prod
  └─ create_tag       — creates Git tag from commit message
  └─ build_web_image  — builds Docker image, pushes destcom/stroygetter:<version> + :latest
  └─ create_release   — creates GitHub release with auto-generated changelog
```

All jobs are defined in [`.github/workflows/deploy_version.yml`](.github/workflows/deploy_version.yml).

### Manual trigger

Each sub-workflow (`build_web_image`, `deploy_prerelease`, `create_release`) can also be triggered manually from the **Actions** tab with an optional custom tag.

---

## CI workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `deploy_version.yml` | Push to `prod` | Full release pipeline |
| `build_web_image.yml` | Called / manual | Build & push Docker image |
| `deploy_prerelease.yml` | Called / manual | Build & push `alpha` image |
| `create_tag.yml` | Called / manual | Create Git tag from commit message |
| `create_release.yml` | Called / manual | Create GitHub release |
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
