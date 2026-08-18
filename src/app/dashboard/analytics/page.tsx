import Link from "next/link";
import { requireProfile } from "@/lib/domain/current-user";
import { getEntitlements } from "@/lib/domain/entitlements";
import { LockedFeature } from "@/components/ui/locked-feature";
import { listEventsForProfileInRange } from "@/lib/repo/link-events";
import { resolveDateRange, summarizeEvents, clampRangeToRetention, type DateRangeKey } from "@/lib/domain/analytics";
import { StatTile } from "@/components/analytics/stat-tile";
import { TimeSeriesChart } from "@/components/analytics/time-series-chart";
import { BreakdownList } from "@/components/analytics/breakdown-list";
import { DateRangeTabs } from "@/components/analytics/date-range-tabs";
import { Card } from "@/components/ui/card";
import { query } from "@/lib/db/pool";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { userId } = await requireProfile();
  const { range: rawRange } = await searchParams;
  const range = (["today", "7d", "30d", "90d"].includes(rawRange ?? "") ? rawRange : "7d") as DateRangeKey;
  const { from: requestedFrom, to, label } = resolveDateRange(range);

  const entitlements = await getEntitlements(userId);

  // Retention is a plan limit, so the window is clamped before the query
  // rather than after — a shorter plan simply cannot read older rows, even
  // by editing ?range= in the URL.
  const retentionDays = entitlements.limits.analytics_retention_days;
  const { from, clamped } = clampRangeToRetention(requestedFrom, retentionDays);

  const events = await listEventsForProfileInRange(userId, from, to);
  const summary = summarizeEvents(events, from, to);

  const topLinkIds = summary.topLinks.map((l) => l.linkId);
  const linkRows =
    topLinkIds.length > 0
      ? await query<{ id: string; title: string }>("select id, title from links where id = any($1::uuid[])", [topLinkIds])
      : [];
  const linkTitleById = new Map(linkRows.map((l) => [l.id, l.title]));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-alloy">Analytics</h1>
          <p className="mt-1 text-sm text-alloy-dim">{label}</p>
        </div>
        <DateRangeTabs active={range} />
      </div>

      {clamped && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-ultraviolet/25 bg-ultraviolet/[0.06] p-4">
          <p className="text-sm text-alloy-dim">
            Your plan keeps {retentionDays} days of analytics — this view starts there.
          </p>
          <Link href="/dashboard/billing" className="text-sm text-electric hover:underline">
            Extend retention →
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Profile views" value={summary.totalViews} sublabel={`${summary.uniqueViews} unique`} />
        <StatTile label="Link clicks" value={summary.totalClicks} sublabel={`${summary.uniqueClicks} unique`} />
        <StatTile label="Click-through rate" value={`${summary.ctr.toFixed(1)}%`} />
        <StatTile label="Bio page traffic" value={summary.bioTraffic} />
        <StatTile label="Short link + QR" value={summary.shortLinkTraffic + summary.qrTraffic} sublabel={`${summary.qrTraffic} from QR`} />
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-alloy">Views &amp; clicks</h2>
        <div className="mt-4">
          <TimeSeriesChart data={summary.byDay} />
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold text-alloy">Top links</h2>
          {summary.topLinks.length === 0 ? (
            <p className="mt-3 text-xs text-alloy-faint">No clicks yet in this range.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {summary.topLinks.map((l, i) => (
                <div key={l.linkId} className="flex items-center justify-between rounded-lg bg-shadow-raised px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 truncate text-alloy">
                    <span className="text-alloy-faint">{i + 1}.</span>
                    {linkTitleById.get(l.linkId) ?? "Deleted link"}
                  </span>
                  <span className="font-mono text-xs text-alloy-dim">{l.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-6 p-5">
          <BreakdownList title="Traffic source" items={[
            { key: "Link in bio", count: summary.bioTraffic },
            { key: "Short link", count: summary.shortLinkTraffic },
            { key: "QR code", count: summary.qrTraffic },
            { key: "Direct", count: summary.directTraffic },
          ].filter((i) => i.count > 0)} />
          <LockedFeature locked={!entitlements.features.analytics_referrers} label="Referrer reporting">
            <BreakdownList title="Referrers" items={summary.referrers} />
          </LockedFeature>
        </Card>

        <LockedFeature locked={!entitlements.features.analytics_breakdowns} label="Device breakdown">
          <Card className="p-5">
            <BreakdownList title="Device" items={summary.devices} />
          </Card>
        </LockedFeature>
        <LockedFeature locked={!entitlements.features.analytics_breakdowns} label="Browser and OS breakdown">
          <Card className="space-y-6 p-5">
            <BreakdownList title="Browser" items={summary.browsers} />
            <BreakdownList title="OS" items={summary.os} />
          </Card>
        </LockedFeature>
      </div>
    </div>
  );
}
