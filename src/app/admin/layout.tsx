import Link from "next/link";
import { requireAdmin, isSuperAdmin } from "@/lib/domain/current-admin";
import { countOpenTickets } from "@/lib/repo/tickets";
import { expireLapsedSubscriptions } from "@/lib/repo/subscriptions";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata = {
  title: { default: "Admin", template: "%s · Pryvex Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts only proves the visitor is signed in; the role check needs the
  // database and happens here, so every /admin/* route inherits it.
  const admin = await requireAdmin();

  // Cheap enough to fold into the admin shell, and it keeps "expired"
  // accurate in the lists below without a scheduler.
  await expireLapsedSubscriptions();
  const openTickets = await countOpenTickets();

  return (
    <div className="flex min-h-screen bg-shadow">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border-soft px-4 py-6 lg:flex">
        <Link href="/admin" className="mb-2 px-2 text-xl">
          <Logo />
        </Link>
        <p className="mb-8 px-2 text-xs font-medium uppercase tracking-wider text-alloy-faint">
          Administration
        </p>

        <AdminNav isSuperAdmin={isSuperAdmin(admin)} openTickets={openTickets} />

        <div className="mt-auto space-y-3">
          <Link
            href="/dashboard"
            className="block rounded-xl border border-border px-3 py-2.5 text-center text-sm text-alloy-dim transition-colors hover:border-alloy-faint hover:text-alloy"
          >
            Back to dashboard
          </Link>
          <div className="rounded-xl border border-border bg-shadow-raised px-3 py-3">
            <p className="truncate text-sm font-medium text-alloy">{admin.email}</p>
            <p className="mt-0.5 text-xs text-alloy-faint">
              {admin.role === "super_admin" ? "Super admin" : "Admin"}
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-soft px-4 py-4 lg:hidden">
          <Link href="/admin">
            <Logo markOnly className="text-lg" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/dashboard" className="px-2 text-sm text-alloy-dim hover:text-alloy">
              Dashboard
            </Link>
          </div>
        </header>

        <div className="hidden items-center justify-end border-b border-border-soft px-4 py-2.5 lg:flex md:px-8">
          <ThemeToggle />
        </div>

        <div className="border-b border-border-soft px-4 py-3 lg:hidden">
          <AdminNav isSuperAdmin={isSuperAdmin(admin)} openTickets={openTickets} />
        </div>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
