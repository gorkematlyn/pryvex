<p align="center">
  <strong>Pryvex</strong><br/>
  <em>The link layer for creators.</em>
</p>

Pryvex is a unified link-in-bio, link shortener, QR code, and first-party
analytics platform — a controlled identity, distribution, and analytics
layer for creators and brands, not just a page full of links.

## What it does

- **Link in Bio** — a drag-and-drop editor for a public `/{username}`
  profile page: avatar, bio, and reorderable link buttons with optional
  emoji, icon, or thumbnail, previewed live as you edit.
- **Link Shortener** — turn any URL into a short `/s/{slug}` link, with
  optional custom aliases and expiration dates.
- **QR Codes** — generate scannable, customizable QR codes for your
  profile, individual links, or short links.
- **Analytics** — a single first-party analytics engine behind all three
  surfaces: views, clicks, click-through rate, top links, referrers,
  device/browser/OS breakdowns, and — critically — which *channel*
  (bio page, short link, or QR code) drove each click.

That last point is the core idea: a creator distributes one destination
URL through three different channels, and Pryvex can tell them exactly
which one is working.

## How tracking works

Every outbound click is routed through a first-party tracked redirect
(`/go/{linkId}` or `/s/{slug}`) that resolves the destination, records an
analytics event, appends UTM parameters (without ever clobbering
parameters the destination URL already has), and redirects — all before
the visitor notices. No third-party analytics script required, and a
failed analytics write never blocks the redirect itself.

Analytics are privacy-conscious by design: no raw IP address is ever
stored. Each event gets a one-way hashed, day-bucketed visitor identifier,
just enough to distinguish "unique" visits without long-lived tracking.

## Tech stack

- **Next.js (App Router) + TypeScript** — one codebase for the dashboard,
  the public pages, and the tracked-redirect/OG-image routes
- **PostgreSQL** — plain SQL via `pg`, no ORM, no managed-platform lock-in
- **Custom auth** — bcrypt password hashing, stateless signed-JWT sessions
- **Tailwind CSS** — the dark, premium Pryvex design system (Shadow Black /
  Alloy / Cool Electric / Soft Ultraviolet), built around a wordmark whose
  "X" is designed as its own reusable, animatable brand mark
- **dnd-kit** — the drag-and-drop link editor

## Project layout

```
src/
  app/
    (auth)/            login, signup, forgot/reset password
    auth/               email verification + sign-out route handlers
    dashboard/          authenticated shell: editor, analytics, links, qr, settings
    [username]/         public bio page (SSR, minimal JS)
    go/[linkId]/        tracked link-in-bio redirect
    s/[slug]/           tracked short-link redirect
    api/og/[username]/  dynamic Open Graph image
  components/
    ui/                 buttons, inputs, cards, the Pryvex logo/X-mark
    editor/              drag-and-drop link editor
    bio/                 shared public-profile preview
    analytics/            stat tiles, chart, breakdown lists
    links/, qr/, settings/
  lib/
    db/                  Postgres connection pool + row types
    repo/                 one module per table — the only code that writes SQL
    auth/                  password hashing, sessions, one-time tokens, mailer
    domain/                URL validation, UTM building, tracking, analytics aggregation
migrations/                plain SQL schema, applied in order
```

## Local development

```bash
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate
npm run dev
```

Sign up at `/signup`. If SMTP isn't configured, the verification link is
printed to the terminal instead of emailed. Your public profile is live
immediately at `/{username}`.

Deployment instructions live in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## What's built

Auth → dashboard shell → drag-and-drop link-in-bio editor with live
preview → public profile rendering with SEO/OG → tracked redirects →
analytics → link shortener → QR codes. The public marketing site is
intentionally the last piece and hasn't been started yet.

## License

Source-available under a custom license — see [`LICENSE.md`](LICENSE.md).
In short: you're welcome to read, run, and modify the code, and
contributions are welcome. **Publishing the software or a derivative, and
any commercial use, requires prior written permission from the copyright
holder.**
