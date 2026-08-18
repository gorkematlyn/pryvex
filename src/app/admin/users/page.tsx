import Link from "next/link";
import { listUsers, type UserListFilter } from "@/lib/repo/admin";
import { listPlans } from "@/lib/repo/plans";
import { hasLapsed } from "@/lib/domain/entitlements";
import { Card } from "@/components/ui/card";
import { UserFilters } from "@/components/admin/user-filters";
import { BulkPlanBar } from "@/components/admin/bulk-plan-bar";
import { PlanBadge } from "@/components/admin/plan-badge";

export const metadata = { title: "Users" };

const PAGE_SIZE = 50;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; plan?: string; status?: string; role?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const filter: UserListFilter = {
    search: params.q || undefined,
    planId: params.plan || undefined,
    role: (params.role as UserListFilter["role"]) || undefined,
    status: (params.status as UserListFilter["status"]) || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const [{ items, total }, plans] = await Promise.all([listUsers(filter), listPlans()]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-alloy">Users</h1>
          <p className="mt-1 text-sm text-alloy-dim">
            {total.toLocaleString()} account{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <UserFilters plans={plans} />

      <BulkPlanBar plans={plans} />

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-alloy-dim">No accounts match these filters.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-xs uppercase tracking-wide text-alloy-faint">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {items.map((user) => {
                const expired = hasLapsed(user.expires_at);
                return (
                  <tr key={user.id} className="transition-colors hover:bg-shadow-elevated/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`} className="block min-w-0">
                        <span className="block truncate font-medium text-alloy hover:text-electric">
                          {user.display_name ?? user.username ?? user.email}
                        </span>
                        <span className="block truncate text-xs text-alloy-faint">{user.email}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge name={user.plan_name} price={user.plan_price} />
                    </td>
                    <td className="px-4 py-3 text-alloy-dim">
                      {user.expires_at ? (
                        <span className={expired ? "text-red-400" : undefined}>
                          {formatDate(user.expires_at)}
                        </span>
                      ) : (
                        <span className="text-alloy-faint">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-alloy-dim">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {user.role !== "user" && (
                          <span className="rounded-full bg-ultraviolet/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ultraviolet">
                            {user.role === "super_admin" ? "Owner" : "Admin"}
                          </span>
                        )}
                        {user.email_verified_at ? (
                          <span className="text-xs text-alloy-faint">Verified</span>
                        ) : (
                          <span className="text-xs text-amber-400">Unverified</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <PageLink page={page - 1} disabled={page <= 1} params={params} label="Previous" />
          <span className="text-alloy-faint">
            Page {page} of {totalPages}
          </span>
          <PageLink page={page + 1} disabled={page >= totalPages} params={params} label="Next" />
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  params,
  label,
}: {
  page: number;
  disabled: boolean;
  params: Record<string, string | undefined>;
  label: string;
}) {
  if (disabled) {
    return <span className="cursor-not-allowed text-alloy-faint/50">{label}</span>;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") search.set(key, value);
  }
  search.set("page", String(page));
  return (
    <Link href={`/admin/users?${search.toString()}`} className="text-electric hover:underline">
      {label}
    </Link>
  );
}
