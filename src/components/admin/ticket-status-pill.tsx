import { cn } from "@/lib/cn";
import type { TicketStatus } from "@/lib/db/types";

const STYLES: Record<TicketStatus, string> = {
  open: "bg-electric/15 text-electric ring-electric/25",
  pending: "bg-amber-500/15 text-amber-400 ring-amber-500/25",
  resolved: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25",
  closed: "bg-shadow-raised text-alloy-faint ring-border",
};

const LABELS: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Awaiting user",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketStatusPill({ status, className }: { status: TicketStatus; className?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
