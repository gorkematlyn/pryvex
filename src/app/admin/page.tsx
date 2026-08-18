import Link from "next/link";
import { getOverviewStats, listAuditLog } from "@/lib/repo/admin";
import { listPlans, countSubscribersByPlan } from "@/lib/repo/plans";
import { StatTile } from "@/components/analytics/stat-tile";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Overview" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOverviewPage() {
  const [stats, plans, subscriberCounts, audit] = await Promise.all([
    getOverviewStats(),
    listPlans(),
    countSubscribersByPlan(),
    listAuditLog(12),
  ]);

  const totalSubscribers = Object.values(subscriberCounts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Overview</h1>
        <p className="mt-1 text-sm text-alloy-dim">Instance health at a glance.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total users" value={stats.total_users} sublabel={`${stats.new_users_7d} new in 7 days`} />
        <StatTile
          label="Verified"
          value={stats.verified_users}
          sublabel={
            stats.total_users > 0
              ? `${Math.round((stats.verified_users / stats.total_users) * 100)}% of accounts`
              : "No accounts yet"
          }
        />
        <StatTile label="Paid subscribers" value={stats.paid_subscribers} sublabel={`${stats.expiring_7d} expiring in 7 days`} />
        <StatTile
          label="Revenue (30d)"
          value={stats.revenue_30d.toLocaleString(undefined, { style: "currency", currency: "USD" })}
          sublabel="Recorded payments"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Tracked events (30d)" value={stats.total_events_30d.toLocaleString()} />
        <StatTile label="Open tickets" value={stats.open_tickets} sublabel="Awaiting a reply" />
      </div>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-alloy">Plan distribution</h2>
          <Link href="/admin/plans" className="text-xs text-electric hover:underline">
            Manage plans
          </Link>
        </div>

        <Card className="mt-3 divide-y divide-border-soft">
          {plans.map((plan) => {
            const count = subscriberCounts[plan.id] ?? 0;
            const share = totalSubscribers > 0 ? (count / totalSubscribers) * 100 : 0;
            return (
              <div key={plan.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-alloy">{plan.name}</span>
                    {!plan.is_active && (
                      <span className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-alloy-faint">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-shadow-raised">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-electric to-ultraviolet"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
                <div className="w-24 shrink-0 text-right">
                  <p className="text-sm font-semibold text-alloy">{count}</p>
                  <p className="text-xs text-alloy-faint">{share.toFixed(0)}%</p>
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-alloy">Recent admin activity</h2>
        {audit.length === 0 ? (
          <Card className="mt-3 p-6 text-center">
            <p className="text-sm text-alloy-dim">No admin actions recorded yet.</p>
          </Card>
        ) : (
          <Card className="mt-3 divide-y divide-border-soft">
            {audit.map((entry) => (
              <div key={entry.id} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-alloy">
                    <span className="font-medium">{entry.action}</span>
                    {entry.target_type && (
                      <span className="text-alloy-faint"> · {entry.target_type}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-alloy-faint">{entry.actor_email ?? "system"}</p>
                </div>
                <time className="shrink-0 text-xs text-alloy-faint">{formatDate(entry.created_at)}</time>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
