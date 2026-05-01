# syntax=docker/dockerfile:1.7

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine3.21 AS base
RUN apk add --no-cache ffmpeg python3
RUN corepack enable && corepack prepare pnpm@latest --activate

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
FROM node:22-alpine3.21 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache ffmpeg python3
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# yt-dlp binary (resolved at runtime by selectYtDlpPath())
COPY --from=deps --chown=nextjs:nodejs \
    /app/node_modules/youtube-dl-exec/bin/yt-dlp \
    ./node_modules/youtube-dl-exec/bin/yt-dlp

# Migration tooling in an isolated directory (avoids conflicts with standalone)
COPY --from=builder /app/node_modules   /migrate/node_modules
COPY --from=builder /app/prisma         /migrate/prisma
COPY --from=builder /app/prisma.config.ts /migrate/prisma.config.ts
RUN chown -R nextjs:nodejs /migrate

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN mkdir -p /temp/stroygetter/source /temp/stroygetter/cached \
    && chown -R nextjs:nodejs /temp/stroygetter/

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

USER nextjs
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
