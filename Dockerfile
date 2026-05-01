# syntax=docker.io/docker/dockerfile:1

FROM node:22-bookworm AS base

#install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Enable pnpm via corepack
RUN corepack enable pnpm

# 1. Install dependencies only when needed
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY prisma ./prisma
# This will do the trick, use the corresponding env file for each environment.
#COPY .env.production.sample .env.production
RUN pnpm add @ffmpeg-installer/ffmpeg
RUN pnpm prisma migrate deploy
RUN pnpm prisma generate
RUN pnpm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

#Create nodejs group and nextjs user
RUN addgroup --system nodejs && adduser --system --ingroup nodejs nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
RUN pnpm add @ffmpeg-installer/ffmpeg
RUN pnpm add -D prisma
RUN pnpm add @prisma/client

RUN mkdir -p /temp/stroygetter
RUN mkdir -p /temp/stroygetter/source/
RUN mkdir -p /temp/stroygetter/cached/
RUN chown -R nextjs:nodejs /temp/stroygetter/

RUN pnpm prisma migrate deploy
RUN pnpm prisma generate

USER nextjs
EXPOSE 3000
ENV PORT=3000


CMD HOSTNAME="0.0.0.0" node server.js
