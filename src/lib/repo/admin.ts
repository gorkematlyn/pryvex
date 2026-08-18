import { query, queryOne } from "@/lib/db/pool";
import type { UserRole } from "@/lib/db/types";

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  created_at: string;
  username: string | null;
  display_name: string | null;
  plan_id: string | null;
  plan_name: string | null;
  plan_slug: string | null;
  plan_price: number | null;
  subscription_status: string | null;
  expires_at: string | null;
}

export interface UserListFilter {
  search?: string;
  planId?: string;
  role?: UserRole;
  status?: "active" | "expiring" | "expired";
  limit?: number;
  offset?: number;
}

/**
 * Users joined to their active subscription and plan. `left join` on the
 * subscription so an account without one (should not happen, but the DB
 * permits it) still appears in the admin list rather than vanishing.
 */
export async function listUsers(
  filter: UserListFilter = {},
): Promise<{ items: AdminUserListItem[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filter.search) {
    params.push(`%${filter.search}%`);
    conditions.push(`(u.email ilike $${params.length} or p.username ilike $${params.length} or p.display_name ilike $${params.length})`);
  }
  if (filter.planId) {
    params.push(filter.planId);
    conditions.push(`s.plan_id = $${params.length}`);
  }
  if (filter.role) {
    params.push(filter.role);
    conditions.push(`u.role = $${params.length}`);
  }
  if (filter.status === "expired") {
    conditions.push(`(s.expires_at is not null and s.expires_at < now())`);
  } else if (filter.status === "expiring") {
    conditions.push(`(s.expires_at is not null and s.expires_at between now() and now() + interval '7 days')`);
  } else if (filter.status === "active") {
    conditions.push(`(s.expires_at is null or s.expires_at >= now())`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const countRow = await queryOne<{ count: string }>(
    `select count(*)::text as count
       from users u
       left join profiles p on p.id = u.id
       left join subscriptions s on s.user_id = u.id and s.status = 'active'
       ${where}`,
    params,
  );

  const limit = filter.limit ?? 50;
  const offset = filter.offset ?? 0;
  params.push(limit, offset);

  const items = await query<AdminUserListItem>(
    `select u.id, u.email, u.role, u.email_verified_at, u.created_at,
            p.username, p.display_name,
            s.plan_id, s.status as subscription_status, s.expires_at,
            pl.name as plan_name, pl.slug as plan_slug, pl.price_amount as plan_price
       from users u
       left join profiles p on p.id = u.id
       left join subscriptions s on s.user_id = u.id and s.status = 'active'
       left join plans pl on pl.id = s.plan_id
       ${where}
      order by u.created_at desc
      limit $${params.length - 1} offset $${params.length}`,
    params,
  );

  return { items, total: Number(countRow?.count ?? 0) };
}

export interface AdminUserDetail extends AdminUserListItem {
  bio: string | null;
  avatar_url: string | null;
  link_count: number;
  short_link_count: number;
  qr_code_count: number;
  total_events: number;
}

export function getUserDetail(userId: string): Promise<AdminUserDetail | null> {
  return queryOne<AdminUserDetail>(
    `select u.id, u.email, u.role, u.email_verified_at, u.created_at,
            p.username, p.display_name, p.bio, p.avatar_url,
            s.plan_id, s.status as subscription_status, s.expires_at,
            pl.name as plan_name, pl.slug as plan_slug, pl.price_amount as plan_price,
            (select count(*) from links l where l.profile_id = u.id)::int as link_count,
            (select count(*) from short_links sl where sl.profile_id = u.id)::int as short_link_count,
            (select count(*) from qr_codes q where q.profile_id = u.id)::int as qr_code_count,
            (select count(*) from link_events e where e.profile_id = u.id)::int as total_events
       from users u
       left join profiles p on p.id = u.id
       left join subscriptions s on s.user_id = u.id and s.status = 'active'
       left join plans pl on pl.id = s.plan_id
      where u.id = $1`,
    [userId],
  );
}

/** Resolves a target audience for bulk actions to a plain list of user ids. */
export async function resolveAudience(audience: {
  scope: "all" | "plan" | "selected";
  planId?: string;
  userIds?: string[];
}): Promise<string[]> {
  if (audience.scope === "selected") return audience.userIds ?? [];
  if (audience.scope === "plan" && audience.planId) {
    const rows = await query<{ user_id: string }>(
      "select user_id from subscriptions where plan_id = $1 and status = 'active'",
      [audience.planId],
    );
    return rows.map((r) => r.user_id);
  }
  const rows = await query<{ id: string }>("select id from users");
  return rows.map((r) => r.id);
}

export async function setUserRole(userId: string, role: UserRole): Promise<void> {
  await query("update users set role = $2 where id = $1", [userId, role]);
}

export async function countSuperAdmins(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from users where role = 'super_admin'",
  );
  return Number(row?.count ?? 0);
}

export interface AdminOverviewStats {
  total_users: number;
  new_users_7d: number;
  verified_users: number;
  paid_subscribers: number;
  expiring_7d: number;
  open_tickets: number;
  total_events_30d: number;
  revenue_30d: number;
}

export async function getOverviewStats(): Promise<AdminOverviewStats> {
  const row = await queryOne<AdminOverviewStats>(
    `select
       (select count(*) from users)::int as total_users,
       (select count(*) from users where created_at > now() - interval '7 days')::int as new_users_7d,
       (select count(*) from users where email_verified_at is not null)::int as verified_users,
       (select count(*) from subscriptions s join plans p on p.id = s.plan_id
         where s.status = 'active' and p.price_amount > 0)::int as paid_subscribers,
       (select count(*) from subscriptions
         where status = 'active' and expires_at between now() and now() + interval '7 days')::int as expiring_7d,
       (select count(*) from support_tickets where status in ('open','pending'))::int as open_tickets,
       (select count(*) from link_events where created_at > now() - interval '30 days')::int as total_events_30d,
       (select coalesce(sum(amount), 0) from payments
         where status = 'paid' and created_at > now() - interval '30 days')::numeric as revenue_30d`,
  );
  return (
    row ?? {
      total_users: 0,
      new_users_7d: 0,
      verified_users: 0,
      paid_subscribers: 0,
      expiring_7d: 0,
      open_tickets: 0,
      total_events_30d: 0,
      revenue_30d: 0,
    }
  );
}

export async function logAdminAction(input: {
  actorUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await query(
    "insert into admin_audit_log (actor_user_id, action, target_type, target_id, detail) values ($1, $2, $3, $4, $5)",
    [
      input.actorUserId,
      input.action,
      input.targetType ?? null,
      input.targetId ?? null,
      JSON.stringify(input.detail ?? {}),
    ],
  );
}

export interface AuditLogEntry {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
  actor_email: string | null;
}

export function listAuditLog(limit = 50): Promise<AuditLogEntry[]> {
  return query<AuditLogEntry>(
    `select a.id, a.action, a.target_type, a.target_id, a.detail, a.created_at, u.email as actor_email
       from admin_audit_log a
       left join users u on u.id = a.actor_user_id
      order by a.created_at desc
      limit $1`,
    [limit],
  );
}
