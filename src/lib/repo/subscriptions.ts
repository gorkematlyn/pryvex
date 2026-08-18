import { query, queryOne, withTransaction } from "@/lib/db/pool";
import type { PlanRow, SubscriptionRow, SubscriptionSource } from "@/lib/db/types";

export interface SubscriptionWithPlan extends SubscriptionRow {
  plan: PlanRow;
}

/**
 * The user's current subscription joined to its plan. Returns the row even
 * if it has passed `expires_at` — expiry is interpreted by the entitlement
 * layer so the UI can say "expired on …" rather than silently downgrading.
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
  const row = await queryOne<SubscriptionRow & { plan: PlanRow }>(
    `select s.*, to_jsonb(p.*) as plan
       from subscriptions s
       join plans p on p.id = s.plan_id
      where s.user_id = $1 and s.status = 'active'
      limit 1`,
    [userId],
  );
  return row;
}

export function listSubscriptionHistory(userId: string): Promise<SubscriptionWithPlan[]> {
  return query<SubscriptionRow & { plan: PlanRow }>(
    `select s.*, to_jsonb(p.*) as plan
       from subscriptions s
       join plans p on p.id = s.plan_id
      where s.user_id = $1
      order by s.created_at desc`,
    [userId],
  );
}

/**
 * Moves a user onto a plan: closes any existing active subscription and
 * opens a new one, atomically, so the `one active per user` partial unique
 * index can never be violated by a race.
 */
export async function assignPlan(input: {
  userId: string;
  planId: string;
  expiresAt: string | null;
  source: SubscriptionSource;
  note?: string | null;
}): Promise<SubscriptionRow> {
  return withTransaction(async (client) => {
    await client.query(
      "update subscriptions set status = 'cancelled' where user_id = $1 and status = 'active'",
      [input.userId],
    );
    const { rows } = await client.query<SubscriptionRow>(
      `insert into subscriptions (user_id, plan_id, status, expires_at, source, note)
       values ($1, $2, 'active', $3, $4, $5)
       returning *`,
      [input.userId, input.planId, input.expiresAt, input.source, input.note ?? null],
    );
    return rows[0];
  });
}

/** Pushes the expiry of the current subscription out by N days. */
export async function extendSubscription(userId: string, days: number): Promise<void> {
  await query(
    `update subscriptions
        set expires_at = coalesce(expires_at, now()) + make_interval(days => $2)
      where user_id = $1 and status = 'active'`,
    [userId, days],
  );
}

export async function setSubscriptionExpiry(userId: string, expiresAt: string | null): Promise<void> {
  await query("update subscriptions set expires_at = $2 where user_id = $1 and status = 'active'", [
    userId,
    expiresAt,
  ]);
}

/** Bulk-assign used by the admin "apply plan to many users" action. */
export async function assignPlanToUsers(input: {
  userIds: string[];
  planId: string;
  expiresAt: string | null;
  note?: string | null;
}): Promise<number> {
  if (input.userIds.length === 0) return 0;
  return withTransaction(async (client) => {
    await client.query(
      "update subscriptions set status = 'cancelled' where user_id = any($1::uuid[]) and status = 'active'",
      [input.userIds],
    );
    const { rowCount } = await client.query(
      `insert into subscriptions (user_id, plan_id, status, expires_at, source, note)
       select unnest($1::uuid[]), $2, 'active', $3, 'admin', $4`,
      [input.userIds, input.planId, input.expiresAt, input.note ?? null],
    );
    return rowCount ?? 0;
  });
}

/**
 * Moves every subscriber of one plan onto another — used when an admin
 * deletes a plan that still has active users, since `plan_id` is
 * `on delete restrict` and the delete would otherwise fail.
 */
export async function migrateSubscribers(fromPlanId: string, toPlanId: string): Promise<string[]> {
  const rows = await query<{ user_id: string }>(
    `update subscriptions
        set plan_id = $2, source = 'admin', note = 'migrated from a deleted plan', expires_at = null
      where plan_id = $1 and status = 'active'
      returning user_id`,
    [fromPlanId, toPlanId],
  );
  return rows.map((r) => r.user_id);
}

/** Lazily flips subscriptions whose expiry has passed. Safe to call often. */
export async function expireLapsedSubscriptions(): Promise<number> {
  const rows = await query<{ id: string }>(
    `update subscriptions set status = 'expired'
      where status = 'active' and expires_at is not null and expires_at < now()
      returning id`,
  );
  return rows.length;
}
