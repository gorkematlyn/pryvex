import { notFound } from "next/navigation";
import { after } from "next/server";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getProfileByUsername } from "@/lib/repo/profiles";
import { getPublishedPrimaryBioPage } from "@/lib/repo/bio-pages";
import { listEnabledLinksByBioPage } from "@/lib/repo/links";
import { getUserSettings } from "@/lib/repo/user-settings";
import type { UserSettingsRow } from "@/lib/db/types";
import { recordEvent } from "@/lib/domain/tracking";
import { ProfilePreview } from "@/components/bio/profile-preview";

export const revalidate = 60;

async function getPageData(usernameParam: string) {
  const profile = await getProfileByUsername(usernameParam);
  if (!profile) return null;

  const bioPage = await getPublishedPrimaryBioPage(profile.id);
  if (!bioPage) return null;

  const [links, settings] = await Promise.all([
    listEnabledLinksByBioPage(bioPage.id),
    getUserSettings(profile.id),
  ]);

  return { profile, bioPage, links, settings };
}

/**
 * Translates the owner's discoverability choices into robots directives.
 *
 * Search visibility drives the standard index/follow pair. AI visibility is
 * expressed through the directives the major AI crawlers actually read —
 * `noai`/`noimageai` plus per-bot `nocache` — since there is no single
 * standard one. These are honoured voluntarily, which is exactly what the
 * settings copy tells the user.
 */
function robotsFor(settings: UserSettingsRow | null): string {
  const searchVisible = settings?.search_engine_visible ?? true;
  const llmVisible = settings?.llm_visible ?? true;

  // Built as a string rather than Next's object form because `noai` /
  // `noimageai` are not part of that typed shape, and they are the
  // directives AI crawlers actually look for.
  const directives = searchVisible ? ["index", "follow"] : ["noindex", "nofollow"];
  if (!llmVisible) directives.push("noai", "noimageai");

  return directives.join(", ");
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const data = await getPageData(username);
  if (!data) return { title: "Not found" };

  const { profile, bioPage, settings } = data;
  const title = bioPage.seo_title || `${profile.display_name ?? profile.username} (@${profile.username})`;
  const description = bioPage.seo_description || profile.bio || `${profile.display_name ?? profile.username} on Pryvex`;
  const ogImage = `/api/og/${encodeURIComponent(profile.username)}`;

  return {
    title,
    description,
    robots: robotsFor(settings),
    alternates: { canonical: `/${profile.username}` },
    openGraph: {
      title,
      description,
      url: `/${profile.username}`,
      type: "profile",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { username } = await params;
  const { qr } = await searchParams;
  const data = await getPageData(username);
  if (!data) notFound();

  const { profile, links } = data;

  const requestHeaders = await headers();
  after(() =>
    recordEvent({
      profileId: profile.id,
      eventType: "profile_view",
      trafficSource: qr ? "qr_code" : "bio_page",
      qrCodeId: qr ?? null,
      request: { headers: requestHeaders },
    }),
  );

  return (
    // force-dark on the full-bleed outer element, not just the centered
    // column — otherwise the empty margin on wide viewports would fall back
    // to <body>'s theme (which does follow the visitor's preference),
    // producing a light seam around an otherwise-dark card.
    <main className="force-dark min-h-screen bg-shadow">
      <div className="mx-auto max-w-md">
        <ProfilePreview
          profile={profile}
          links={links}
          linkHrefFor={(link) => `/go/${link.id}`}
        />
      </div>
    </main>
  );
}
