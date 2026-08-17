import type { LinkEventRow } from "@/lib/db/types";

type EventRow = LinkEventRow;

export type DateRangeKey = "today" | "7d" | "30d" | "90d";

export function resolveDateRange(key: DateRangeKey | null): { from: Date; to: Date; label: string } {
  const to = new Date();
  const from = new Date();
  switch (key) {
    case "today":
      from.setHours(0, 0, 0, 0);
      return { from, to, label: "Today" };
    case "90d":
      from.setDate(from.getDate() - 90);
      return { from, to, label: "Last 90 days" };
    case "30d":
      from.setDate(from.getDate() - 30);
      return { from, to, label: "Last 30 days" };
    case "7d":
    default:
      from.setDate(from.getDate() - 7);
      return { from, to, label: "Last 7 days" };
  }
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueViews: number;
  totalClicks: number;
  uniqueClicks: number;
  ctr: number;
  bioTraffic: number;
  shortLinkTraffic: number;
  qrTraffic: number;
  directTraffic: number;
  byDay: { date: string; views: number; clicks: number }[];
  topLinks: { linkId: string; clicks: number }[];
  referrers: { key: string; count: number }[];
  devices: { key: string; count: number }[];
  browsers: { key: string; count: number }[];
  os: { key: string; count: number }[];
  countries: { key: string; count: number }[];
}

function referrerHostname(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "Direct";
  }
}

function countBy<T>(items: T[], keyFn: (item: T) => string | null | undefined): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item) || "Unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function summarizeEvents(events: EventRow[], from: Date, to: Date): AnalyticsSummary {
  const views = events.filter((e) => e.event_type === "profile_view");
  const clicks = events.filter((e) => e.event_type === "link_click" || e.event_type === "short_link_click" || e.event_type === "qr_scan");

  const uniqueViews = new Set(views.map((e) => e.visitor_id)).size;
  const uniqueClicks = new Set(clicks.map((e) => e.visitor_id)).size;

  const dayMap = new Map<string, { views: number; clicks: number }>();
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= to) {
    dayMap.set(cursor.toISOString().slice(0, 10), { views: 0, clicks: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    const bucket = dayMap.get(day);
    if (!bucket) continue;
    if (e.event_type === "profile_view") bucket.views += 1;
    else bucket.clicks += 1;
  }

  const linkClickCounts = new Map<string, number>();
  for (const e of clicks) {
    if (!e.link_id) continue;
    linkClickCounts.set(e.link_id, (linkClickCounts.get(e.link_id) ?? 0) + 1);
  }

  return {
    totalViews: views.length,
    uniqueViews,
    totalClicks: clicks.length,
    uniqueClicks,
    ctr: views.length > 0 ? (clicks.length / views.length) * 100 : 0,
    bioTraffic: events.filter((e) => e.traffic_source === "bio_page").length,
    shortLinkTraffic: events.filter((e) => e.traffic_source === "short_link").length,
    qrTraffic: events.filter((e) => e.traffic_source === "qr_code").length,
    directTraffic: events.filter((e) => e.traffic_source === "direct").length,
    byDay: Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v })),
    topLinks: Array.from(linkClickCounts.entries())
      .map(([linkId, clicksCount]) => ({ linkId, clicks: clicksCount }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10),
    referrers: countBy(events, (e) => referrerHostname(e.referrer)).slice(0, 8),
    devices: countBy(events, (e) => e.device_category).slice(0, 6),
    browsers: countBy(events, (e) => e.browser).slice(0, 6),
    os: countBy(events, (e) => e.os).slice(0, 6),
    countries: countBy(events, (e) => e.country).slice(0, 8),
  };
}
