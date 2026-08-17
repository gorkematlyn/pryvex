"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { CopyButton } from "@/components/ui/copy-button";
import { toggleShortLink, deleteShortLink } from "@/app/dashboard/links/actions";
import type { ShortLinkRow } from "@/lib/db/types";

type ShortLink = ShortLinkRow;

export function ShortLinkRow({ link, clicks, appUrl }: { link: ShortLink; clicks: number; appUrl: string }) {
  const [isActive, setIsActive] = useState(link.is_active);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const shortUrl = `${appUrl.replace(/\/$/, "")}/s/${link.slug}`;
  const expired = link.expires_at ? new Date(link.expires_at) < new Date() : false;

  async function handleToggle() {
    const next = !isActive;
    setIsActive(next);
    const result = await toggleShortLink(link.id, next);
    if (result?.error) setIsActive(!next);
  }

  async function handleDelete() {
    if (!confirm(`Delete pryvex.com/s/${link.slug}? This can't be undone.`)) return;
    setPending(true);
    await deleteShortLink(link.id);
    router.refresh();
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-border bg-shadow-elevated p-3", (!isActive || expired) && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-alloy">/s/{link.slug}</span>
          {expired && <span className="rounded-full bg-red-950/40 px-2 py-0.5 text-[10px] text-red-400">Expired</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-alloy-faint">{link.destination_url}</p>
      </div>

      <div className="text-xs text-alloy-dim">
        <span className="font-mono text-alloy">{clicks}</span> clicks
      </div>

      <div className="flex items-center gap-2">
        <CopyButton value={shortUrl} />
        <Link href={`/dashboard/qr?target=short_link&id=${link.id}`} className="text-xs text-electric hover:underline">
          QR
        </Link>
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={isActive}
          aria-label={isActive ? "Deactivate" : "Activate"}
          className={cn("relative h-5 w-9 rounded-full transition-colors", isActive ? "bg-electric" : "bg-shadow-raised border border-border")}
        >
          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", isActive ? "translate-x-4.5" : "translate-x-0.5")} />
        </button>
        <button onClick={handleDelete} disabled={pending} aria-label="Delete" className="rounded-md p-1.5 text-alloy-faint hover:bg-shadow-raised hover:text-red-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
