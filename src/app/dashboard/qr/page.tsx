import { requireProfile } from "@/lib/domain/current-user";
import { getPrimaryBioPage } from "@/lib/repo/bio-pages";
import { listLinksByBioPage } from "@/lib/repo/links";
import { listShortLinksByProfile } from "@/lib/repo/short-links";
import { listQrCodesByProfile } from "@/lib/repo/qr-codes";
import { QrGenerator } from "@/components/qr/qr-generator";
import { QrList, type QrListItem } from "@/components/qr/qr-list";

export const metadata = { title: "QR Codes" };

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; id?: string }>;
}) {
  const { profile, userId } = await requireProfile();
  const { target, id } = await searchParams;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const bioPage = await getPrimaryBioPage(userId);
  const [links, shortLinks, qrCodes] = await Promise.all([
    bioPage ? listLinksByBioPage(bioPage.id) : Promise.resolve([]),
    listShortLinksByProfile(userId),
    listQrCodesByProfile(userId),
  ]);

  const shortLinkById = new Map(shortLinks.map((s) => [s.id, s.slug]));

  const items: QrListItem[] = qrCodes.map((qr) => {
    let url = `${appUrl}/${profile.username}?qr=${qr.id}`;
    if (qr.target_type === "link" && qr.target_link_id) url = `${appUrl}/go/${qr.target_link_id}?qr=${qr.id}`;
    if (qr.target_short_link_id) {
      const slug = shortLinkById.get(qr.target_short_link_id);
      if (slug) url = `${appUrl}/s/${slug}?qr=${qr.id}`;
    }
    return { id: qr.id, label: qr.label, target_type: qr.target_type, url };
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-alloy">QR Codes</h1>
        <p className="mt-1 text-sm text-alloy-dim">Generate scannable, trackable QR codes for your profile and links.</p>
      </div>

      <QrGenerator
        appUrl={appUrl}
        username={profile.username}
        links={links.map((l) => ({ id: l.id, title: l.title }))}
        shortLinks={shortLinks.map((s) => ({ id: s.id, slug: s.slug }))}
        defaultTarget={target as "profile" | "link" | "short_link" | "custom" | undefined}
        defaultId={id}
      />

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-alloy">Your QR codes</h2>
        <QrList items={items} />
      </div>
    </div>
  );
}
