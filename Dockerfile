# syntax=docker.io/docker/dockerfile:1

FROM node:22-bookworm AS base

#install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# 1. Install dependencies only when needed
FROM base AS deps

# No need as we using debian based image
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
#RUN apt-get update && apt-get install -y libc6-compat

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi


# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# This will do the trick, use the corresponding env file for each environment.
#COPY .env.production.sample .env.production
RUN npm install --save @ffmpeg-installer/ffmpeg
RUN npm run build

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
RUN npm install --save @ffmpeg-installer/ffmpeg

RUN mkdir -p /stroygetter/tmp

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD HOSTNAME="0.0.0.0" node server.js