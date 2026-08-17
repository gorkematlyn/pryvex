-- Pryvex core schema — plain PostgreSQL, no platform-specific extensions
-- beyond pgcrypto (for gen_random_uuid()). Authorization is enforced in
-- the application layer (every query is scoped by owner id), since there
-- is no request-scoped JWT/session context inside Postgres itself here.

create extension if not exists "pgcrypto";

-- =========================================================
-- users: account/credentials. Owns everything else.
-- =========================================================
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (lower(email));

-- =========================================================
-- auth_tokens: one-time tokens for email verification and
-- password reset. Only a SHA-256 hash of the token is stored.
-- =========================================================
create table if not exists public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token_hash text not null unique,
  type text not null check (type in ('email_verify', 'password_reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_tokens_user_id_idx on public.auth_tokens (user_id);

-- =========================================================
-- profiles: one per user, public-readable identity
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references public.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

alter table public.profiles
  add constraint profiles_username_format
  check (username ~ '^[a-z0-9_-]{3,30}$');

-- =========================================================
-- themes: preset (profile_id null) or user-owned custom themes
-- =========================================================
create table if not exists public.themes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  config jsonb not null default '{}'::jsonb,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists themes_profile_id_idx on public.themes (profile_id);

-- =========================================================
-- bio_pages: one primary bio page per profile today; schema
-- allows multiple pages per profile in the future.
-- =========================================================
create table if not exists public.bio_pages (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  is_primary boolean not null default true,
  is_published boolean not null default true,
  theme_id uuid references public.themes (id) on delete set null,
  theme_overrides jsonb not null default '{}'::jsonb,
  background jsonb not null default '{}'::jsonb,
  typography jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bio_pages_one_primary_per_profile
  on public.bio_pages (profile_id) where is_primary = true;
create index if not exists bio_pages_profile_id_idx on public.bio_pages (profile_id);

-- =========================================================
-- links: content blocks on a bio page (button-style link today)
-- =========================================================
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  bio_page_id uuid not null references public.bio_pages (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  block_type text not null default 'link' check (block_type in ('link')),
  title text not null,
  url text not null,
  emoji text,
  icon text,
  thumbnail_url text,
  style jsonb not null default '{}'::jsonb,
  utm_overrides jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists links_bio_page_id_position_idx on public.links (bio_page_id, position);
create index if not exists links_profile_id_idx on public.links (profile_id);

-- =========================================================
-- short_links: pryvex.com/s/{slug}
-- =========================================================
create table if not exists public.short_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  destination_url text not null,
  utm_overrides jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists short_links_slug_idx on public.short_links (lower(slug));
create index if not exists short_links_profile_id_idx on public.short_links (profile_id);

alter table public.short_links
  add constraint short_links_slug_format
  check (slug ~ '^[a-zA-Z0-9_-]{3,40}$');

-- =========================================================
-- qr_codes: encode a profile / link / short_link / custom URL
-- =========================================================
create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'link', 'short_link', 'custom')),
  target_link_id uuid references public.links (id) on delete cascade,
  target_short_link_id uuid references public.short_links (id) on delete cascade,
  custom_url text,
  label text,
  style jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists qr_codes_profile_id_idx on public.qr_codes (profile_id);

-- =========================================================
-- link_events: unified analytics event log
-- =========================================================
create table if not exists public.link_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('profile_view', 'link_click', 'short_link_click', 'qr_scan')),
  link_id uuid references public.links (id) on delete set null,
  short_link_id uuid references public.short_links (id) on delete set null,
  qr_code_id uuid references public.qr_codes (id) on delete set null,
  traffic_source text not null default 'direct' check (traffic_source in ('bio_page', 'short_link', 'qr_code', 'direct')),
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  device_category text,
  browser text,
  os text,
  country text,
  visitor_id text,
  created_at timestamptz not null default now()
);

create index if not exists link_events_profile_id_created_at_idx on public.link_events (profile_id, created_at desc);
create index if not exists link_events_link_id_idx on public.link_events (link_id);
create index if not exists link_events_short_link_id_idx on public.link_events (short_link_id);
create index if not exists link_events_qr_code_id_idx on public.link_events (qr_code_id);
create index if not exists link_events_event_type_created_at_idx on public.link_events (event_type, created_at desc);

-- =========================================================
-- user_settings: per-account defaults
-- =========================================================
create table if not exists public.user_settings (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  default_utm_source text not null default 'pryvex',
  default_utm_medium text not null default 'link_in_bio',
  auto_utm_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- updated_at triggers
-- =========================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.users;
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.bio_pages;
create trigger set_updated_at before update on public.bio_pages
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.links;
create trigger set_updated_at before update on public.links
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.short_links;
create trigger set_updated_at before update on public.short_links
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.user_settings;
create trigger set_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();
