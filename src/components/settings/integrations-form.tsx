"use client";

import { useState } from "react";
import { updateIntegrations } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import { LockedFeature } from "@/components/ui/locked-feature";
import type { UserSettingsRow } from "@/lib/db/types";
import type { Entitlements } from "@/lib/domain/entitlements";

export function IntegrationsForm({
  settings,
  entitlements,
}: {
  settings: UserSettingsRow;
  entitlements: Entitlements;
}) {
  const [ga, setGa] = useState(settings.google_analytics_id ?? "");
  const [pixel, setPixel] = useState(settings.meta_pixel_id ?? "");
  const [capi, setCapi] = useState(settings.meta_conversion_api_token ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved">("idle");
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await updateIntegrations({
      google_analytics_id: ga,
      meta_pixel_id: pixel,
      meta_conversion_api_token: capi,
    });
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
        <h2 className="text-sm font-semibold text-alloy">Integrations</h2>
        {status === "saved" && <span className="text-xs text-electric">Saved</span>}
      </div>
      <p className="mt-1 text-xs text-alloy-dim">
        Optional third-party tracking on your public page. Pryvex analytics work without any of
        these.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <LockedFeature
          locked={!entitlements.features.integration_google_analytics}
          label="Google Analytics"
        >
          <div>
            <Label htmlFor="ga-id">Google Analytics measurement ID</Label>
            <Input
              id="ga-id"
              value={ga}
              onChange={(e) => setGa(e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
        </LockedFeature>

        <LockedFeature locked={!entitlements.features.integration_meta_pixel} label="Meta Pixel">
          <div>
            <Label htmlFor="pixel-id">Meta Pixel ID</Label>
            <Input
              id="pixel-id"
              value={pixel}
              onChange={(e) => setPixel(e.target.value)}
              placeholder="123456789012345"
              inputMode="numeric"
            />
          </div>
        </LockedFeature>

        <LockedFeature
          locked={!entitlements.features.integration_meta_capi}
          label="Meta Conversions API"
        >
          <div>
            <Label htmlFor="capi-token">Meta Conversions API token</Label>
            <Input
              id="capi-token"
              type="password"
              value={capi}
              onChange={(e) => setCapi(e.target.value)}
              placeholder="EAA…"
            />
            <p className="mt-1.5 text-xs text-alloy-faint">
              Stored server-side and never exposed to your page visitors.
            </p>
          </div>
        </LockedFeature>

        <FieldError>{error}</FieldError>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </form>
    </Card>
  );
}
