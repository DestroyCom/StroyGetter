# syntax=docker/dockerfile:1.7

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable pnpm

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

# ── runner ───────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

# Next.js standalone bundle + static assets + Prisma schema
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# dotenv is required by prisma.config.ts at migrate-deploy time
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

# yt-dlp binary (required at runtime by selectYtDlpPath())
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/youtube-dl-exec/bin/yt-dlp \
    ./node_modules/youtube-dl-exec/bin/yt-dlp

# prisma CLI (required by entrypoint to run migrate deploy at startup)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p /temp/stroygetter/source /temp/stroygetter/cached \
    && chown -R nextjs:nodejs /temp/stroygetter/

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER nextjs
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
