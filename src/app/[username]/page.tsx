import { notFound } from "next/navigation";
import { after } from "next/server";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getProfileByUsername } from "@/lib/repo/profiles";
import { getPublishedPrimaryBioPage } from "@/lib/repo/bio-pages";
import { listEnabledLinksByBioPage } from "@/lib/repo/links";
import { recordEvent } from "@/lib/domain/tracking";
import { ProfilePreview } from "@/components/bio/profile-preview";

export const revalidate = 60;

async function getPageData(usernameParam: string) {
  const profile = await getProfileByUsername(usernameParam);
  if (!profile) return null;

  const bioPage = await getPublishedPrimaryBioPage(profile.id);
  if (!bioPage) return null;

  const links = await listEnabledLinksByBioPage(bioPage.id);

  return { profile, bioPage, links };
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const data = await getPageData(username);
  if (!data) return { title: "Not found" };

  const { profile, bioPage } = data;
  const title = bioPage.seo_title || `${profile.display_name ?? profile.username} (@${profile.username})`;
  const description = bioPage.seo_description || profile.bio || `${profile.display_name ?? profile.username} on Pryvex`;
  const ogImage = `/api/og/${encodeURIComponent(profile.username)}`;

  return {
    title,
    description,
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
    <main className="mx-auto min-h-screen max-w-md bg-shadow">
      <ProfilePreview
        profile={profile}
        links={links}
        linkHrefFor={(link) => `/go/${link.id}`}
      />
    </main>
  );
}
