import { NextResponse, after } from "next/server";
import { getShortLinkBySlug } from "@/lib/repo/short-links";
import { getUserSettings } from "@/lib/repo/user-settings";
import { recordEvent } from "@/lib/domain/tracking";
import { buildTrackedDestination } from "@/lib/domain/utm";
import type { TrafficSource } from "@/lib/db/types";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const qrCodeId = searchParams.get("qr");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const shortLink = await getShortLinkBySlug(slug);

  if (!shortLink || !shortLink.is_active) {
    return NextResponse.redirect(new URL("/", appUrl));
  }
  if (shortLink.expires_at && new Date(shortLink.expires_at) < new Date()) {
    return NextResponse.redirect(new URL("/", appUrl));
  }

  const settings = await getUserSettings(shortLink.profile_id);

  let destination = shortLink.destination_url;
  if (settings?.auto_utm_enabled !== false) {
    destination = buildTrackedDestination(
      shortLink.destination_url,
      {
        source: settings?.default_utm_source ?? "pryvex",
        medium: "short_link",
        campaign: shortLink.slug,
        content: shortLink.id,
      },
      shortLink.utm_overrides,
    );
  }

  const trafficSource: TrafficSource = qrCodeId ? "qr_code" : "short_link";

  after(() =>
    recordEvent({
      profileId: shortLink.profile_id,
      eventType: qrCodeId ? "qr_scan" : "short_link_click",
      shortLinkId: shortLink.id,
      qrCodeId,
      trafficSource,
      request,
    }),
  );

  return NextResponse.redirect(destination, { status: 302 });
}
