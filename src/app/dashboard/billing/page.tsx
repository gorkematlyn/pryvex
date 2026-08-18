import { requireProfile } from "@/lib/domain/current-user";
import { getEntitlements } from "@/lib/domain/entitlements";
import { listActivePublicPlans } from "@/lib/repo/plans";
import { listPaymentsForUser } from "@/lib/repo/payments";
import { getActivePaymentAdapter } from "@/lib/payments";
import { countLinksForProfile } from "@/lib/repo/links";
import { countShortLinksForProfile } from "@/lib/repo/short-links";
import { countQrCodesForProfile } from "@/lib/repo/qr-codes";
import { Card } from "@/components/ui/card";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { UsageMeters } from "@/components/billing/usage-meters";

export const metadata = { title: "Plan" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const { userId, profile } = await requireProfile();

  const [entitlements, plans, payments, adapter, linkCount, shortLinkCount, qrCount] =
    await Promise.all([
      getEntitlements(userId),
      listActivePublicPlans(),
      listPaymentsForUser(userId),
      getActivePaymentAdapter(),
      countLinksForProfile(profile.id),
      countShortLinksForProfile(profile.id),
      countQrCodesForProfile(profile.id),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Your plan</h1>
        <p className="mt-1 text-sm text-alloy-dim">
          {entitlements.plan ? `You're on ${entitlements.plan.name}.` : "No plan assigned."}
          {entitlements.expiresAt && !entitlements.isExpired
            ? ` Renews or expires ${formatDate(entitlements.expiresAt)}.`
            : ""}
        </p>
      </div>

      {status === "success" && (
        <Card className="border-emerald-900/50 bg-emerald-950/20 p-4">
          <p className="text-sm text-emerald-300">
            Payment received. If your plan doesn&rsquo;t update within a minute, refresh this page —
            confirmation arrives from the payment provider.
          </p>
        </Card>
      )}
      {status === "failed" && (
        <Card className="border-red-900/50 bg-red-950/20 p-4">
          <p className="text-sm text-red-300">
            That payment didn&rsquo;t complete. Nothing was charged — you can try again below.
          </p>
        </Card>
      )}

      {entitlements.isExpired && entitlements.lapsedPlan && (
        <Card className="border-amber-900/50 bg-amber-950/20 p-4">
          <p className="text-sm text-amber-300">
            Your {entitlements.lapsedPlan.name} plan expired
            {entitlements.expiresAt ? ` on ${formatDate(entitlements.expiresAt)}` : ""}. You&rsquo;re
            on Free entitlements until you renew — nothing has been deleted.
          </p>
        </Card>
      )}

      <UsageMeters
        entitlements={entitlements}
        usage={{ links: linkCount, shortLinks: shortLinkCount, qrCodes: qrCount }}
      />

      <PlanComparison
        plans={plans}
        currentPlanId={entitlements.plan?.id ?? null}
        checkoutAvailable={adapter !== null}
      />

      {payments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-alloy">Payment history</h2>
          <Card className="mt-3 divide-y divide-border-soft">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-alloy">{formatDate(payment.created_at)}</p>
                  <p className="mt-0.5 truncate text-xs text-alloy-faint">{payment.merchant_oid}</p>
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
        </section>
      )}
    </div>
  );
}
