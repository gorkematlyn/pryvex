import { query, queryOne } from "@/lib/db/pool";
import { FREE_PLAN_ID } from "@/lib/repo/plans";

export interface SignupSettings {
  default_plan_id: string;
  default_duration_days: number | null;
}

export interface PayTrConfig {
  merchant_id: string;
  merchant_key: string;
  merchant_salt: string;
  test_mode: boolean;
}
export interface PayPalConfig {
  client_id: string;
  client_secret: string;
  sandbox: boolean;
}
export interface StripeConfig {
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
}

export type PaymentProviderName = "none" | "paytr" | "paypal" | "stripe";

/**
 * Placeholder swapped in for stored secrets before they reach the browser.
 * Lives here rather than in the settings Server Action file because a
 * `"use server"` module may only export async functions — exporting a
 * constant from one makes the whole module appear to have no exports.
 */
export const SECRET_MASK = "••••••••";

export interface PaymentSettings {
  provider: PaymentProviderName;
  paytr: PayTrConfig;
  paypal: PayPalConfig;
  stripe: StripeConfig;
}

export interface BrandingSettings {
  support_email: string;
}

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await queryOne<{ value: T }>("select value from app_settings where key = $1", [key]);
  return row ? { ...fallback, ...row.value } : fallback;
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  await query(
    `insert into app_settings (key, value, updated_at) values ($1, $2, now())
     on conflict (key) do update set value = excluded.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

export function getSignupSettings(): Promise<SignupSettings> {
  return readSetting<SignupSettings>("signup", {
    default_plan_id: FREE_PLAN_ID,
    default_duration_days: null,
  });
}

export function saveSignupSettings(value: SignupSettings): Promise<void> {
  return writeSetting("signup", value);
}

export function getPaymentSettings(): Promise<PaymentSettings> {
  return readSetting<PaymentSettings>("payments", {
    provider: "none",
    paytr: { merchant_id: "", merchant_key: "", merchant_salt: "", test_mode: true },
    paypal: { client_id: "", client_secret: "", sandbox: true },
    stripe: { publishable_key: "", secret_key: "", webhook_secret: "" },
  });
}

export function savePaymentSettings(value: PaymentSettings): Promise<void> {
  return writeSetting("payments", value);
}

export function getBrandingSettings(): Promise<BrandingSettings> {
  return readSetting<BrandingSettings>("branding", { support_email: "" });
}

export function saveBrandingSettings(value: BrandingSettings): Promise<void> {
  return writeSetting("branding", value);
}
