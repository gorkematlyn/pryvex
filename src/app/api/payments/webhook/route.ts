import { NextResponse } from "next/server";
import { getActivePaymentAdapter } from "@/lib/payments";
import { getPaymentByMerchantOid, settlePayment } from "@/lib/repo/payments";
import { getPlanById } from "@/lib/repo/plans";
import { assignPlan } from "@/lib/repo/subscriptions";
import { notifyUser } from "@/lib/repo/notifications";

// Signature verification needs the byte-exact body, so this must not run on
// a runtime that re-encodes it, and it must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const adapter = await getActivePaymentAdapter();
  if (!adapter) {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  const body = await request.text();

  // A payload whose signature does not verify is indistinguishable from a
  // forgery, so it is rejected before anything is read out of it.
  const event = await adapter.parseWebhook(request, body);
  if (!event) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payment = await getPaymentByMerchantOid(event.merchantOid);
  if (!payment) {
    // Acknowledge anyway: retrying will never make an unknown order appear,
    // and gateways treat a non-2xx as "keep retrying forever".
    return ack(event.ackBody);
  }

  const settled = await settlePayment({
    merchantOid: event.merchantOid,
    status: event.status,
    providerRef: event.providerRef,
    raw: event.raw,
  });

  // Null means it was already settled by an earlier delivery of the same
  // webhook — the subscription was granted then, so stop here.
  if (!settled) return ack(event.ackBody);

  if (event.status === "paid" && settled.user_id && settled.plan_id) {
    const plan = await getPlanById(settled.plan_id);
    if (plan) {
      const expiresAt =
        plan.duration_days && plan.duration_days > 0
          ? new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString()
          : null;

      await assignPlan({
        userId: settled.user_id,
        planId: plan.id,
        expiresAt,
        source: "payment",
        note: `${adapter.name} ${event.merchantOid}`,
      });

      await notifyUser(settled.user_id, {
        title: `You're on ${plan.name}`,
        body: expiresAt
          ? `Payment received. Your plan is active until ${new Date(expiresAt).toLocaleDateString()}.`
          : "Payment received. Your plan is active.",
        level: "success",
        actionUrl: "/dashboard/billing",
      });
    }
  }

  return ack(event.ackBody);
}

/** PayTR requires the literal body "OK"; the others accept any 2xx. */
function ack(ackBody?: string): Response {
  if (ackBody) {
    return new Response(ackBody, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return NextResponse.json({ received: true });
}
