"use client";

import { useState } from "react";
import { updateSignupSettings } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { SignupSettings } from "@/lib/repo/app-settings";
import type { PlanRow } from "@/lib/db/types";

export function SignupDefaultsForm({
  settings,
  plans,
}: {
  settings: SignupSettings;
  plans: PlanRow[];
}) {
  const [planId, setPlanId] = useState(settings.default_plan_id);
  const [days, setDays] = useState(
    settings.default_duration_days === null ? "" : String(settings.default_duration_days),
  );
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  async function handleSave() {
    setPending(true);
    setResult({});
    setResult(
      await updateSignupSettings({
        default_plan_id: planId,
        default_duration_days: days.trim() === "" ? null : Number(days),
      }),
    );
    setPending(false);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">New accounts</h2>
      <p className="mt-1 text-xs text-alloy-dim">
        Which plan someone lands on when they sign up, and for how long.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="default-plan">Default plan</Label>
          <Select id="default-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {plans
              .filter((plan) => plan.is_active)
              .map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                  {plan.price_amount > 0 ? ` — ${plan.price_amount} ${plan.price_currency}` : " — free"}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="default-days">Duration (days)</Label>
          <Input
            id="default-days"
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="Forever"
          />
        </div>
      </div>

      <p className="mt-2 text-xs text-alloy-faint">
        Leave empty for no expiry. Set a duration to give every new signup a trial of the chosen plan
        — they fall back to Free entitlements when it lapses.
      </p>

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-2 text-xs text-electric">{result.success}</p>}

      <Button size="sm" className="mt-4" onClick={handleSave} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
