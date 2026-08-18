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

# Migrations run automatically on every container start, before the server
# takes traffic. scripts/migrate.mjs is idempotent (tracks applied files in
# a _migrations table), so this is a no-op on restarts and safe to run every
# deploy — a fresh migration file is the only time it does real work. If it
# fails (e.g. the database is unreachable), `&&` stops the server from
# starting on a broken schema; `exec` hands over PID 1 so Docker's stop
# signal still reaches server.js directly for a clean shutdown.
CMD ["sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
