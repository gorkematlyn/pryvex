import { requireProfile } from "@/lib/domain/current-user";
import { getUserSettings } from "@/lib/repo/user-settings";
import { findUserById } from "@/lib/repo/users";
import { SettingsForm } from "@/components/settings/settings-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile, userId } = await requireProfile();

  const [settings, user] = await Promise.all([getUserSettings(userId), findUserById(userId)]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Settings</h1>
        <p className="mt-1 text-sm text-alloy-dim">Account and tracking defaults.</p>
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
        </dl>
      </Card>

      {settings && <SettingsForm settings={settings} />}
    </div>
  );
}
