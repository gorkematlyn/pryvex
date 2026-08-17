# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# ---- dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public env vars must be present at build time — Next.js inlines
# NEXT_PUBLIC_* values into the client bundle during `next build`.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runtime ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output already contains a self-contained node_modules —
# Next.js traces every server-side import (including `pg`, used by
# src/lib/db/pool.ts) and bundles just what's needed, so no manual
# dependency copying is required here. scripts/migrate.mjs reuses that
# same bundled `pg` install.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts

USER nextjs
EXPOSE 3000

# `db:migrate` (scripts/migrate.mjs) is idempotent — run it once against
# DATABASE_URL before or after the first deploy, e.g. via `docker exec`
# or a Dokploy pre-deploy command: `node scripts/migrate.mjs`.
CMD ["node", "server.js"]
