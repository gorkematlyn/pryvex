"use client";

import { useState } from "react";
import { updatePaymentSettings } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import type { PaymentSettings, PaymentProviderName } from "@/lib/repo/app-settings";

const PROVIDERS: { value: PaymentProviderName; label: string; note: string }[] = [
  { value: "none", label: "Disabled", note: "No checkout is shown to users." },
  { value: "paytr", label: "PayTR", note: "Turkish gateway. Renders an embedded payment frame." },
  { value: "paypal", label: "PayPal", note: "Redirects to PayPal to approve the order." },
  { value: "stripe", label: "Stripe", note: "Redirects to Stripe Checkout." },
];

export function PaymentSettingsForm({
  settings,
  webhookUrl,
}: {
  settings: PaymentSettings;
  webhookUrl: string;
}) {
  const [provider, setProvider] = useState<PaymentProviderName>(settings.provider);
  const [paytr, setPaytr] = useState(settings.paytr);
  const [paypal, setPaypal] = useState(settings.paypal);
  const [stripe, setStripe] = useState(settings.stripe);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  async function handleSave() {
    setPending(true);
    setResult({});
    setResult(await updatePaymentSettings({ provider, paytr, paypal, stripe }));
    setPending(false);
  }

  const activeNote = PROVIDERS.find((p) => p.value === provider)?.note;

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Payments</h2>
      <p className="mt-1 text-xs text-alloy-dim">
        Pick one gateway. Credentials are stored in the database and never sent back to the browser
        once saved.
      </p>

      <div className="mt-4">
        <Label htmlFor="provider">Gateway</Label>
        <Select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as PaymentProviderName)}
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
        {activeNote && <p className="mt-1.5 text-xs text-alloy-faint">{activeNote}</p>}
      </div>

      {provider !== "none" && (
        <div className="mt-4 rounded-xl border border-border bg-shadow-raised/60 p-3">
          <p className="text-xs font-medium text-alloy-dim">Webhook URL</p>
          <p className="mt-1 text-xs text-alloy-faint">
            Register this in the gateway dashboard so payments are confirmed.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-shadow px-2.5 py-2 text-xs text-alloy">
              {webhookUrl}
            </code>
            <CopyButton value={webhookUrl} />
          </div>
        </div>
      )}

      {provider === "paytr" && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="paytr-id">Merchant ID</Label>
            <Input
              id="paytr-id"
              value={paytr.merchant_id}
              onChange={(e) => setPaytr({ ...paytr, merchant_id: e.target.value })}
              placeholder="123456"
            />
          </div>
          <div>
            <Label htmlFor="paytr-key">Merchant Key</Label>
            <Input
              id="paytr-key"
              type="password"
              value={paytr.merchant_key}
              onChange={(e) => setPaytr({ ...paytr, merchant_key: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="paytr-salt">Merchant Salt</Label>
            <Input
              id="paytr-salt"
              type="password"
              value={paytr.merchant_salt}
              onChange={(e) => setPaytr({ ...paytr, merchant_salt: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-alloy">
            <input
              type="checkbox"
              checked={paytr.test_mode}
              onChange={(e) => setPaytr({ ...paytr, test_mode: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-electric"
            />
            Test mode
          </label>
        </div>
      )}

      {provider === "paypal" && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="pp-id">Client ID</Label>
            <Input
              id="pp-id"
              value={paypal.client_id}
              onChange={(e) => setPaypal({ ...paypal, client_id: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pp-secret">Client Secret</Label>
            <Input
              id="pp-secret"
              type="password"
              value={paypal.client_secret}
              onChange={(e) => setPaypal({ ...paypal, client_secret: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-alloy">
            <input
              type="checkbox"
              checked={paypal.sandbox}
              onChange={(e) => setPaypal({ ...paypal, sandbox: e.target.checked })}
              className="h-4 w-4 rounded border-border accent-electric"
            />
            Sandbox
          </label>
        </div>
      )}

      {provider === "stripe" && (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor="st-pub">Publishable Key</Label>
            <Input
              id="st-pub"
              value={stripe.publishable_key}
              onChange={(e) => setStripe({ ...stripe, publishable_key: e.target.value })}
              placeholder="pk_live_…"
            />
          </div>
          <div>
            <Label htmlFor="st-secret">Secret Key</Label>
            <Input
              id="st-secret"
              type="password"
              value={stripe.secret_key}
              onChange={(e) => setStripe({ ...stripe, secret_key: e.target.value })}
              placeholder="sk_live_…"
            />
          </div>
          <div>
            <Label htmlFor="st-webhook">Webhook Signing Secret</Label>
            <Input
              id="st-webhook"
              type="password"
              value={stripe.webhook_secret}
              onChange={(e) => setStripe({ ...stripe, webhook_secret: e.target.value })}
              placeholder="whsec_…"
            />
            <p className="mt-1 text-xs text-alloy-faint">
              Required — payments are ignored without a verifiable signature.
            </p>
          </div>
        </div>
      )}

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-2 text-xs text-electric">{result.success}</p>}

      <Button size="sm" className="mt-4" onClick={handleSave} disabled={pending}>
        {pending ? "Saving…" : "Save payment settings"}
      </Button>
    </Card>
  );
}
