import Link from "next/link";
import { cn } from "@/lib/cn";

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Wraps a capability the current plan does not include.
 *
 * The control stays visible but dimmed and non-interactive, so users can see
 * what the product offers rather than wondering whether a feature exists.
 * `inert` (not just `pointer-events-none`) also takes the subtree out of the
 * tab order and the accessibility tree, so keyboard and screen-reader users
 * cannot reach a control they are not allowed to use.
 *
 * This is presentation only. Every gated action is independently enforced in
 * its Server Action — hiding a button is not authorization.
 */
export function LockedFeature({
  locked,
  label,
  children,
  className,
  upgradeHref = "/dashboard/billing",
}: {
  locked: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
  upgradeHref?: string;
}) {
  if (!locked) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div inert className="pointer-events-none select-none opacity-40 saturate-50">
        {children}
      </div>

      <Link
        href={upgradeHref}
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center rounded-xl",
          "bg-shadow/20 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric",
        )}
        aria-label={label ? `${label} — upgrade to unlock` : "Upgrade to unlock"}
      >
        <span className="flex items-center gap-1.5 rounded-full bg-shadow-elevated px-3 py-1.5 text-xs font-medium text-alloy ring-1 ring-inset ring-border">
          <LockIcon className="h-3.5 w-3.5 text-ultraviolet" />
          Upgrade to unlock
        </span>
      </Link>
    </div>
  );
}

/** Compact inline marker for a locked row or menu entry. */
export function LockBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-shadow-raised px-1.5 py-0.5 text-[10px] font-medium text-alloy-faint ring-1 ring-inset ring-border",
        className,
      )}
    >
      <LockIcon className="h-2.5 w-2.5" />
      Locked
    </span>
  );
}
