import { requireProfile } from "@/lib/domain/current-user";
import { getPrimaryBioPage } from "@/lib/repo/bio-pages";
import { listLinksByBioPage } from "@/lib/repo/links";
import { EditorShell } from "@/components/editor/editor-shell";

export const metadata = { title: "Link in Bio" };

export default async function DashboardEditorPage() {
  const { profile, userId } = await requireProfile();

  const bioPage = await getPrimaryBioPage(userId);
  const links = bioPage ? await listLinksByBioPage(bioPage.id) : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-alloy">Link in Bio</h1>
        <p className="mt-1 text-sm text-alloy-dim">Build and reorder your public page. Changes save instantly.</p>
      </div>
      <EditorShell initialLinks={links} profile={profile} />
    </div>
  );
}
