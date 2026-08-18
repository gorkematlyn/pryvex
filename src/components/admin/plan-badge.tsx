import { cn } from "@/lib/cn";

/** Paid plans get the brand gradient treatment; free/none stay neutral so a list scans quickly. */
export function PlanBadge({
  name,
  price,
  className,
}: {
  name: string | null;
  price: number | null;
  className?: string;
}) {
  if (!name) {
    return <span className={cn("text-xs text-alloy-faint", className)}>No plan</span>;
  }

  const paid = (price ?? 0) > 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        paid
          ? "bg-gradient-to-r from-electric/15 to-ultraviolet/15 text-alloy ring-1 ring-inset ring-electric/25"
          : "bg-shadow-raised text-alloy-dim ring-1 ring-inset ring-border",
        className,
      )}
    >
      {name}
    </span>
  );
}
