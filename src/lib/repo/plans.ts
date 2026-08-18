import { query, queryOne } from "@/lib/db/pool";
import type { PlanRow } from "@/lib/db/types";

export const FREE_PLAN_ID = "00000000-0000-0000-0000-000000000001";

export function listPlans(): Promise<PlanRow[]> {
  return query<PlanRow>("select * from plans order by position, price_amount, created_at");
}

export function listActivePublicPlans(): Promise<PlanRow[]> {
  return query<PlanRow>(
    "select * from plans where is_active = true and is_public = true order by position, price_amount",
  );
}

export function getPlanById(id: string): Promise<PlanRow | null> {
  return queryOne<PlanRow>("select * from plans where id = $1", [id]);
}

export function getPlanBySlug(slug: string): Promise<PlanRow | null> {
  return queryOne<PlanRow>("select * from plans where slug = $1", [slug]);
}

export interface PlanInput {
  slug: string;
  name: string;
  description: string | null;
  price_amount: number;
  price_currency: string;
  billing_period: string;
  duration_days: number | null;
  features: Record<string, boolean>;
  limits: Record<string, number>;
  is_active: boolean;
  is_public: boolean;
  position: number;
}

export async function createPlan(input: PlanInput): Promise<PlanRow> {
  const row = await queryOne<PlanRow>(
    `insert into plans
       (slug, name, description, price_amount, price_currency, billing_period,
        duration_days, features, limits, is_active, is_public, position)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning *`,
    [
      input.slug,
      input.name,
      input.description,
      input.price_amount,
      input.price_currency,
      input.billing_period,
      input.duration_days,
      JSON.stringify(input.features),
      JSON.stringify(input.limits),
      input.is_active,
      input.is_public,
      input.position,
    ],
  );
  return row!;
}

export async function updatePlan(id: string, input: PlanInput): Promise<void> {
  await query(
    `update plans set
       slug = $2, name = $3, description = $4, price_amount = $5,
       price_currency = $6, billing_period = $7, duration_days = $8,
       features = $9, limits = $10, is_active = $11, is_public = $12, position = $13
     where id = $1`,
    [
      id,
      input.slug,
      input.name,
      input.description,
      input.price_amount,
      input.price_currency,
      input.billing_period,
      input.duration_days,
      JSON.stringify(input.features),
      JSON.stringify(input.limits),
      input.is_active,
      input.is_public,
      input.position,
    ],
  );
}

export async function deletePlan(id: string): Promise<void> {
  await query("delete from plans where id = $1 and is_system = false", [id]);
}

/** How many accounts are currently on a plan — drives the delete warning. */
export async function countActiveSubscribers(planId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from subscriptions where plan_id = $1 and status = 'active'",
    [planId],
  );
  return Number(row?.count ?? 0);
}

export async function countSubscribersByPlan(): Promise<Record<string, number>> {
  const rows = await query<{ plan_id: string; count: string }>(
    "select plan_id, count(*)::text as count from subscriptions where status = 'active' group by plan_id",
  );
  return Object.fromEntries(rows.map((r) => [r.plan_id, Number(r.count)]));
}
