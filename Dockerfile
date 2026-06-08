# syntax=docker/dockerfile:1.7

# ── base ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine3.21 AS base
RUN apk add --no-cache ffmpeg python3
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .ytdlp-version .gallery-dl-version ./
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

RUN apk add --no-cache ffmpeg python3 py3-pip su-exec
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Next.js standalone + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# ── yt-dlp ───────────────────────────────────────────────────────────────────
COPY .ytdlp-version .ytdlp-version
RUN YTDLP_VERSION=$(cat .ytdlp-version | tr -d '[:space:]') && \
    pip3 install --no-cache-dir --break-system-packages "yt-dlp==${YTDLP_VERSION}" && \
    mkdir -p node_modules/youtube-dl-exec/bin && \
    cp "$(which yt-dlp)" node_modules/youtube-dl-exec/bin/yt-dlp && \
    chown nextjs:nodejs node_modules/youtube-dl-exec/bin/yt-dlp && \
    chmod +x node_modules/youtube-dl-exec/bin/yt-dlp && \
    echo "yt-dlp ready: $(yt-dlp --version)" && \
    rm .ytdlp-version
RUN pip3 install --no-cache-dir --break-system-packages -U bgutil-ytdlp-pot-provider

# ── gallery-dl ───────────────────────────────────────────────────────────────
COPY .gallery-dl-version .gallery-dl-version
RUN GALLERY_DL_VERSION=$(cat .gallery-dl-version) && \
    pip3 install --no-cache-dir --break-system-packages "gallery-dl==${GALLERY_DL_VERSION}" && \
    mkdir -p .next/server/bin && \
    cp "$(which gallery-dl)" .next/server/bin/gallery-dl && \
    chown nextjs:nodejs .next/server/bin/gallery-dl && \
    chmod +x .next/server/bin/gallery-dl && \
    echo "gallery-dl ready: $(gallery-dl --version)" && \
    rm .gallery-dl-version

# ── pino worker-thread dependencies ──────────────────────────────────────────
# Turbopack (Next.js ≥16.1, PR #86375) writes symlinks pour les
# serverExternalPackages dans .next/node_modules/<pkg>-<hash>@ qui pointent
# vers node_modules/.pnpm/… — ces chemins n'existent pas dans le standalone.
# Fix : copier les vrais fichiers dans node_modules flat ET dans .pnpm/node_modules/
# pour couvrir les deux chemins de résolution possibles.
#
# real-require : @0.2.0 est un symlink pnpm sans src/ dans le builder,
# on copie @1.0.0 (fichiers réels) vers les deux destinations attendues.
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/pino-abstract-transport@3.0.0/node_modules/pino-abstract-transport \
    ./node_modules/pino-abstract-transport
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/split2@4.2.0/node_modules/split2 \
    ./node_modules/split2
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/real-require@1.0.0/node_modules/real-require \
    ./node_modules/real-require
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/real-require@1.0.0/node_modules/real-require \
    ./node_modules/.pnpm/real-require@0.2.0/node_modules/real-require
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/real-require@1.0.0/node_modules/real-require \
    ./node_modules/.pnpm/node_modules/real-require
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/sonic-boom@4.2.1/node_modules/sonic-boom \
    ./node_modules/sonic-boom
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/thread-stream@4.2.0/node_modules/thread-stream \
    ./node_modules/thread-stream
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/on-exit-leak-free@2.1.2/node_modules/on-exit-leak-free \
    ./node_modules/on-exit-leak-free
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/atomic-sleep@1.0.0/node_modules/atomic-sleep \
    ./node_modules/atomic-sleep
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/pino-std-serializers@7.1.0/node_modules/pino-std-serializers \
    ./node_modules/pino-std-serializers
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/quick-format-unescaped@4.0.4/node_modules/quick-format-unescaped \
    ./node_modules/quick-format-unescaped
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/safe-stable-stringify@2.5.0/node_modules/safe-stable-stringify \
    ./node_modules/safe-stable-stringify
COPY --from=builder --chown=nextjs:nodejs \
    /app/node_modules/.pnpm/process-warning@5.0.0/node_modules/process-warning \
    ./node_modules/process-warning

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