import crypto from "node:crypto";
import type { StripeConfig } from "@/lib/repo/app-settings";
import type { CheckoutRequest, CheckoutResult, PaymentAdapter, WebhookResult } from "./types";

const API_BASE = "https://api.stripe.com/v1";

/** Stripe takes the smallest currency unit as an integer. */
function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function createStripeAdapter(config: StripeConfig): PaymentAdapter {
  return {
    name: "stripe",

    isConfigured() {
      return Boolean(config.secret_key && config.webhook_secret);
    },

    async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
      // Called over REST rather than through the SDK to keep the serverless
      // bundle small — this is the only Stripe endpoint the app needs.
      const form = new URLSearchParams({
        mode: "payment",
        success_url: request.successUrl,
        cancel_url: request.failUrl,
        client_reference_id: request.merchantOid,
        customer_email: request.user.email,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": request.plan.price_currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": String(toMinorUnits(request.plan.price_amount)),
        "line_items[0][price_data][product_data][name]": request.plan.name,
        "metadata[merchant_oid]": request.merchantOid,
        "metadata[plan_id]": request.plan.id,
        "metadata[user_id]": request.user.id,
      });

      try {
        const response = await fetch(`${API_BASE}/checkout/sessions`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.secret_key}`,
            "content-type": "application/x-www-form-urlencoded",
            // Stripe deduplicates retries of the same order id.
            "idempotency-key": request.merchantOid,
          },
          body: form,
        });

        const data = (await response.json()) as {
          url?: string;
          error?: { message?: string };
        };

        if (!response.ok || !data.url) {
          return { kind: "error", message: data.error?.message ?? "Stripe rejected the request." };
        }
        return { kind: "redirect", url: data.url };
      } catch {
        return { kind: "error", message: "Could not reach Stripe." };
      }
    },

    async parseWebhook(request: Request, body: string): Promise<WebhookResult | null> {
      const signature = request.headers.get("stripe-signature");
      if (!signature) return null;

      // Header looks like: t=<unix>,v1=<hex>,v1=<hex>
      const parts = Object.fromEntries(
        signature.split(",").map((part) => {
          const [key, ...rest] = part.split("=");
          return [key.trim(), rest.join("=")];
        }),
      );
      const timestamp = parts.t;
      const provided = parts.v1;
      if (!timestamp || !provided) return null;

      // Reject stale signatures so a captured webhook cannot be replayed later.
      const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
      if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return null;

      const expected = crypto
        .createHmac("sha256", config.webhook_secret)
        .update(`${timestamp}.${body}`)
        .digest("hex");

      const expectedBuf = Buffer.from(expected);
      const providedBuf = Buffer.from(provided);
      if (expectedBuf.length !== providedBuf.length) return null;
      if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) return null;

      const event = JSON.parse(body) as {
        type: string;
        data: { object: Record<string, unknown> };
      };

      const object = event.data.object;
      const metadata = (object.metadata ?? {}) as Record<string, string>;
      const merchantOid = metadata.merchant_oid ?? (object.client_reference_id as string | undefined);
      if (!merchantOid) return null;

      if (event.type === "checkout.session.completed" && object.payment_status === "paid") {
        return {
          merchantOid,
          status: "paid",
          providerRef: object.id as string,
          amount: Number(object.amount_total ?? 0) / 100,
          raw: object,
        };
      }

      if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        return { merchantOid, status: "failed", providerRef: object.id as string, raw: object };
      }

      // Any other event type is valid but not something this app acts on.
      return null;
    },
  };
}
