"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/domain/current-admin";
import { logAdminAction } from "@/lib/repo/admin";
import {
  saveSignupSettings,
  savePaymentSettings,
  saveBrandingSettings,
  getPaymentSettings,
  SECRET_MASK,
  type PaymentSettings,
} from "@/lib/repo/app-settings";
import { getPlanById } from "@/lib/repo/plans";

export type SettingsActionResult = { error?: string; success?: string };

const signupSchema = z.object({
  default_plan_id: z.string().uuid("Pick a plan"),
  default_duration_days: z.number().int().min(0).max(36500).nullable(),
});

export async function updateSignupSettings(input: {
  default_plan_id: string;
  default_duration_days: number | null;
}): Promise<SettingsActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const plan = await getPlanById(parsed.data.default_plan_id);
  if (!plan) return { error: "That plan no longer exists." };
  if (!plan.is_active) return { error: "New accounts cannot be put on an inactive plan." };

  await saveSignupSettings({
    default_plan_id: parsed.data.default_plan_id,
    default_duration_days:
      parsed.data.default_duration_days === 0 ? null : parsed.data.default_duration_days,
  });

  await logAdminAction({
    actorUserId: admin.id,
    action: "settings.update_signup",
    detail: { plan: plan.slug, days: parsed.data.default_duration_days },
  });

  revalidatePath("/admin/settings");
  return { success: "Signup defaults saved." };
}

const paymentSchema = z.object({
  provider: z.enum(["none", "paytr", "paypal", "stripe"]),
  paytr: z.object({
    merchant_id: z.string(),
    merchant_key: z.string(),
    merchant_salt: z.string(),
    test_mode: z.boolean(),
  }),
  paypal: z.object({
    client_id: z.string(),
    client_secret: z.string(),
    sandbox: z.boolean(),
  }),
  stripe: z.object({
    publishable_key: z.string(),
    secret_key: z.string(),
    webhook_secret: z.string(),
  }),
});

/** An unchanged mask means "keep whatever is already stored". */
function unmask(next: string, stored: string): string {
  return next === SECRET_MASK ? stored : next;
}

export async function updatePaymentSettings(input: unknown): Promise<SettingsActionResult> {
  const admin = await requireSuperAdmin();

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const current = await getPaymentSettings();
  const next: PaymentSettings = {
    provider: parsed.data.provider,
    paytr: {
      ...parsed.data.paytr,
      merchant_key: unmask(parsed.data.paytr.merchant_key, current.paytr.merchant_key),
      merchant_salt: unmask(parsed.data.paytr.merchant_salt, current.paytr.merchant_salt),
    },
    paypal: {
      ...parsed.data.paypal,
      client_secret: unmask(parsed.data.paypal.client_secret, current.paypal.client_secret),
    },
    stripe: {
      ...parsed.data.stripe,
      secret_key: unmask(parsed.data.stripe.secret_key, current.stripe.secret_key),
      webhook_secret: unmask(parsed.data.stripe.webhook_secret, current.stripe.webhook_secret),
    },
  };

  // Refuse to switch a gateway "on" while it is missing credentials — that
  // state renders a checkout button that always fails.
  const missing =
    next.provider === "paytr"
      ? !next.paytr.merchant_id || !next.paytr.merchant_key || !next.paytr.merchant_salt
      : next.provider === "paypal"
        ? !next.paypal.client_id || !next.paypal.client_secret
        : next.provider === "stripe"
          ? !next.stripe.secret_key || !next.stripe.webhook_secret
          : false;

  if (missing) {
    return { error: `Fill in every ${next.provider} credential before selecting it.` };
  }

  await savePaymentSettings(next);

  await logAdminAction({
    actorUserId: admin.id,
    action: "settings.update_payments",
    // Never log credential values.
    detail: { provider: next.provider },
  });

  revalidatePath("/admin/settings");
  return { success: "Payment settings saved." };
}

export async function updateBrandingSettings(input: {
  support_email: string;
}): Promise<SettingsActionResult> {
  const admin = await requireSuperAdmin();

  const email = input.support_email.trim();
  if (email && !z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }

  await saveBrandingSettings({ support_email: email });
  await logAdminAction({ actorUserId: admin.id, action: "settings.update_branding" });

  revalidatePath("/admin/settings");
  return { success: "Saved." };
}
