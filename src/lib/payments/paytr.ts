import crypto from "node:crypto";
import type { PayTrConfig } from "@/lib/repo/app-settings";
import type { CheckoutRequest, CheckoutResult, PaymentAdapter, WebhookResult } from "./types";

const TOKEN_ENDPOINT = "https://www.paytr.com/odeme/api/get-token";
const IFRAME_BASE = "https://www.paytr.com/odeme/guvenli";

/** PayTR works in the minor unit (kuruş), as an integer. */
function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

function hmacBase64(payload: string, key: string): string {
  return crypto.createHmac("sha256", key).update(payload).digest("base64");
}

export function createPayTrAdapter(config: PayTrConfig): PaymentAdapter {
  return {
    name: "paytr",

    isConfigured() {
      return Boolean(config.merchant_id && config.merchant_key && config.merchant_salt);
    },

    async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
      const amount = toMinorUnits(request.plan.price_amount);
      const basket = Buffer.from(
        JSON.stringify([[request.plan.name, request.plan.price_amount.toFixed(2), 1]]),
      ).toString("base64");

      const noInstallment = "0";
      const maxInstallment = "0";
      const currency = request.plan.price_currency === "TRY" ? "TL" : request.plan.price_currency;
      const testMode = config.test_mode ? "1" : "0";

      // The hash covers the exact field order PayTR documents; changing the
      // order silently produces an invalid token rather than an error.
      const hashStr =
        config.merchant_id +
        request.userIp +
        request.merchantOid +
        request.user.email +
        amount +
        basket +
        noInstallment +
        maxInstallment +
        currency +
        testMode;
      const paytrToken = hmacBase64(hashStr + config.merchant_salt, config.merchant_key);

      const form = new URLSearchParams({
        merchant_id: config.merchant_id,
        user_ip: request.userIp,
        merchant_oid: request.merchantOid,
        email: request.user.email,
        payment_amount: String(amount),
        paytr_token: paytrToken,
        user_basket: basket,
        debug_on: config.test_mode ? "1" : "0",
        no_installment: noInstallment,
        max_installment: maxInstallment,
        user_name: request.user.email,
        user_address: "-",
        user_phone: "-",
        merchant_ok_url: request.successUrl,
        merchant_fail_url: request.failUrl,
        timeout_limit: "30",
        currency,
        test_mode: testMode,
      });

      try {
        const response = await fetch(TOKEN_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: form,
        });
        const data = (await response.json()) as { status: string; token?: string; reason?: string };

        if (data.status !== "success" || !data.token) {
          return { kind: "error", message: data.reason ?? "PayTR rejected the request." };
        }
        return { kind: "iframe", token: data.token, url: `${IFRAME_BASE}/${data.token}` };
      } catch {
        return { kind: "error", message: "Could not reach PayTR." };
      }
    },

    async parseWebhook(_request: Request, body: string): Promise<WebhookResult | null> {
      const params = new URLSearchParams(body);
      const merchantOid = params.get("merchant_oid");
      const status = params.get("status");
      const totalAmount = params.get("total_amount");
      const hash = params.get("hash");

      if (!merchantOid || !status || !totalAmount || !hash) return null;

      const expected = hmacBase64(
        merchantOid + config.merchant_salt + status + totalAmount,
        config.merchant_key,
      );

      // Constant-time compare: this hash is the only thing separating a real
      // callback from a forged "payment succeeded".
      const expectedBuf = Buffer.from(expected);
      const actualBuf = Buffer.from(hash);
      if (expectedBuf.length !== actualBuf.length) return null;
      if (!crypto.timingSafeEqual(expectedBuf, actualBuf)) return null;

      return {
        merchantOid,
        status: status === "success" ? "paid" : "failed",
        amount: Number(totalAmount) / 100,
        raw: Object.fromEntries(params.entries()),
        // PayTR retries the callback until it receives exactly this body.
        ackBody: "OK",
      };
    },
  };
}
