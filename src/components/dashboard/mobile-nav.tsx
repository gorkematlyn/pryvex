"use client";

import { useState } from "react";
import { SidebarNav } from "./sidebar-nav";
import { Logo } from "@/components/ui/logo";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-alloy-dim hover:text-alloy"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-4.5 w-4.5">
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-full w-72 flex-col gap-6 border-r border-border bg-shadow p-5">
            <div className="flex items-center justify-between">
              <Logo className="text-lg" />
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="text-alloy-dim hover:text-alloy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-5 w-5">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
