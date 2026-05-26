# syntax=docker/dockerfile:1.7

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine3.21 AS base
RUN apk add --no-cache ffmpeg python3
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .ytdlp-version ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Explicitly download the correct yt-dlp binary for this platform/arch.
# The youtube-dl-exec postinstall runs inside the pnpm cache layer and can
# write a "Not Found" placeholder if the GitHub download fails or is rate-
# limited. This RUN always overwrites that file with the real binary.
RUN YTDLP_VERSION=$(cat .ytdlp-version) && \
    case "$(uname -m)" in \
      aarch64) YTDLP_FILE="yt-dlp_linux_aarch64" ;; \
      armv7l)  YTDLP_FILE="yt-dlp_linux_armv7l"  ;; \
      *)       YTDLP_FILE="yt-dlp_linux"          ;; \
    esac && \
    echo "Downloading yt-dlp ${YTDLP_VERSION} (${YTDLP_FILE})..." && \
    wget -q -O node_modules/youtube-dl-exec/bin/yt-dlp \
      "https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/${YTDLP_FILE}" && \
    chmod +x node_modules/youtube-dl-exec/bin/yt-dlp && \
    echo "yt-dlp downloaded: $(node_modules/youtube-dl-exec/bin/yt-dlp --version)"

# ── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:22-alpine3.21 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache ffmpeg python3 su-exec
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# yt-dlp binary (resolved at runtime by selectYtDlpPath())
COPY --from=deps --chown=nextjs:nodejs \
    /app/node_modules/youtube-dl-exec/bin/yt-dlp \
    ./node_modules/youtube-dl-exec/bin/yt-dlp

# ── pino worker-thread dependencies ──────────────────────────────────────────
# Turbopack (Next.js ≥16.1, PR #86375) writes symlinks for transitive
# serverExternalPackages into .next/node_modules/<pkg>-<hash>@ that point
# back four levels to the original node_modules/.pnpm/… tree.  Those symlink
# targets do NOT exist in the standalone image, so the worker threads crash
# with "Cannot find module 'pino-abstract-transport'" at runtime.
#
# Fix: copy the real package files directly into the flat node_modules so
# Node's resolver can always find them, regardless of the pnpm layout.
#
# Version pinned to what pnpm-lock.yaml resolves.  If a bump breaks this
# COPY (path not found), update the version from `pnpm list pino-abstract-transport`.
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/pino-abstract-transport@3.0.0/node_modules/pino-abstract-transport \
    ./node_modules/pino-abstract-transport

# Migration tooling in an isolated directory (avoids conflicts with standalone)
COPY --from=builder /app/node_modules   /migrate/node_modules
COPY --from=builder /app/prisma         /migrate/prisma
COPY --from=builder /app/prisma.config.ts /migrate/prisma.config.ts

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
