import { listPlans, countSubscribersByPlan } from "@/lib/repo/plans";
import { PlansMatrix } from "@/components/admin/plans-matrix";

export const metadata = { title: "Plans" };

export default async function AdminPlansPage() {
  const [plans, subscriberCounts] = await Promise.all([listPlans(), countSubscribersByPlan()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Plans</h1>
        <p className="mt-1 text-sm text-alloy-dim">
          Every plan side by side. Tick what each one includes — unticked capabilities appear locked
          in the user&rsquo;s dashboard.
        </p>
      </div>

      <PlansMatrix plans={plans} subscriberCounts={subscriberCounts} />
    </div>
  );
}
