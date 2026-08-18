"use client";

import { useState } from "react";
import { updateBrandingSettings } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { BrandingSettings } from "@/lib/repo/app-settings";

export function BrandingForm({ settings }: { settings: BrandingSettings }) {
  const [email, setEmail] = useState(settings.support_email);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  async function handleSave() {
    setPending(true);
    setResult({});
    setResult(await updateBrandingSettings({ support_email: email }));
    setPending(false);
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Support</h2>
      <div className="mt-4 max-w-sm">
        <Label htmlFor="support-email">Public support email</Label>
        <Input
          id="support-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="support@example.com"
        />
        <p className="mt-1.5 text-xs text-alloy-faint">
          Shown on the user support page alongside the ticket form. Leave blank to hide it.
        </p>
      </div>

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-2 text-xs text-electric">{result.success}</p>}

      <Button size="sm" className="mt-4" onClick={handleSave} disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
