import Link from "next/link";
import { requireProfile } from "@/lib/domain/current-user";
import { countUnread } from "@/lib/repo/notifications";
import { findUserById } from "@/lib/repo/users";
import { Logo } from "@/components/ui/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, userId } = await requireProfile();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [unreadCount, user] = await Promise.all([countUnread(userId), findUserById(userId)]);
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <div className="flex min-h-screen bg-shadow">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border-soft px-4 py-6 md:flex">
        <Link href="/dashboard" className="mb-8 px-2 text-xl">
          <Logo />
        </Link>
        <SidebarNav />
        <div className="mt-auto flex items-center gap-3 rounded-xl border border-border bg-shadow-raised px-3 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-electric to-ultraviolet text-xs font-semibold text-shadow">
            {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-alloy">{profile.display_name ?? profile.username}</p>
            <p className="truncate text-xs text-alloy-faint">@{profile.username}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-soft px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="text-sm font-medium text-alloy md:hidden">
              <Logo markOnly className="text-lg" />
            </span>
          </div>
          <Topbar
            username={profile.username}
            appUrl={appUrl}
            unreadCount={unreadCount}
            isAdmin={isAdmin}
          />
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
