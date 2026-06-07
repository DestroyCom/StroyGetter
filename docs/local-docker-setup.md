# Run StroyGetter locally with Docker

This guide walks you through running StroyGetter on your machine in minutes using the pre-built image from Docker Hub — no need to clone the repo or compile anything.

---

## Quick start

If you already have Docker installed, three commands are all you need:

```bash
mkdir stroygetter && cd stroygetter && mkdir -p data logs
curl -fsSL https://raw.githubusercontent.com/DestroyCom/StroyGetter/master/docker-compose.yml -o docker-compose.yml
docker compose up -d
```

Open **[http://localhost:3002](http://localhost:3002)** — done.

> No `curl`? Create a `docker-compose.yml` file manually using the template in [step 3](#3-create-the-docker-composeyml-file) below, then run `docker compose up -d`.

---

## 1. Install Docker

### macOS — OrbStack (recommended)

[OrbStack](https://orbstack.dev) is a lightweight, fast drop-in replacement for Docker Desktop with near-instant startup and low memory/CPU usage.

1. Download the installer from **[orbstack.dev](https://orbstack.dev)**
2. Open the `.dmg` and drag OrbStack to `/Applications`
3. Launch OrbStack — it automatically installs the `docker` and `docker compose` CLI tools

> OrbStack provides a fully Docker-compatible daemon: all `docker` and `docker compose` commands work exactly as they would with Docker Desktop.

### macOS — Docker Desktop (alternative)

Available at [docs.docker.com/desktop/install/mac-install](https://docs.docker.com/desktop/install/mac-install/).

### Windows

Available at [docs.docker.com/desktop/install/windows-install](https://docs.docker.com/desktop/install/windows-install/).

Prerequisite: WSL 2 must be enabled (the installer will guide you through it).

### Linux

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # run docker without sudo (requires re-login)
```

---

## 2. Create a working directory

You only need one directory to hold the config file and persistent data.

```bash
mkdir stroygetter && cd stroygetter
mkdir -p data logs
```

---

## 3. Create the `docker-compose.yml` file

Create a `docker-compose.yml` file in that directory with the following content:

```yaml
services:
  stroygetter:
    image: destcom/stroygetter:latest
    container_name: stroygetter
    restart: unless-stopped
    ports:
      - "3002:3000"
    environment:
      - SITE_URL=http://localhost:3002
      - DATABASE_URL=file:/temp/stroygetter/database/local.db
      - LOG_LEVEL=info
      - CLEANUP_INTERVAL=7
    volumes:
      - ./data:/temp/stroygetter:rw
      - ./logs:/logs:rw
```

---

## 4. Start the container

```bash
docker compose up -d
```

Docker automatically pulls `destcom/stroygetter:latest` from Docker Hub and starts the container in the background.

Check that everything is running:

```bash
docker compose ps        # container status
docker compose logs -f   # stream logs in real time (Ctrl+C to exit)
```

The app is available at **[http://localhost:3002](http://localhost:3002)**.

---

## 5. Environment variables

| Variable           | Default                                    | Description                                                       |
| ------------------ | ------------------------------------------ | ----------------------------------------------------------------- |
| `DATABASE_URL`     | `file:/temp/stroygetter/database/local.db` | SQLite path (required)                                            |
| `SITE_URL`         | `http://localhost:3002`                    | Canonical base URL (sitemap, OpenGraph)                           |
| `CLEANUP_INTERVAL` | `7`                                        | File retention in days                                            |
| `CRON`             | `0 0 * * *`                                | Cleanup schedule (cron syntax)                                    |
| `MAX_FILESIZE`     | `8G`                                       | Max size per yt-dlp stream (`--max-filesize`)                     |
| `LOG_LEVEL`        | `info`                                     | Pino log level: `trace` `debug` `info` `warn` `error`             |
| `COOKIES_PATH`     | _(unset)_                                  | Path to a Netscape-format cookies file (age-restricted videos)    |
| `BANNER_TEXT`      | _(unset)_                                  | Info banner text — non-empty string shows the banner              |
| `BANNER_HREF`      | _(unset)_                                  | Link attached to the banner                                       |
| `ENABLE_YOUTUBE`   | `true`                                     | Set to `false` to disable YouTube search and downloads            |
| `ENABLE_TIKTOK`    | `true`                                     | Set to `false` to disable TikTok search and downloads             |
| `ENABLE_TWITCH`    | `true`                                     | Set to `false` to disable Twitch search and downloads             |

Add any variable you want to customize to the `environment:` section of your `docker-compose.yml`.

---

## 6. Cookies for age-restricted videos (optional)

To download YouTube videos that require a login (age-restricted, etc.), mount a Netscape-format cookies file:

```yaml
    volumes:
      - ./data:/temp/stroygetter:rw
      - ./logs:/logs:rw
      - ./cookies.txt:/run/secrets/cookies.txt:ro   # add this
    environment:
      - COOKIES_PATH=/run/secrets/cookies.txt        # add this
```

Export your cookies from your browser using the **"Get cookies.txt LOCALLY"** extension (Chrome/Firefox).

---

## 7. Update

To upgrade to the latest version:

```bash
docker compose pull          # pull the new image
docker compose up -d         # recreate the container
docker image prune -f        # remove old images (optional)
```

---

## 8. Stop / remove

```bash
docker compose down          # stop and remove the container (data in ./data is preserved)
docker compose down -v       # same + remove anonymous volumes
```
