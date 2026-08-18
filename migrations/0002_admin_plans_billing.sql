-- Pryvex admin, plans/entitlements, billing, notifications and support layer.
--
-- Design notes:
--  * Plan capabilities live in `plans.features` (boolean flags) and
--    `plans.limits` (numeric caps, -1 = unlimited) as JSONB rather than as
--    columns, because the catalogue of gateable features is defined in code
--    (src/lib/domain/features.ts) and grows with the product. Adding a
--    feature must not require a migration.
--  * Exactly one subscription per user may be 'active' at a time, enforced
--    by a partial unique index rather than by application discipline.
--  * The seeded Free plan uses a fixed UUID so app_settings can reference
--    it deterministically at seed time, and is flagged is_system so the
--    admin UI can refuse to delete it.

-- =========================================================
-- users.role — 'user' | 'admin' | 'super_admin'
-- =========================================================
alter table public.users
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_role_check'
  ) then
    alter table public.users
      add constraint users_role_check check (role in ('user', 'admin', 'super_admin'));
  end if;
end $$;

create index if not exists users_role_idx on public.users (role) where role <> 'user';

-- =========================================================
-- plans: the sellable packages + their entitlements
-- =========================================================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_amount numeric(10, 2) not null default 0,
  price_currency text not null default 'USD',
  billing_period text not null default 'monthly'
    check (billing_period in ('free', 'monthly', 'yearly', 'lifetime')),
  duration_days integer,               -- null = no expiry (free / lifetime)
  features jsonb not null default '{}'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_public boolean not null default true,   -- shown on pricing/upgrade UI
  is_system boolean not null default false,  -- cannot be deleted (the Free plan)
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists plans_active_position_idx on public.plans (is_active, position);

alter table public.plans
  drop constraint if exists plans_slug_format;
alter table public.plans
  add constraint plans_slug_format check (slug ~ '^[a-z0-9_-]{2,40}$');

-- =========================================================
-- subscriptions: which plan a user is on, and until when
-- =========================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,              -- null = never expires
  source text not null default 'signup'
    check (source in ('signup', 'admin', 'payment')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_active_per_user
  on public.subscriptions (user_id) where status = 'active';
create index if not exists subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_expires_at_idx on public.subscriptions (expires_at)
  where status = 'active';

-- =========================================================
-- payments: transaction history from the configured gateway
-- =========================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users (id) on delete set null,
  plan_id uuid references public.plans (id) on delete set null,
  provider text not null check (provider in ('paytr', 'paypal', 'stripe', 'manual')),
  provider_ref text,
  merchant_oid text unique,            -- our own order id handed to the gateway
  amount numeric(10, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_created_at_idx on public.payments (user_id, created_at desc);
create index if not exists payments_status_idx on public.payments (status);

-- =========================================================
-- notifications: in-app messages, individually or in bulk
-- =========================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  body text not null,
  level text not null default 'info' check (level in ('info', 'success', 'warning', 'critical')),
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

-- =========================================================
-- support tickets + threaded messages
-- =========================================================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'pending', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id);
create index if not exists support_tickets_status_idx on public.support_tickets (status, last_message_at desc);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_user_id uuid references public.users (id) on delete set null,
  is_staff boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages (ticket_id, created_at);

-- =========================================================
-- app_settings: singleton key/value config owned by admins
-- =========================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- admin_audit_log: who changed what, from the admin panel
-- =========================================================
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

-- =========================================================
-- user_settings: discoverability + per-user integration keys
-- =========================================================
alter table public.user_settings
  add column if not exists search_engine_visible boolean not null default true,
  add column if not exists llm_visible boolean not null default true,
  add column if not exists google_analytics_id text,
  add column if not exists meta_pixel_id text,
  add column if not exists meta_conversion_api_token text;

-- =========================================================
-- updated_at triggers for the new mutable tables
-- =========================================================
drop trigger if exists set_updated_at on public.plans;
create trigger set_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.subscriptions;
create trigger set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.payments;
create trigger set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.support_tickets;
create trigger set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

-- =========================================================
-- Seed: the system Free plan (fixed id so settings can reference it)
-- =========================================================
insert into public.plans (
  id, slug, name, description,
  price_amount, price_currency, billing_period, duration_days,
  features, limits, is_active, is_public, is_system, position
) values (
  '00000000-0000-0000-0000-000000000001',
  'free',
  'Free',
  'Everything you need to publish a page and start measuring.',
  0, 'USD', 'free', null,
  jsonb_build_object(
    'bio_page', true,
    'bio_emoji', true,
    'bio_icons', true,
    'bio_thumbnails', false,
    'bio_button_styles', false,
    'bio_themes', false,
    'bio_background', false,
    'bio_typography', false,
    'bio_seo_meta', false,
    'bio_app_links', false,
    'bio_hide_branding', false,
    'short_links', true,
    'short_link_custom_alias', false,
    'short_link_expiration', false,
    'qr_codes', true,
    'qr_customization', false,
    'qr_logo', false,
    'qr_svg_export', false,
    'analytics_basic', true,
    'analytics_breakdowns', false,
    'analytics_referrers', false,
    'analytics_export', false,
    'utm_configuration', false,
    'integration_google_analytics', false,
    'integration_meta_pixel', false,
    'integration_meta_capi', false,
    'search_engine_control', true,
    'support_tickets', true,
    'priority_support', false,
    'custom_domain', false
  ),
  jsonb_build_object(
    'max_links', 5,
    'max_short_links', 3,
    'max_qr_codes', 2,
    'analytics_retention_days', 7
  ),
  true, true, true, 0
) on conflict (id) do nothing;

-- =========================================================
-- Seed: default app settings
-- =========================================================
insert into public.app_settings (key, value) values
  ('signup', jsonb_build_object(
    'default_plan_id', '00000000-0000-0000-0000-000000000001',
    'default_duration_days', null
  )),
  ('payments', jsonb_build_object(
    'provider', 'none',
    'paytr', jsonb_build_object('merchant_id', '', 'merchant_key', '', 'merchant_salt', '', 'test_mode', true),
    'paypal', jsonb_build_object('client_id', '', 'client_secret', '', 'sandbox', true),
    'stripe', jsonb_build_object('publishable_key', '', 'secret_key', '', 'webhook_secret', '')
  )),
  ('branding', jsonb_build_object(
    'support_email', ''
  ))
on conflict (key) do nothing;

-- =========================================================
-- Backfill: put every existing user on the Free plan
-- =========================================================
insert into public.subscriptions (user_id, plan_id, status, source, note)
select u.id, '00000000-0000-0000-0000-000000000001', 'active', 'signup', 'backfilled by migration 0002'
from public.users u
where not exists (
  select 1 from public.subscriptions s where s.user_id = u.id and s.status = 'active'
);
