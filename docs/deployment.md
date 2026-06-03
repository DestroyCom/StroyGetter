## Deployment

**Docker**: `docker-compose up -d` (uses `Dockerfile`, mounts SQLite + temp via volume).

**Live URL**: `https://stroygetter.fr` (configured via `SITE_URL` env var at runtime).

**Release pipeline**: Push to the `prod` branch (not `master`) triggers CI: creates git tag from commit message → builds Docker image → publishes GitHub release.

**CI secret**: The `.env` file is injected from the `ENVFILE` GitHub secret during image builds. Never committed.

**Binary copy**: `copy-binaries.js` runs postbuild to copy the yt-dlp binary into `.next/standalone/`. This is required for the standalone output to work.
