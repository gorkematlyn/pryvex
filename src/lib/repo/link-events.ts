import { query } from "@/lib/db/pool";
import type { EventType, LinkEventRow, TrafficSource } from "@/lib/db/types";

export interface InsertLinkEventInput {
  profileId: string;
  eventType: EventType;
  linkId?: string | null;
  shortLinkId?: string | null;
  qrCodeId?: string | null;
  trafficSource: TrafficSource;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  deviceCategory: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  visitorId: string | null;
}

export async function insertLinkEvent(input: InsertLinkEventInput): Promise<void> {
  await query(
    `insert into link_events
       (profile_id, event_type, link_id, short_link_id, qr_code_id, traffic_source, referrer,
        utm_source, utm_medium, utm_campaign, utm_content, device_category, browser, os, country, visitor_id)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      input.profileId,
      input.eventType,
      input.linkId ?? null,
      input.shortLinkId ?? null,
      input.qrCodeId ?? null,
      input.trafficSource,
      input.referrer,
      input.utmSource,
      input.utmMedium,
      input.utmCampaign,
      input.utmContent,
      input.deviceCategory,
      input.browser,
      input.os,
      input.country,
      input.visitorId,
    ],
  );
}

export function listEventsForProfileInRange(profileId: string, from: Date, to: Date): Promise<LinkEventRow[]> {
  return query<LinkEventRow>(
    `select * from link_events
     where profile_id = $1 and created_at >= $2 and created_at <= $3
     order by created_at asc
     limit 20000`,
    [profileId, from.toISOString(), to.toISOString()],
  );
}

export async function countShortLinkClicks(profileId: string): Promise<Map<string, number>> {
  const rows = await query<{ short_link_id: string; count: string }>(
    `select short_link_id, count(*)::text as count from link_events
     where profile_id = $1 and event_type = 'short_link_click' and short_link_id is not null
     group by short_link_id`,
    [profileId],
  );
  return new Map(rows.map((r) => [r.short_link_id, Number(r.count)]));
}
