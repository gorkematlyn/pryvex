"use client";

import { useMemo, useState } from "react";
import { savePlan } from "@/app/admin/plans/actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { FieldError } from "@/components/ui/card";
import { DeletePlanDialog } from "@/components/admin/delete-plan-dialog";
import { cn } from "@/lib/cn";
import {
  FEATURE_GROUPS,
  UNLIMITED,
  normalizeFeatures,
  normalizeLimits,
  type FeatureKey,
  type LimitKey,
} from "@/lib/domain/features";
import type { PlanRow } from "@/lib/db/types";

interface Draft {
  key: string;
  id: string | null;
  slug: string;
  name: string;
  description: string;
  price_amount: number;
  price_currency: string;
  billing_period: "free" | "monthly" | "yearly" | "lifetime";
  duration_days: number | null;
  features: Record<FeatureKey, boolean>;
  limits: Record<LimitKey, number>;
  is_active: boolean;
  is_public: boolean;
  is_system: boolean;
  position: number;
}

function toDraft(plan: PlanRow): Draft {
  return {
    key: plan.id,
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description ?? "",
    price_amount: plan.price_amount,
    price_currency: plan.price_currency,
    billing_period: plan.billing_period,
    duration_days: plan.duration_days,
    features: normalizeFeatures(plan.features),
    limits: normalizeLimits(plan.limits),
    is_active: plan.is_active,
    is_public: plan.is_public,
    is_system: plan.is_system,
    position: plan.position,
  };
}

function newDraft(position: number): Draft {
  return {
    key: `new-${Date.now()}`,
    id: null,
    slug: "",
    name: "",
    description: "",
    price_amount: 0,
    price_currency: "USD",
    billing_period: "monthly",
    duration_days: 30,
    features: normalizeFeatures({}),
    limits: normalizeLimits({}),
    is_active: true,
    is_public: true,
    is_system: false,
    position,
  };
}

