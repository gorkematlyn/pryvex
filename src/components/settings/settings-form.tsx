"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import { updateSettings } from "@/app/dashboard/settings/actions";
import type { UserSettingsRow } from "@/lib/db/types";

type Settings = UserSettingsRow;

export function SettingsForm({ settings }: { settings: Settings }) {
  const [source, setSource] = useState(settings.default_utm_source);
  const [medium, setMedium] = useState(settings.default_utm_medium);
  const [enabled, setEnabled] = useState(settings.auto_utm_enabled);
  const [error, setError] = useState<string | undefined>();
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await updateSettings({ default_utm_source: source, default_utm_medium: medium, auto_utm_enabled: enabled });
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-alloy">Automatic UTM tracking</h2>
        {status === "saved" && <span className="text-xs text-electric">Saved</span>}
      </div>
      <p className="mt-1 text-xs text-alloy-dim">
        Applied to every tracked redirect unless a link overrides it. Existing query parameters on destination URLs are never overwritten.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label className="flex items-center gap-3 text-sm text-alloy">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 rounded border-border accent-electric" />
          Automatically append UTM parameters
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="utm_source">Default utm_source</Label>
            <Input id="utm_source" value={source} onChange={(e) => setSource(e.target.value)} disabled={!enabled} />
          </div>
          <div>
            <Label htmlFor="utm_medium">Default utm_medium</Label>
            <Input id="utm_medium" value={medium} onChange={(e) => setMedium(e.target.value)} disabled={!enabled} />
          </div>
        </div>

        <p className="text-xs text-alloy-faint">
          utm_campaign defaults to your username (or short-link slug) and utm_content to the link&rsquo;s ID — both stay stable even if you rename things.
        </p>

        <FieldError>{error}</FieldError>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
