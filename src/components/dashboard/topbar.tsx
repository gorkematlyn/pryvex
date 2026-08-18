"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Topbar({
  username,
  appUrl,
  unreadCount,
  isAdmin,
}: {
  username: string;
  appUrl: string;
  unreadCount: number;
  isAdmin: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `${appUrl.replace(/\/$/, "")}/${username}`;
  const displayUrl = profileUrl.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — silently no-op, user can still select the text
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={copy}
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-shadow-raised px-3 py-1.5 text-xs text-alloy-dim transition-colors hover:border-alloy-faint hover:text-alloy"
      >
        <span className="font-mono">{displayUrl}</span>
        <span className="text-alloy-faint">{copied ? "Copied" : "Copy"}</span>
      </button>
      <Link
        href="/dashboard/notifications"
        className="relative rounded-lg p-2 text-alloy-dim transition-colors hover:bg-shadow-elevated hover:text-alloy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
      >
        <svg
          className="h-4.5 w-4.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-electric px-1 text-[10px] font-semibold text-shadow">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

      {isAdmin && (
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            Admin
          </Button>
        </Link>
      )}

      <Link href={`/${username}`} target="_blank">
        <Button variant="secondary" size="sm">
          View page
        </Button>
      </Link>
      <form action="/auth/signout" method="post">
        <Button variant="ghost" size="sm" type="submit">
          Sign out
        </Button>
      </form>
    </div>
  );
}
