"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePlanAction } from "@/app/admin/plans/actions";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { FieldError } from "@/components/ui/card";

/**
 * Deleting a plan that still has subscribers is not a simple destructive
 * action — those accounts have to land somewhere, so the dialog makes the
 * destination an explicit, required choice rather than a silent default.
 */
export function DeletePlanDialog({
  plan,
  otherPlans,
  subscribers,
  onClose,
  onLocalRemove,
}: {
  plan: { id: string | null; name: string };
  otherPlans: { id: string; name: string }[];
  subscribers: number;
  onClose: () => void;
  onLocalRemove: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [migrateTo, setMigrateTo] = useState(otherPlans[0]?.id ?? "");
  const [notify, setNotify] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // A draft column that was never saved has no rows to clean up.
  if (!plan.id) {
    onLocalRemove();
    return null;
  }

  async function handleDelete() {
    if (!plan.id) return;
    setPending(true);
    setError(undefined);

    const result = await deletePlanAction({
      planId: plan.id,
      migrateToPlanId: migrateTo,
      notify,
    });

    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-shadow/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-plan-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-border bg-shadow-elevated p-6 outline-none"
      >
        <h2 id="delete-plan-title" className="text-base font-semibold text-alloy">
          Delete {plan.name}?
        </h2>

        {subscribers > 0 ? (
          <>
            <div className="mt-3 rounded-xl border border-amber-900/50 bg-amber-950/20 p-3">
              <p className="text-sm text-amber-300">
                {subscribers} account{subscribers === 1 ? " is" : "s are"} currently on this plan.
              </p>
              <p className="mt-1 text-xs text-amber-300/80">
                They must be moved to another plan — their entitlements change immediately.
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="migrate-to">Move subscribers to</Label>
              <Select
                id="migrate-to"
                value={migrateTo}
                onChange={(e) => setMigrateTo(e.target.value)}
              >
                {otherPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            <label className="mt-3 flex items-start gap-2.5 text-sm text-alloy">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-electric"
              />
              <span>
                Notify them
                <span className="mt-0.5 block text-xs text-alloy-faint">
                  Tells them the plan was retired and that they need to pick a plan at their next
                  renewal.
                </span>
              </span>
            </label>
          </>
        ) : (
          <p className="mt-3 text-sm text-alloy-dim">
            No accounts are on this plan, so nothing else is affected. This cannot be undone.
          </p>
        )}

        <FieldError>{error}</FieldError>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={pending || (subscribers > 0 && !migrateTo)}
          >
            {pending ? "Deleting…" : "Delete plan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
