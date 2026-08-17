import { NextResponse, after } from "next/server";
import { getLinkById } from "@/lib/repo/links";
import { getBioPageById } from "@/lib/repo/bio-pages";
import { getUserSettings } from "@/lib/repo/user-settings";
import { getProfileById } from "@/lib/repo/profiles";
import { recordEvent } from "@/lib/domain/tracking";
import { buildTrackedDestination } from "@/lib/domain/utm";
import type { TrafficSource } from "@/lib/db/types";

export const runtime = "nodejs";

/**
 * Tracked redirect for link-in-bio buttons: resolve -> record -> redirect.
 * The click event is recorded via `after()` so it never adds latency to
 * the visitor's redirect, and a failed write never blocks navigation.
 */
export async function GET(request: Request, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params;
  const { searchParams } = new URL(request.url);
  const qrCodeId = searchParams.get("qr");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const link = await getLinkById(linkId);
  if (!link || !link.is_enabled) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  const bioPage = await getBioPageById(link.bio_page_id);
  if (!bioPage?.is_published) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  const [settings, profile] = await Promise.all([
    getUserSettings(link.profile_id),
    getProfileById(link.profile_id),
  ]);

  let destination = link.url;
  if (settings?.auto_utm_enabled !== false) {
    destination = buildTrackedDestination(
      link.url,
      {
        source: settings?.default_utm_source ?? "pryvex",
        medium: settings?.default_utm_medium ?? "link_in_bio",
        campaign: profile?.username ?? "pryvex",
        content: link.id,
      },
      link.utm_overrides,
    );
  }

  const trafficSource: TrafficSource = qrCodeId ? "qr_code" : "bio_page";

  after(() =>
    recordEvent({
      profileId: link.profile_id,
      eventType: qrCodeId ? "qr_scan" : "link_click",
      linkId: link.id,
      qrCodeId,
      trafficSource,
      request,
    }),
  );

  return NextResponse.redirect(destination, { status: 302 });
}
