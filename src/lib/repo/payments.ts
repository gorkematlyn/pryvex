import { query, queryOne } from "@/lib/db/pool";
import type { PaymentProvider, PaymentRow, PaymentStatus } from "@/lib/db/types";

export async function createPendingPayment(input: {
  userId: string;
  planId: string;
  provider: PaymentProvider;
  merchantOid: string;
  amount: number;
  currency: string;
}): Promise<PaymentRow> {
  const row = await queryOne<PaymentRow>(
    `insert into payments (user_id, plan_id, provider, merchant_oid, amount, currency, status)
     values ($1, $2, $3, $4, $5, $6, 'pending')
     returning *`,
    [
      input.userId,
      input.planId,
      input.provider,
      input.merchantOid,
      input.amount,
      input.currency,
    ],
  );
  return row!;
}

export function getPaymentByMerchantOid(merchantOid: string): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>("select * from payments where merchant_oid = $1", [merchantOid]);
}

/**
 * Marks a payment settled. Only transitions out of 'pending', so a gateway
 * that delivers the same webhook twice (all of them retry) cannot grant a
 * second subscription for one purchase.
 */
export async function settlePayment(input: {
  merchantOid: string;
  status: PaymentStatus;
  providerRef?: string;
  raw: Record<string, unknown>;
}): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>(
    `update payments
        set status = $2, provider_ref = coalesce($3, provider_ref), raw = $4
      where merchant_oid = $1 and status = 'pending'
      returning *`,
    [input.merchantOid, input.status, input.providerRef ?? null, JSON.stringify(input.raw)],
  );
}

export function listPaymentsForUser(userId: string): Promise<PaymentRow[]> {
  return query<PaymentRow>(
    "select * from payments where user_id = $1 order by created_at desc limit 50",
    [userId],
  );
}

export interface PaymentWithUser extends PaymentRow {
  email: string | null;
  plan_name: string | null;
}

export function listRecentPayments(limit = 50): Promise<PaymentWithUser[]> {
  return query<PaymentWithUser>(
    `select p.*, u.email, pl.name as plan_name
       from payments p
       left join users u on u.id = p.user_id
       left join plans pl on pl.id = p.plan_id
      order by p.created_at desc
      limit $1`,
    [limit],
  );
}
