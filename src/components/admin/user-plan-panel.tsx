"use client";

import { useState } from "react";
import { changeUserPlan, extendUserPlan, clearUserExpiry } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { PlanRow } from "@/lib/db/types";

const QUICK_EXTENSIONS = [7, 30, 90, 365];

export function UserPlanPanel({
  userId,
  plans,
  currentPlanId,
  expiresAt,
}: {
  userId: string;
  plans: PlanRow[];
  currentPlanId: string | null;
  expiresAt: string | null;
}) {
  const [planId, setPlanId] = useState(currentPlanId ?? plans[0]?.id ?? "");
  const [duration, setDuration] = useState("");
  const [notify, setNotify] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  const selectedPlan = plans.find((p) => p.id === planId);

  async function run(key: string, fn: () => Promise<{ error?: string; success?: string }>) {
    setPending(key);
    setResult({});
    setResult(await fn());
    setPending(null);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Plan</h2>
      <p className="mt-1 text-xs text-alloy-dim">
        {expiresAt
          ? `Current subscription expires ${new Date(expiresAt).toLocaleDateString()}.`
          : "Current subscription does not expire."}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="plan">Assign plan</Label>
          <Select id="plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
                {plan.price_amount > 0 ? ` — ${plan.price_amount} ${plan.price_currency}` : " — free"}
                {plan.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Days</Label>
          <Input
            id="duration"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={selectedPlan?.duration_days ? String(selectedPlan.duration_days) : "None"}
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-alloy-faint">
        Leave days empty to use the plan&rsquo;s own term
        {selectedPlan?.duration_days
          ? ` (${selectedPlan.duration_days} days).`
          : " (no expiry)."}{" "}
        Enter 0 for no expiry.
      </p>

      <label className="mt-3 flex items-center gap-2.5 text-sm text-alloy">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-electric"
        />
        Notify the user
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending !== null || !planId}
          onClick={() =>
            run("assign", () =>
              changeUserPlan({
                userId,
                planId,
                durationDays: duration.trim() === "" ? null : Number(duration),
                notify,
              }),
            )
          }
        >
          {pending === "assign" ? "Applying…" : "Apply plan"}
        </Button>
      </div>

      <div className="mt-5 border-t border-border-soft pt-4">
        <p className="text-xs font-medium text-alloy-dim">Adjust the current term</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_EXTENSIONS.map((days) => (
            <Button
              key={days}
              variant="secondary"
              size="sm"
              disabled={pending !== null}
              onClick={() => run(`ext-${days}`, () => extendUserPlan(userId, days))}
            >
              {pending === `ext-${days}` ? "…" : `+${days}d`}
            </Button>
          ))}
          {expiresAt && (
            <Button
              variant="secondary"
              size="sm"
              disabled={pending !== null}
              onClick={() => run("clear", () => clearUserExpiry(userId))}
            >
              {pending === "clear" ? "…" : "Remove expiry"}
            </Button>
          )}
        </div>
      </div>

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-2 text-xs text-electric">{result.success}</p>}
    </Card>
  );
}
