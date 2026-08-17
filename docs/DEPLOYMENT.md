# Deployment

The app ships as a standard multi-stage `Dockerfile` producing a Next.js
["standalone"](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
server — no persistent filesystem writes, so it's a stateless container
that can run on any Docker host (a PaaS like Dokploy/Coolify, a raw VPS,
or any container platform) alongside a PostgreSQL 14+ instance.

## Requirements

- A running PostgreSQL 14+ database, reachable from the app container
- Environment variables (see `.env.example`):
  - `DATABASE_URL` — Postgres connection string
  - `AUTH_SECRET` — random secret for signing session JWTs (`openssl rand -base64 32`)
  - `NEXT_PUBLIC_APP_URL` — the app's public URL (also required at **build time**,
    since Next.js inlines `NEXT_PUBLIC_*` values into the client bundle —
    pass it as the `NEXT_PUBLIC_APP_URL` Docker build arg)
  - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` —
    optional; without these, verification/reset emails are logged to the
    server console instead of sent, which is fine for a first smoke test
    but not for real users

## Steps

1. **Provision Postgres** somewhere reachable from the app container.
2. **Build and run the image** from the `Dockerfile`, on port 3000
   (`EXPOSE 3000` / `PORT=3000`), with the environment variables above set.
3. **Run migrations once** against `DATABASE_URL`, from a shell inside the
   running container (or any machine that can reach the database):
   ```bash
   node scripts/migrate.mjs
   ```
   It's idempotent (tracks applied migrations in a `_migrations` table),
   so it's safe to run again on every subsequent deploy.
4. **Point your domain** at the app and enable HTTPS. Update
   `NEXT_PUBLIC_APP_URL` to match and redeploy — every tracked URL
   (`/go`, `/s`, OG images, UTM `utm_campaign`, email links) is built from
   that single env var.

## Local Docker smoke test

`docker-compose.yml` spins up Postgres + the built image together for a
quick end-to-end check before deploying anywhere:

```bash
docker compose up --build
# in another shell, once the app is healthy:
docker compose exec app node scripts/migrate.mjs
```

Then open `http://localhost:3000`.

## Verifying the tracked redirect system

1. In the dashboard, add a link and open the public profile in an
   incognito tab.
2. Click the link — you should land on the destination URL with
   `utm_source=pryvex&utm_medium=link_in_bio&...` appended (unless the
   destination already had those params, which are never overwritten).
3. Back in **Analytics**, the click should appear within a few seconds
   (there is no queue — the write happens via `after()` on the same
   request).
4. Repeat for a short link (`/s/{slug}`) and a QR code (scan or open the
   `?qr={id}` URL directly) — each should attribute to the correct
   `traffic_source` (Link in Bio / Short Link / QR Code) in the
   **Traffic source** breakdown.

## Verifying generated Open Graph images

Visit `/api/og/{username}` directly — it should render a 1200×630 PNG on
a Shadow Black background with the profile's avatar, name, and bio.
Paste a public profile URL into a social debugger (e.g. an OG/Twitter
Card previewer) to confirm the metadata from `generateMetadata()` in
`src/app/[username]/page.tsx` resolves correctly once the app is deployed
on a public URL (OG scrapers can't reach `localhost`).
