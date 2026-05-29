## Environment Variables

All vars are **server-only runtime** — no `NEXT_PUBLIC_*`. Configure in docker-compose; never rebuild the image to change these.

```env
DATABASE_URL=file:./database/dev.db   # SQLite path (required)
CLEANUP_INTERVAL=7                    # Days before file expiry (default: 7 prod, 1 dev)
CRON=0 0 * * *                        # Cleanup schedule (default: daily prod, every min dev)
MAX_FILESIZE=8G                       # Max size per yt-dlp stream (default: 8G). Passed as --max-filesize to yt-dlp.
COOKIES_PATH=/run/secrets/cookies.txt # Optional. Netscape-format cookies file for age-restricted videos. Mount via Docker secret/volume.
LOG_LEVEL=info                        # Pino log level: trace|debug|info|warn|error|fatal (default: debug dev, info prod)
SITE_URL=https://stroygetter.fr       # Canonical base URL — sitemap, robots.txt, OpenGraph, JSON-LD (default: stroygetter.fr)
GOOGLE_SITE_VERIFICATION=<token>      # Google Search Console verification token
YANDEX_SITE_VERIFICATION=<token>      # Yandex Webmaster verification token
BING_SITE_VERIFICATION=<token>        # Bing Webmaster token (msvalidate.01)
UMAMI_URL=...                         # Self-hosted Umami instance base URL (script, recorder, API)
UMAMI_WEBSITE_ID=<id>                 # Umami website ID for stroygetter.fr
EMAIL_DMCA=dmca@...                   # DMCA contact email shown in legal pages
EMAIL_PRIVACY=privacy@...            # Privacy contact email shown in legal pages
BANNER_TEXT=...                       # Optional. Non-empty string enables the news banner. Empty or unset = hidden.
BANNER_HREF=/tiktok                   # Optional. Link for the banner (relative path or absolute URL). Omit for text-only.
```
