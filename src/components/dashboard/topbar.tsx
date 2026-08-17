"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Topbar({ username, appUrl }: { username: string; appUrl: string }) {
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
