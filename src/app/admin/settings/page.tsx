import { requireSuperAdmin } from "@/lib/domain/current-admin";
import {
  getSignupSettings,
  getPaymentSettings,
  getBrandingSettings,
  SECRET_MASK,
} from "@/lib/repo/app-settings";
import { listPlans } from "@/lib/repo/plans";
import { listRecentPayments } from "@/lib/repo/payments";
import { SignupDefaultsForm } from "@/components/admin/signup-defaults-form";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import { BrandingForm } from "@/components/admin/branding-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Settings" };

/**
 * Stored secrets are replaced with a mask before they reach the browser —
 * the admin can overwrite them but never read them back out of the page
 * source.
 */
function maskSecrets(settings: Awaited<ReturnType<typeof getPaymentSettings>>) {
  const mask = (value: string) => (value ? SECRET_MASK : "");
  return {
    ...settings,
    paytr: {
      ...settings.paytr,
      merchant_key: mask(settings.paytr.merchant_key),
      merchant_salt: mask(settings.paytr.merchant_salt),
    },
    paypal: { ...settings.paypal, client_secret: mask(settings.paypal.client_secret) },
    stripe: {
      ...settings.stripe,
      secret_key: mask(settings.stripe.secret_key),
      webhook_secret: mask(settings.stripe.webhook_secret),
    },
  };
}

export default async function AdminSettingsPage() {
  await requireSuperAdmin();

  const [signup, payments, branding, plans, recentPayments] = await Promise.all([
    getSignupSettings(),
    getPaymentSettings(),
    getBrandingSettings(),
    listPlans(),
    listRecentPayments(10),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Settings</h1>
        <p className="mt-1 text-sm text-alloy-dim">Instance-wide configuration.</p>
      </div>

      <SignupDefaultsForm settings={signup} plans={plans} />

      <PaymentSettingsForm settings={maskSecrets(payments)} webhookUrl={`${appUrl}/api/payments/webhook`} />

      <BrandingForm settings={branding} />

      <section>
        <h2 className="text-sm font-semibold text-alloy">Recent payments</h2>
        {recentPayments.length === 0 ? (
          <Card className="mt-3 p-8 text-center">
            <p className="text-sm text-alloy-dim">No payments recorded yet.</p>
          </Card>
        ) : (
          <Card className="mt-3 divide-y divide-border-soft">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-alloy">
                    {payment.plan_name ?? "—"}{" "}
                    <span className="text-alloy-faint">· {payment.email ?? "deleted account"}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-alloy-faint">
                    {payment.provider} · {payment.merchant_oid}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm text-alloy">
                    {payment.amount.toLocaleString(undefined, {
                      style: "currency",
                      currency: payment.currency,
                    })}
                  </p>
                  <p
                    className={
                      payment.status === "paid"
                        ? "text-xs text-emerald-400"
                        : payment.status === "pending"
                          ? "text-xs text-amber-400"
                          : "text-xs text-red-400"
                    }
                  >
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
