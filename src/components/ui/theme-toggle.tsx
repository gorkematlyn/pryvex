"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-script";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

/**
 * Module-level store rather than component state: the theme lives on the
 * DOM (`data-theme`) and in localStorage, both outside React, and the
 * server can't know either. `useSyncExternalStore` is the hook built for
 * exactly that — a synchronous external source that must render one value
 * during SSR (`getServerSnapshot`) and reconcile to the real one on the
 * client without the extra render-then-effect-then-render cycle (and the
 * lint warning that comes with mutating state from inside an effect).
 */
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTheme(next: Theme): void {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private browsing / storage disabled — the toggle still works for
    // this page load, it just won't persist across visits.
  }
  listeners.forEach((notify) => notify());
}

/**
 * Explicit two-state toggle, not a light/dark/system tristate — Pryvex's
 * default *is* effectively "system, falling back to dark" (see
 * globals.css), so clicking this always records a real preference rather
 * than cycling through a "system" option that would just reproduce
 * whatever was already showing.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-alloy-dim transition-colors hover:bg-shadow-elevated hover:text-alloy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric",
        className,
      )}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.5M12 19.5V21M4.9 4.9l1.1 1.1M18 18l1.1 1.1M3 12h1.5M19.5 12H21M4.9 19.1 6 18M18 6l1.1-1.1" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
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
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}
