import { getPaymentSettings } from "@/lib/repo/app-settings";
import { createPayTrAdapter } from "./paytr";
import { createPayPalAdapter } from "./paypal";
import { createStripeAdapter } from "./stripe";
import type { PaymentAdapter } from "./types";

export type { PaymentAdapter, CheckoutRequest, CheckoutResult, WebhookResult } from "./types";

/**
 * Builds the adapter for whichever gateway the admin selected. Returns null
 * when payments are switched off or the credentials are incomplete, which
 * is the signal for the UI to hide checkout entirely rather than offer a
 * button that cannot work.
 */
export async function getActivePaymentAdapter(): Promise<PaymentAdapter | null> {
  const settings = await getPaymentSettings();

  const adapter =
    settings.provider === "paytr"
      ? createPayTrAdapter(settings.paytr)
      : settings.provider === "paypal"
        ? createPayPalAdapter(settings.paypal)
        : settings.provider === "stripe"
          ? createStripeAdapter(settings.stripe)
          : null;

  if (!adapter || !adapter.isConfigured()) return null;
  return adapter;
}

/** Order id handed to the gateway. Prefixed so it is recognisable in their dashboards. */
export function generateMerchantOid(): string {
  // Alphanumeric only — PayTR rejects anything else in merchant_oid.
  return `PVX${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}
