import type { PayPalConfig } from "@/lib/repo/app-settings";
import type { CheckoutRequest, CheckoutResult, PaymentAdapter, WebhookResult } from "./types";

function apiBase(config: PayPalConfig): string {
  return config.sandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

async function getAccessToken(config: PayPalConfig): Promise<string | null> {
  const credentials = Buffer.from(`${config.client_id}:${config.client_secret}`).toString("base64");
  try {
    const response = await fetch(`${apiBase(config)}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export function createPayPalAdapter(config: PayPalConfig): PaymentAdapter {
  return {
    name: "paypal",

    isConfigured() {
      return Boolean(config.client_id && config.client_secret);
    },

    async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
      const token = await getAccessToken(config);
      if (!token) return { kind: "error", message: "Could not authenticate with PayPal." };

      try {
        const response = await fetch(`${apiBase(config)}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
            "PayPal-Request-Id": request.merchantOid,
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                // Echoed back on the webhook, and how the payment row is matched.
                custom_id: request.merchantOid,
                description: request.plan.name,
                amount: {
                  currency_code: request.plan.price_currency,
                  value: request.plan.price_amount.toFixed(2),
                },
              },
            ],
            payment_source: {
              paypal: {
                experience_context: {
                  return_url: request.successUrl,
                  cancel_url: request.failUrl,
                  user_action: "PAY_NOW",
                },
              },
            },
          }),
        });

        const data = (await response.json()) as {
          links?: { rel: string; href: string }[];
          message?: string;
        };

        const approve = data.links?.find((link) => link.rel === "payer-action" || link.rel === "approve");
        if (!response.ok || !approve) {
          return { kind: "error", message: data.message ?? "PayPal rejected the request." };
        }
        return { kind: "redirect", url: approve.href };
      } catch {
        return { kind: "error", message: "Could not reach PayPal." };
      }
    },

    async parseWebhook(request: Request, body: string): Promise<WebhookResult | null> {
      // PayPal signatures cannot be verified locally — the payload has to be
      // handed back to their verify endpoint along with the transmission
      // headers, so an unreachable API means "unverified", never "trusted".
      const token = await getAccessToken(config);
      if (!token) return null;

      const webhookId = request.headers.get("paypal-webhook-id");
      const transmissionId = request.headers.get("paypal-transmission-id");
      const transmissionTime = request.headers.get("paypal-transmission-time");
      const transmissionSig = request.headers.get("paypal-transmission-sig");
      const certUrl = request.headers.get("paypal-cert-url");
      const authAlgo = request.headers.get("paypal-auth-algo");

      if (!webhookId || !transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
        return null;
      }

      let event: {
        event_type?: string;
        resource?: { id?: string; custom_id?: string; amount?: { value?: string } };
      };
      try {
        event = JSON.parse(body);
      } catch {
        return null;
      }

      try {
        const verification = await fetch(
          `${apiBase(config)}/v1/notifications/verify-webhook-signature`,
          {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({
              webhook_id: webhookId,
              transmission_id: transmissionId,
              transmission_time: transmissionTime,
              transmission_sig: transmissionSig,
              cert_url: certUrl,
              auth_algo: authAlgo,
              webhook_event: event,
            }),
          },
        );
        const result = (await verification.json()) as { verification_status?: string };
        if (result.verification_status !== "SUCCESS") return null;
      } catch {
        return null;
      }

      const merchantOid = event.resource?.custom_id;
      if (!merchantOid) return null;

      const paid =
        event.event_type === "PAYMENT.CAPTURE.COMPLETED" ||
        event.event_type === "CHECKOUT.ORDER.APPROVED";
      const failed =
        event.event_type === "PAYMENT.CAPTURE.DENIED" ||
        event.event_type === "PAYMENT.CAPTURE.REFUNDED";

      if (!paid && !failed) return null;

      return {
        merchantOid,
        status: paid ? "paid" : "failed",
        providerRef: event.resource?.id,
        amount: event.resource?.amount?.value ? Number(event.resource.amount.value) : undefined,
        raw: event as Record<string, unknown>,
      };
    },
  };
}
