import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserDetail } from "@/lib/repo/admin";
import { listPlans } from "@/lib/repo/plans";
import { listSubscriptionHistory } from "@/lib/repo/subscriptions";
import { listNotifications } from "@/lib/repo/notifications";
import { getCurrentAdmin, isSuperAdmin } from "@/lib/domain/current-admin";
import { hasLapsed } from "@/lib/domain/entitlements";
import { Card } from "@/components/ui/card";
import { PlanBadge } from "@/components/admin/plan-badge";
import { UserPlanPanel } from "@/components/admin/user-plan-panel";
import { UserActionsPanel } from "@/components/admin/user-actions-panel";

export const metadata = { title: "User" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, plans, history, notifications, admin] = await Promise.all([
    getUserDetail(id),
    listPlans(),
    listSubscriptionHistory(id),
    listNotifications(id, 10),
    getCurrentAdmin(),
  ]);

  if (!user) notFound();

  const expired = hasLapsed(user.expires_at);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-xs text-alloy-faint hover:text-alloy">
          ← Users
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-alloy">
            {user.display_name ?? user.username ?? user.email}
          </h1>
          <PlanBadge name={user.plan_name} price={user.plan_price} />
          {expired && (
            <span className="rounded-full bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-400">
              Expired
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-alloy-dim">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UserPlanPanel
            userId={user.id}
            plans={plans}
            currentPlanId={user.plan_id}
            expiresAt={user.expires_at}
          />

          <UserActionsPanel
            userId={user.id}
            email={user.email}
            role={user.role}
            canChangeRole={isSuperAdmin(admin) && admin?.id !== user.id}
          />

          <section>
            <h2 className="text-sm font-semibold text-alloy">Subscription history</h2>
            <Card className="mt-3 divide-y divide-border-soft">
              {history.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-alloy-dim">No subscriptions recorded.</p>
              ) : (
                history.map((sub) => (
                  <div key={sub.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alloy">{sub.plan.name}</p>
                      <p className="mt-0.5 text-xs text-alloy-faint">
                        {formatDateTime(sub.started_at)}
                        {sub.expires_at ? ` → ${formatDateTime(sub.expires_at)}` : " → no expiry"}
                        {sub.note ? ` · ${sub.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={
                        sub.status === "active"
                          ? "shrink-0 text-xs font-medium text-electric"
                          : "shrink-0 text-xs text-alloy-faint"
                      }
                    >
                      {sub.status}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-alloy">Recent notifications</h2>
            <Card className="mt-3 divide-y divide-border-soft">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-alloy-dim">Nothing sent yet.</p>
              ) : (
                notifications.map((note) => (
                  <div key={note.id} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-alloy">{note.title}</p>
                      <time className="shrink-0 text-xs text-alloy-faint">
                        {formatDateTime(note.created_at)}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-alloy-dim">{note.body}</p>
                    <p className="mt-1 text-[11px] text-alloy-faint">
                      {note.read_at ? "Read" : "Unread"}
                    </p>
                  </div>
                ))
              )}
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-alloy">Account</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row label="Handle" value={user.username ? `@${user.username}` : "—"} />
              <Row label="Role" value={user.role.replace("_", " ")} />
              <Row label="Verified" value={user.email_verified_at ? "Yes" : "No"} />
              <Row label="Joined" value={formatDateTime(user.created_at)} />
              <Row
                label="Expires"
                value={user.expires_at ? formatDateTime(user.expires_at) : "Never"}
              />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-alloy">Usage</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <Row label="Links" value={String(user.link_count)} />
              <Row label="Short links" value={String(user.short_link_count)} />
              <Row label="QR codes" value={String(user.qr_code_count)} />
              <Row label="Tracked events" value={user.total_events.toLocaleString()} />
            </dl>
            {user.username && (
              <Link
                href={`/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block text-xs text-electric hover:underline"
              >
                View public page ↗
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-alloy-faint">{label}</dt>
      <dd className="text-right capitalize text-alloy">{value}</dd>
    </div>
  );
}
