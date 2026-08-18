import { listPlans } from "@/lib/repo/plans";
import { BulkNotifyForm } from "@/components/admin/bulk-notify-form";

export const metadata = { title: "Notifications" };

export default async function AdminNotificationsPage() {
  const plans = await listPlans();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Notifications</h1>
        <p className="mt-1 text-sm text-alloy-dim">
          Send an in-app message. It appears in the recipient&rsquo;s notification list the next time
          they load the dashboard.
        </p>
      </div>

      <BulkNotifyForm plans={plans} />
    </div>
  );
}
