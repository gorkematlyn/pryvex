import type { PlanRow } from "@/lib/db/types";

/**
 * One shape for every gateway, so the checkout route and the plan UI never
 * branch on which provider is configured. Each adapter converts these calls
 * into its own API and its own webhook format.
 */

export interface CheckoutRequest {
  plan: PlanRow;
  user: { id: string; email: string };
  /** Our own order id. Written to payments.merchant_oid before redirecting. */
  merchantOid: string;
  /** PayTR signs the buyer's IP into the token request and rejects a mismatch. */
  userIp: string;
  successUrl: string;
  failUrl: string;
  callbackUrl: string;
}

export type CheckoutResult =
  /** Send the browser to the gateway's hosted page. */
  | { kind: "redirect"; url: string }
  /** Render the gateway's iframe/embedded form with this token. */
  | { kind: "iframe"; token: string; url: string }
  | { kind: "error"; message: string };

export interface WebhookResult {
  /** Matches payments.merchant_oid so the row can be resolved. */
  merchantOid: string;
  status: "paid" | "failed";
  providerRef?: string;
  amount?: number;
  raw: Record<string, unknown>;
  /** Some gateways require an exact body in the 200 response (PayTR wants "OK"). */
  ackBody?: string;
}

export interface PaymentAdapter {
  readonly name: "paytr" | "paypal" | "stripe";
  /** False when the admin has not filled in every required credential. */
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
  /** Verifies the signature and normalises the payload. Returns null if the signature does not match. */
  parseWebhook(request: Request, body: string): Promise<WebhookResult | null>;
}
