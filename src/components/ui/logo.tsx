import { cn } from "@/lib/cn";

/**
 * The Pryvex wordmark. The X is built as its own SVG unit — two crossing
 * strokes with a deliberate gap at the intersection and a gradient split —
 * so it can later be extracted as a standalone brand symbol or animated
 * independently (loading state, route transitions, reveal effects).
 */
export function Logo({ className, markOnly = false }: { className?: string; markOnly?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.06em] font-sans font-extrabold tracking-tight select-none", className)}>
      {!markOnly && <span className="text-alloy">Pr</span>}
      <XMark className="inline-block h-[0.78em] w-[0.78em] -mx-[0.02em] translate-y-[0.03em]" />
      {!markOnly && <span className="text-alloy">vex</span>}
    </span>
  );
}

export function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="pryvexXGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#64A0FF" />
          <stop offset="1" stopColor="#B998FF" />
        </linearGradient>
      </defs>
      {/* Top-left to center-gap stroke */}
      <path d="M4 4 L21 21" stroke="url(#pryvexXGradient)" strokeWidth="7" strokeLinecap="round" />
      {/* center-gap to bottom-right stroke */}
      <path d="M27 27 L44 44" stroke="url(#pryvexXGradient)" strokeWidth="7" strokeLinecap="round" />
      {/* Top-right to center-gap stroke */}
      <path d="M44 4 L27 21" stroke="#D7DCE4" strokeWidth="7" strokeLinecap="round" />
      {/* center-gap to bottom-left stroke */}
      <path d="M21 27 L4 44" stroke="#D7DCE4" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
