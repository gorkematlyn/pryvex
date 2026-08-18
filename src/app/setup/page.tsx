import { notFound } from "next/navigation";
import { countSuperAdmins } from "@/lib/repo/admin";
import { Logo } from "@/components/ui/logo";
import { SetupForm } from "@/components/admin/setup-form";

export const metadata = { title: "Set up Pryvex", robots: { index: false, follow: false } };

// Never cached: whether setup is still available changes exactly once, and
// serving a stale "available" render would show the form after the owner
// account exists.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // The route disables itself permanently the moment an owner exists —
  // there is no flag to unset and nothing to remember to remove from the
  // deployment. The matching check in the Server Action closes the gap
  // between this render and the submit.
  if ((await countSuperAdmins()) > 0) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-shadow px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="text-2xl" />
          <h1 className="mt-6 text-lg font-semibold text-alloy">Create the owner account</h1>
          <p className="mt-2 text-sm text-alloy-dim">
            This is a one-time step. Once this account exists, this page stops
            being reachable for good.
          </p>
        </div>
        <SetupForm />
      </div>
    </main>
  );
}
