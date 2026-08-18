import { Card } from "@/components/ui/card";
import { checkLimit, type Entitlements } from "@/lib/domain/entitlements";
import { cn } from "@/lib/cn";
import type { LimitKey } from "@/lib/domain/features";

interface Meter {
  key: LimitKey;
  label: string;
  used: number;
}

export function UsageMeters({
  entitlements,
  usage,
}: {
  entitlements: Entitlements;
  usage: { links: number; shortLinks: number; qrCodes: number };
}) {
  const meters: Meter[] = [
    { key: "max_links", label: "Links", used: usage.links },
    { key: "max_short_links", label: "Short links", used: usage.shortLinks },
    { key: "max_qr_codes", label: "QR codes", used: usage.qrCodes },
  ];

  return (
    <section>
      <h2 className="text-sm font-semibold text-alloy">Usage</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {meters.map((meter) => {
          const check = checkLimit(entitlements, meter.key, meter.used);
          const percent = check.unlimited
            ? 0
            : check.limit > 0
              ? Math.min(100, (check.used / check.limit) * 100)
              : 100;

          return (
            <Card key={meter.key} className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-medium text-alloy-dim">{meter.label}</p>
                <p className="text-xs text-alloy-faint">
                  {check.unlimited ? "Unlimited" : `${check.used} / ${check.limit}`}
                </p>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-shadow-raised">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    check.unlimited
                      ? "bg-gradient-to-r from-electric to-ultraviolet"
                      : check.reached
                        ? "bg-amber-400"
                        : "bg-gradient-to-r from-electric to-ultraviolet",
                  )}
                  style={{ width: check.unlimited ? "100%" : `${percent}%` }}
                />
              </div>

              {check.reached && (
                <p className="mt-2 text-xs text-amber-400">
                  Limit reached — upgrade to add more.
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
