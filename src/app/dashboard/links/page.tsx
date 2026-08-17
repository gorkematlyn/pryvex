import { requireProfile } from "@/lib/domain/current-user";
import { listShortLinksByProfile } from "@/lib/repo/short-links";
import { countShortLinkClicks } from "@/lib/repo/link-events";
import { ShortLinkForm } from "@/components/links/short-link-form";
import { ShortLinkRow } from "@/components/links/short-link-row";

export const metadata = { title: "Short Links" };

export default async function ShortLinksPage() {
  const { userId } = await requireProfile();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const [links, clickCounts] = await Promise.all([
    listShortLinksByProfile(userId),
    countShortLinkClicks(userId),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-alloy">Short Links</h1>
        <p className="mt-1 text-sm text-alloy-dim">Shorten any URL and track every click through Pryvex analytics.</p>
      </div>

      <ShortLinkForm />

      <div className="mt-6 space-y-2">
        {links.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-alloy-faint">
            No short links yet.
          </p>
        )}
        {links.map((link) => (
          <ShortLinkRow key={link.id} link={link} clicks={clickCounts.get(link.id) ?? 0} appUrl={appUrl} />
        ))}
      </div>
    </div>
  );
}
