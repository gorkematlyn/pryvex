"use client";

import { useState } from "react";
import { bulkNotify, type Audience } from "@/app/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { NotificationLevel, PlanRow } from "@/lib/db/types";

export function BulkNotifyForm({ plans }: { plans: PlanRow[] }) {
  const [scope, setScope] = useState<Audience["scope"]>("all");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState<NotificationLevel>("info");
  const [actionUrl, setActionUrl] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  // Messaging every account is not undoable and lands in every inbox, so it
  // asks for the same typed confirmation as bulk plan changes.
  const needsConfirm = scope === "all";
  const confirmed = !needsConfirm || confirmText.trim().toUpperCase() === "SEND TO ALL";

  async function handleSend() {
    setPending(true);
    setResult({});

    const response = await bulkNotify({
      audience: scope === "plan" ? { scope: "plan", planId } : { scope: "all" },
      title,
      body,
      level,
      actionUrl: actionUrl.trim() || undefined,
    });

    setPending(false);
    setResult(response);
    if (response.success) {
      setTitle("");
      setBody("");
      setActionUrl("");
      setConfirmText("");
    }
  }

  return (
    <Card className="p-5">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="audience">Audience</Label>
            <Select
              id="audience"
              value={scope}
              onChange={(e) => setScope(e.target.value as Audience["scope"])}
            >
              <option value="all">Every account</option>
              <option value="plan">Everyone on a plan</option>
            </Select>
          </div>

          {scope === "plan" && (
            <div>
              <Label htmlFor="audience-plan">Plan</Label>
              <Select id="audience-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="notify-title">Title</Label>
          <Input
            id="notify-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Scheduled maintenance on Sunday"
            maxLength={120}
          />
        </div>

        <div>
          <Label htmlFor="notify-body">Message</Label>
          <Textarea
            id="notify-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What do they need to know?"
            maxLength={1000}
          />
          <p className="mt-1 text-xs text-alloy-faint">{body.length}/1000</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="notify-level">Level</Label>
            <Select
              id="notify-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as NotificationLevel)}
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="notify-url">Link (optional)</Label>
            <Input
              id="notify-url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="/dashboard/billing"
            />
          </div>
        </div>

        {needsConfirm && (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3">
            <p className="text-xs text-amber-300">
              This reaches every account on the instance. Type{" "}
              <strong className="font-semibold">SEND TO ALL</strong> to confirm.
            </p>
            <Input
              className="mt-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SEND TO ALL"
              aria-label="Type SEND TO ALL to confirm"
            />
          </div>
        )}

        <FieldError>{result.error}</FieldError>
        {result.success && <p className="text-xs text-electric">{result.success}</p>}

        <Button
          onClick={handleSend}
          disabled={pending || !title.trim() || !body.trim() || !confirmed}
        >
          {pending ? "Sending…" : "Send notification"}
        </Button>
      </div>
    </Card>
  );
}