export function PlansMatrix({
  plans,
  subscriberCounts,
}: {
  plans: PlanRow[];
  subscriberCounts: Record<string, number>;
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() => plans.map(toDraft));
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, { error?: string; success?: string }>>({});
  const [deleting, setDeleting] = useState<Draft | null>(null);

  // Compared against the server rows so "unsaved" reflects real divergence,
  // not merely having focused a field.
  const baseline = useMemo(
    () => new Map(plans.map((p) => [p.id, JSON.stringify(toDraft(p))])),
    [plans],
  );

  function isDirty(draft: Draft): boolean {
    if (!draft.id) return true;
    return baseline.get(draft.id) !== JSON.stringify(draft);
  }

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }

  function toggleFeature(key: string, feature: FeatureKey) {
    setDrafts((current) =>
      current.map((d) =>
        d.key === key ? { ...d, features: { ...d.features, [feature]: !d.features[feature] } } : d,
      ),
    );
  }

  function setLimit(key: string, limit: LimitKey, value: number) {
    setDrafts((current) =>
      current.map((d) => (d.key === key ? { ...d, limits: { ...d.limits, [limit]: value } } : d)),
    );
  }

  async function handleSave(draft: Draft) {
    setSaving(draft.key);
    setResult((r) => ({ ...r, [draft.key]: {} }));

    const response = await savePlan(draft.id, {
      slug: draft.slug,
      name: draft.name,
      description: draft.description.trim() === "" ? null : draft.description.trim(),
      price_amount: draft.price_amount,
      price_currency: draft.price_currency.toUpperCase(),
      billing_period: draft.billing_period,
      duration_days: draft.duration_days,
      features: draft.features,
      limits: draft.limits,
      is_active: draft.is_active,
      is_public: draft.is_public,
      position: draft.position,
    });

    setSaving(null);
    setResult((r) => ({ ...r, [draft.key]: response }));

    // A newly created plan gets its real id so the next save updates rather
    // than inserting a duplicate, even before the router refresh lands.
    if (response.planId && !draft.id) {
      update(draft.key, { id: response.planId });
    }
  }

  function addPlan() {
    setDrafts((current) => [...current, newDraft(current.length)]);
  }

  const dirtyCount = drafts.filter(isDirty).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="sm" onClick={addPlan}>
          + Add plan
        </Button>
        {dirtyCount > 0 && (
          <p className="text-xs text-amber-400">
            {dirtyCount} plan{dirtyCount === 1 ? "" : "s"} with unsaved changes
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-shadow-elevated/60">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 w-56 min-w-56 border-b border-r border-border-soft bg-shadow-elevated p-3 text-left align-bottom"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-alloy-faint">
                  Capability
                </span>
              </th>
              {drafts.map((draft) => (
                <th
                  key={draft.key}
                  scope="col"
                  className="min-w-[200px] border-b border-l border-border-soft p-3 text-left align-top font-normal"
                >
                  <PlanColumnHeader
                    draft={draft}
                    subscribers={draft.id ? (subscriberCounts[draft.id] ?? 0) : 0}
                    dirty={isDirty(draft)}
                    saving={saving === draft.key}
                    result={result[draft.key]}
                    onChange={(patch) => update(draft.key, patch)}
                    onSave={() => handleSave(draft)}
                    onDelete={() => setDeleting(draft)}
                    onDiscard={() =>
                      setDrafts((current) => current.filter((d) => d.key !== draft.key))
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {FEATURE_GROUPS.map((group) => (
              <FeatureGroupRows
                key={group.key}
                group={group}
                drafts={drafts}
                onToggleFeature={toggleFeature}
                onSetLimit={setLimit}
              />
            ))}
          </tbody>
        </table>
      </div>

      {deleting && (
        <DeletePlanDialog
          plan={{ id: deleting.id, name: deleting.name || "Untitled plan" }}
          otherPlans={drafts
            .filter((d) => d.id && d.id !== deleting.id)
            .map((d) => ({ id: d.id as string, name: d.name }))}
          subscribers={deleting.id ? (subscriberCounts[deleting.id] ?? 0) : 0}
          onClose={() => setDeleting(null)}
          onLocalRemove={() => {
            setDrafts((current) => current.filter((d) => d.key !== deleting.key));
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

function FeatureGroupRows({
  group,
  drafts,
  onToggleFeature,
  onSetLimit,
}: {
  group: (typeof FEATURE_GROUPS)[number];
  drafts: Draft[];
  onToggleFeature: (key: string, feature: FeatureKey) => void;
  onSetLimit: (key: string, limit: LimitKey, value: number) => void;
}) {
  return (
    <>
      <tr>
        <th
          scope="rowgroup"
          colSpan={drafts.length + 1}
          className="sticky left-0 border-y border-border-soft bg-shadow-raised/80 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-alloy-dim"
        >
          {group.label}
        </th>
      </tr>

      {group.features.map((feature) => (
        <tr key={feature.key} className="group">
          <th
            scope="row"
            className="sticky left-0 z-10 border-b border-r border-border-soft bg-shadow-elevated px-3 py-2 text-left font-normal group-hover:bg-shadow-raised/60"
          >
            <span className="text-sm text-alloy">{feature.label}</span>
            <span className="mt-0.5 block text-xs text-alloy-faint">{feature.description}</span>
          </th>
          {drafts.map((draft) => (
            <td
              key={draft.key}
              className="border-b border-l border-border-soft px-3 py-2 text-center group-hover:bg-shadow-raised/30"
            >
              <label className="inline-flex cursor-pointer items-center justify-center">
                <input
                  type="checkbox"
                  checked={draft.features[feature.key]}
                  disabled={feature.alwaysOn}
                  onChange={() => onToggleFeature(draft.key, feature.key)}
                  className="h-4 w-4 rounded border-border accent-electric disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`${feature.label} in ${draft.name || "new plan"}`}
                />
              </label>
            </td>
          ))}
        </tr>
      ))}

      {group.limits.map((limit) => (
        <tr key={limit.key} className="group">
          <th
            scope="row"
            className="sticky left-0 z-10 border-b border-r border-border-soft bg-shadow-elevated px-3 py-2 text-left font-normal group-hover:bg-shadow-raised/60"
          >
            <span className="text-sm text-alloy">{limit.label}</span>
            <span className="mt-0.5 block text-xs text-alloy-faint">{limit.description}</span>
          </th>
          {drafts.map((draft) => (
            <td
              key={draft.key}
              className="border-b border-l border-border-soft px-3 py-2 group-hover:bg-shadow-raised/30"
            >
              <LimitCell
                value={draft.limits[limit.key]}
                unit={limit.unit}
                label={`${limit.label} in ${draft.name || "new plan"}`}
                onChange={(value) => onSetLimit(draft.key, limit.key, value)}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** A numeric cap with an explicit "unlimited" state, since -1 as a typed number is not discoverable. */
function LimitCell({
  value,
  unit,
  label,
  onChange,
}: {
  value: number;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}) {
  const unlimited = value === UNLIMITED;

  return (
    <div className="flex items-center gap-1.5">
      {unlimited ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="flex-1 rounded-lg border border-electric/30 bg-electric/10 px-2 py-1.5 text-xs font-medium text-electric transition-colors hover:bg-electric/15"
        >
          Unlimited
        </button>
      ) : (
        <>
          <Input
            type="number"
            min={0}
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
            className="px-2 py-1.5 text-xs"
            aria-label={label}
          />
          <button
            type="button"
            onClick={() => onChange(UNLIMITED)}
            title={`Unlimited ${unit}`}
            className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-xs text-alloy-faint transition-colors hover:border-electric/40 hover:text-electric"
          >
            ∞
          </button>
        </>
      )}
    </div>
  );
}

function PlanColumnHeader({
  draft,
  subscribers,
  dirty,
  saving,
  result,
  onChange,
  onSave,
  onDelete,
  onDiscard,
}: {
  draft: Draft;
  subscribers: number;
  dirty: boolean;
  saving: boolean;
  result?: { error?: string; success?: string };
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onDelete: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        value={draft.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Plan name"
        className="px-2 py-1.5 text-sm font-semibold"
        aria-label="Plan name"
      />

      <div className="flex items-center gap-1">
        <span className="text-xs text-alloy-faint">/</span>
        <Input
          value={draft.slug}
          onChange={(e) => onChange({ slug: e.target.value.toLowerCase() })}
          placeholder="slug"
          disabled={draft.is_system}
          className="px-2 py-1 text-xs"
          aria-label="Plan slug"
        />
      </div>

      <div className="flex gap-1">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={draft.price_amount}
          onChange={(e) => onChange({ price_amount: Math.max(0, Number(e.target.value) || 0) })}
          className="px-2 py-1 text-xs"
          aria-label="Price"
        />
        <Input
          value={draft.price_currency}
          onChange={(e) => onChange({ price_currency: e.target.value.toUpperCase().slice(0, 3) })}
          className="w-16 shrink-0 px-2 py-1 text-xs uppercase"
          aria-label="Currency"
          maxLength={3}
        />
      </div>

      <Select
        value={draft.billing_period}
        onChange={(e) => onChange({ billing_period: e.target.value as Draft["billing_period"] })}
        className="px-2 py-1 text-xs"
        aria-label="Billing period"
      >
        <option value="free">Free</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
        <option value="lifetime">Lifetime</option>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={draft.duration_days ?? 0}
          onChange={(e) => {
            const days = Math.max(0, Number(e.target.value) || 0);
            onChange({ duration_days: days === 0 ? null : days });
          }}
          className="px-2 py-1 text-xs"
          aria-label="Duration in days"
        />
        <span className="shrink-0 text-[11px] text-alloy-faint">days</span>
      </div>
      <p className="text-[11px] text-alloy-faint">
        {draft.duration_days ? `Expires after ${draft.duration_days} days` : "Never expires"}
      </p>

      <div className="space-y-1 pt-1">
        <label className="flex items-center gap-1.5 text-[11px] text-alloy-dim">
          <input
            type="checkbox"
            checked={draft.is_active}
            disabled={draft.is_system}
            onChange={(e) => onChange({ is_active: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-border accent-electric disabled:opacity-40"
          />
          Active
        </label>
        <label className="flex items-center gap-1.5 text-[11px] text-alloy-dim">
          <input
            type="checkbox"
            checked={draft.is_public}
            onChange={(e) => onChange({ is_public: e.target.checked })}
            className="h-3.5 w-3.5 rounded border-border accent-electric"
          />
          Publicly listed
        </label>
      </div>

      <p className="text-[11px] text-alloy-faint">
        {draft.id ? `${subscribers} subscriber${subscribers === 1 ? "" : "s"}` : "Not saved yet"}
        {draft.is_system && " · system plan"}
      </p>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className={cn("flex-1 px-2 py-1 text-xs", !dirty && "opacity-50")}
          disabled={saving || !dirty}
          onClick={onSave}
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </Button>
        {!draft.is_system && (
          <Button
            variant="danger"
            size="sm"
            className="px-2 py-1 text-xs"
            onClick={draft.id ? onDelete : onDiscard}
            aria-label={`Delete ${draft.name || "plan"}`}
          >
            ✕
          </Button>
        )}
      </div>

      {result?.error && <FieldError>{result.error}</FieldError>}
      {result?.success && <p className="text-[11px] text-electric">{result.success}</p>}
    </div>
  );
}
