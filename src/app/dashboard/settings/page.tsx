import Link from "next/link";
import { requireProfile } from "@/lib/domain/current-user";
import { getEntitlements } from "@/lib/domain/entitlements";
import { getUserSettings } from "@/lib/repo/user-settings";
import { findUserById } from "@/lib/repo/users";
import { SettingsForm } from "@/components/settings/settings-form";
import { VisibilityForm } from "@/components/settings/visibility-form";
import { IntegrationsForm } from "@/components/settings/integrations-form";
import { Card } from "@/components/ui/card";
import { LockedFeature } from "@/components/ui/locked-feature";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile, userId } = await requireProfile();

  const [settings, user, entitlements] = await Promise.all([
    getUserSettings(userId),
    findUserById(userId),
    getEntitlements(userId),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Settings</h1>
        <p className="mt-1 text-sm text-alloy-dim">Account, discoverability and tracking.</p>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-alloy">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-alloy-faint">Email</dt>
            <dd className="text-alloy">{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-alloy-faint">Username</dt>
            <dd className="text-alloy">@{profile.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-alloy-faint">Plan</dt>
            <dd className="text-alloy">
              <Link href="/dashboard/billing" className="text-electric hover:underline">
                {entitlements.plan?.name ?? "—"}
              </Link>
            </dd>
          </div>
        </dl>
      </Card>

      {settings && <VisibilityForm settings={settings} username={profile.username} />}

      {settings && (
        <LockedFeature
          locked={!entitlements.features.utm_configuration}
          label="UTM configuration"
        >
          <SettingsForm settings={settings} />
        </LockedFeature>
      )}

      {settings && <IntegrationsForm settings={settings} entitlements={entitlements} />}
    </div>
  );
}
