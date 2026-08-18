"use client";

import { useState } from "react";
import { startCheckout } from "@/app/dashboard/billing/actions";
import { Button } from "@/components/ui/button";
import { Card, FieldError } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { FEATURE_GROUPS, normalizeFeatures, normalizeLimits, UNLIMITED } from "@/lib/domain/features";
import type { PlanRow } from "@/lib/db/types";

export function PlanComparison({
  plans,
  currentPlanId,
  checkoutAvailable,
}: {
  plans: PlanRow[];
  currentPlanId: string | null;
  checkoutAvailable: boolean;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setPending(planId);
    setError(undefined);

    const result = await startCheckout(planId);
    setPending(null);

    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    // PayTR hands back a hosted frame; the others own the whole page.
    if (result.kind === "iframe") {
      setIframeUrl(result.url);
      return;
    }
    // assign() rather than assigning to location.href — same navigation,
    // but not a mutation of a value owned outside the component.
    window.location.assign(result.url);
  }

  if (iframeUrl) {
    return (
      <Card className="overflow-hidden">
        <iframe
          src={iframeUrl}
          title="Secure payment"
          className="h-[600px] w-full border-0"
          allow="payment"
        />
      </Card>
    );
  }

  if (plans.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold text-alloy">Plans</h2>

      <FieldError>{error}</FieldError>

      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-shadow-elevated/60">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-56 min-w-56 border-b border-r border-border-soft bg-shadow-elevated p-4 text-left align-bottom">
                <span className="text-xs font-medium uppercase tracking-wide text-alloy-faint">
                  Feature
                </span>
              </th>
              {plans.map((plan) => {
                const current = plan.id === currentPlanId;
                return (
                  <th
                    key={plan.id}
                    className={cn(
                      "min-w-[180px] border-b border-l border-border-soft p-4 text-left align-top font-normal",
                      current && "bg-gradient-to-b from-electric/8 to-transparent",
                    )}
                  >
                    <p className="text-sm font-semibold text-alloy">{plan.name}</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-alloy">
                      {plan.price_amount > 0
                        ? plan.price_amount.toLocaleString(undefined, {
                            style: "currency",
                            currency: plan.price_currency,
                          })
                        : "Free"}
                      {plan.price_amount > 0 && plan.billing_period !== "lifetime" && (
                        <span className="text-xs font-normal text-alloy-faint">
                          /{plan.billing_period === "yearly" ? "yr" : "mo"}
                        </span>
                      )}
                    </p>
                    {plan.description && (
                      <p className="mt-1.5 text-xs text-alloy-dim">{plan.description}</p>
                    )}

                    <div className="mt-3">
                      {current ? (
                        <span className="inline-flex w-full items-center justify-center rounded-lg bg-shadow-raised px-3 py-1.5 text-xs font-medium text-electric ring-1 ring-inset ring-electric/25">
                          Current plan
                        </span>
                      ) : plan.price_amount <= 0 ? (
                        <span className="inline-flex w-full items-center justify-center px-3 py-1.5 text-xs text-alloy-faint">
                          —
                        </span>
                      ) : checkoutAvailable ? (
                        <Button
                          size="sm"
                          className="w-full px-3 py-1.5 text-xs"
                          disabled={pending !== null}
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          {pending === plan.id ? "Starting…" : "Upgrade"}
                        </Button>
                      ) : (
                        <span
                          className="inline-flex w-full items-center justify-center px-3 py-1.5 text-center text-xs text-alloy-faint"
                          title="No payment provider is configured on this instance"
                        >
                          Contact support
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {FEATURE_GROUPS.map((group) => (
              <PlanGroupRows key={group.key} group={group} plans={plans} currentPlanId={currentPlanId} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlanGroupRows({
  group,
  plans,
  currentPlanId,
}: {
  group: (typeof FEATURE_GROUPS)[number];
  plans: PlanRow[];
  currentPlanId: string | null;
}) {
  return (
    <>
      <tr>
        <th
          colSpan={plans.length + 1}
          className="sticky left-0 border-y border-border-soft bg-shadow-raised/80 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-alloy-dim"
        >
          {group.label}
        </th>
      </tr>

      {group.features.map((feature) => (
        <tr key={feature.key}>
          <th
            scope="row"
            className="sticky left-0 z-10 border-b border-r border-border-soft bg-shadow-elevated px-4 py-2.5 text-left font-normal"
          >
            <span className="text-sm text-alloy">{feature.label}</span>
          </th>
          {plans.map((plan) => {
            const enabled = normalizeFeatures(plan.features)[feature.key];
            return (
              <td
                key={plan.id}
                className={cn(
                  "border-b border-l border-border-soft px-4 py-2.5 text-center",
                  plan.id === currentPlanId && "bg-electric/[0.03]",
                )}
              >
                {enabled ? (
                  <span className="text-electric" aria-label="Included">
                    ✓
                  </span>
                ) : (
                  <span className="text-alloy-faint/40" aria-label="Not included">
                    —
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      ))}

      {group.limits.map((limit) => (
        <tr key={limit.key}>
          <th
            scope="row"
            className="sticky left-0 z-10 border-b border-r border-border-soft bg-shadow-elevated px-4 py-2.5 text-left font-normal"
          >
            <span className="text-sm text-alloy">{limit.label}</span>
          </th>
          {plans.map((plan) => {
            const value = normalizeLimits(plan.limits)[limit.key];
            return (
              <td
                key={plan.id}
                className={cn(
                  "border-b border-l border-border-soft px-4 py-2.5 text-center text-sm text-alloy",
                  plan.id === currentPlanId && "bg-electric/[0.03]",
                )}
              >
                {value === UNLIMITED ? "Unlimited" : value}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
