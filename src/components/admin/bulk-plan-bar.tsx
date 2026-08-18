"use client";

import { useState } from "react";
import { bulkAssignPlan, type Audience } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { PlanRow } from "@/lib/db/types";

/**
 * Bulk plan assignment. Collapsed by default and gated behind a typed
 * confirmation, because "apply to all users" rewrites every subscription
 * on the instance and there is no undo.
 */
export function BulkPlanBar({ plans }: { plans: PlanRow[] }) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Audience["scope"]>("plan");
  const [sourcePlanId, setSourcePlanId] = useState(plans[0]?.id ?? "");
  const [targetPlanId, setTargetPlanId] = useState(plans[0]?.id ?? "");
  const [duration, setDuration] = useState("");
  const [notify, setNotify] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  const needsConfirm = scope === "all";
  const confirmed = !needsConfirm || confirmText.trim().toUpperCase() === "APPLY TO ALL";

  async function handleApply() {
    setPending(true);
    setResult({});
    const response = await bulkAssignPlan({
      audience: scope === "plan" ? { scope: "plan", planId: sourcePlanId } : { scope: "all" },
      planId: targetPlanId,
      durationDays: duration.trim() === "" ? null : Number(duration),
      notify,
    });
    setPending(false);
    setResult(response);
    if (response.success) {
      setConfirmText("");
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          Bulk assign a plan
        </Button>
        {result.success && <span className="text-xs text-electric">{result.success}</span>}
      </div>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-alloy">Bulk assign a plan</h2>
          <p className="mt-1 text-xs text-alloy-dim">
            Replaces the active subscription for everyone in the audience.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="bulk-scope">Audience</Label>
          <Select id="bulk-scope" value={scope} onChange={(e) => setScope(e.target.value as Audience["scope"])}>
            <option value="plan">Everyone on a plan</option>
            <option value="all">Every account</option>
          </Select>
        </div>

        {scope === "plan" && (
          <div>
            <Label htmlFor="bulk-source">Currently on</Label>
            <Select id="bulk-source" value={sourcePlanId} onChange={(e) => setSourcePlanId(e.target.value)}>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="bulk-target">Move to</Label>
          <Select id="bulk-target" value={targetPlanId} onChange={(e) => setTargetPlanId(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="bulk-duration">Duration (days)</Label>
          <Input
            id="bulk-duration"
            type="number"
            min={0}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Plan default"
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2.5 text-sm text-alloy">
        <input
          type="checkbox"
          checked={notify}
          onChange={(e) => setNotify(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-electric"
        />
        Notify affected users
      </label>

      {needsConfirm && (
        <div className="mt-4 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3">
          <p className="text-xs text-amber-300">
            This rewrites the subscription of every account on the instance. Type{" "}
            <strong className="font-semibold">APPLY TO ALL</strong> to confirm.
          </p>
          <Input
            className="mt-2"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="APPLY TO ALL"
            aria-label="Type APPLY TO ALL to confirm"
          />
        </div>
      )}

      <FieldError>{result.error}</FieldError>

      <div className="mt-4">
        <Button size="sm" onClick={handleApply} disabled={pending || !confirmed || !targetPlanId}>
          {pending ? "Applying…" : "Apply"}
        </Button>
      </div>
    </Card>
  );
}
