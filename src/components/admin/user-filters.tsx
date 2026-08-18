"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Input, Select } from "@/components/ui/input";
import type { PlanRow } from "@/lib/db/types";

export function UserFilters({ plans }: { plans: PlanRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Any filter change invalidates the current offset.
    params.delete("page");
    startTransition(() => router.push(`/admin/users?${params.toString()}`));
  }

  // Debounced so typing a query doesn't fire a navigation per keystroke.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => apply({ q: search }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="sm:col-span-2 lg:col-span-1">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email or handle…"
          aria-label="Search users"
        />
      </div>

      <Select
        value={searchParams.get("plan") ?? ""}
        onChange={(e) => apply({ plan: e.target.value })}
        aria-label="Filter by plan"
      >
        <option value="">All plans</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </Select>

      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        aria-label="Filter by subscription status"
      >
        <option value="">Any status</option>
        <option value="active">Active</option>
        <option value="expiring">Expiring in 7 days</option>
        <option value="expired">Expired</option>
      </Select>

      <Select
        value={searchParams.get("role") ?? ""}
        onChange={(e) => apply({ role: e.target.value })}
        aria-label="Filter by role"
      >
        <option value="">Any role</option>
        <option value="user">Users</option>
        <option value="admin">Admins</option>
        <option value="super_admin">Super admins</option>
      </Select>
    </div>
  );
}
