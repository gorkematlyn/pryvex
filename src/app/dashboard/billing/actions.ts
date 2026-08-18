"use server";

import { headers } from "next/headers";
import { requireProfile } from "@/lib/domain/current-user";
import { getActivePaymentAdapter, generateMerchantOid } from "@/lib/payments";
import { getPlanById } from "@/lib/repo/plans";
import { createPendingPayment } from "@/lib/repo/payments";
import { findUserById } from "@/lib/repo/users";

export type CheckoutActionResult =
  | { kind: "redirect"; url: string }
  | { kind: "iframe"; url: string }
  | { kind: "error"; message: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function startCheckout(planId: string): Promise<CheckoutActionResult> {
  const { userId } = await requireProfile();

  const adapter = await getActivePaymentAdapter();
  if (!adapter) return { kind: "error", message: "Payments are not available right now." };

  const [plan, user] = await Promise.all([getPlanById(planId), findUserById(userId)]);
  if (!plan || !plan.is_active || !plan.is_public) {
    return { kind: "error", message: "That plan is not available." };
  }
  if (!user) return { kind: "error", message: "Account not found." };

  // Free plans never go through a gateway — charging 0 fails at most of them
  // and there is nothing to settle.
  if (plan.price_amount <= 0) {
    return { kind: "error", message: "That plan is free — no payment is needed." };
  }

  const merchantOid = generateMerchantOid();

  // Recorded before redirecting so the webhook always has a row to match,
  // even if the user closes the tab mid-payment.
  await createPendingPayment({
    userId,
    planId: plan.id,
    provider: adapter.name,
    merchantOid,
    amount: plan.price_amount,
    currency: plan.price_currency,
  });

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const userIp = forwardedFor?.split(",")[0]?.trim() || "0.0.0.0";

  const result = await adapter.createCheckout({
    plan,
    user: { id: user.id, email: user.email },
    merchantOid,
    userIp,
    successUrl: `${appUrl()}/dashboard/billing?status=success`,
    failUrl: `${appUrl()}/dashboard/billing?status=failed`,
    callbackUrl: `${appUrl()}/api/payments/webhook`,
  });

  if (result.kind === "error") return { kind: "error", message: result.message };
  if (result.kind === "iframe") return { kind: "iframe", url: result.url };
  return { kind: "redirect", url: result.url };
}
