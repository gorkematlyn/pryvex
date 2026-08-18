"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  superAdminOnly?: boolean;
  badge?: number;
}

export function AdminNav({
  isSuperAdmin,
  openTickets,
  onNavigate,
}: {
  isSuperAdmin: boolean;
  openTickets: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/plans", label: "Plans", superAdminOnly: true },
    { href: "/admin/tickets", label: "Support", badge: openTickets },
    { href: "/admin/notifications", label: "Notifications" },
    { href: "/admin/settings", label: "Settings", superAdminOnly: true },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items
        .filter((item) => !item.superAdminOnly || isSuperAdmin)
        .map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-shadow-elevated text-alloy"
                  : "text-alloy-dim hover:bg-shadow-elevated/60 hover:text-alloy",
              )}
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-electric/15 px-2 py-0.5 text-xs font-semibold text-electric">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
    </nav>
  );
}
