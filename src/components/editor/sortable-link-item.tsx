"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { BrandIcon } from "@/lib/domain/icons";
import { LinkForm, type LinkFormValues } from "./link-form";
import type { LinkRow } from "@/lib/db/types";

export function SortableLinkItem({
  link,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggle,
}: {
  link: LinkRow;
  onUpdate: (id: string, values: LinkFormValues) => Promise<string | void>;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style}>
        <LinkForm
          submitLabel="Save changes"
          initial={{
            title: link.title,
            url: link.url,
            emoji: link.emoji ?? "",
            icon: link.icon ?? "",
            thumbnail_url: link.thumbnail_url ?? "",
          }}
          onCancel={() => setEditing(false)}
          onSubmit={async (values) => {
            const err = await onUpdate(link.id, values);
            if (!err) setEditing(false);
            return err;
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-shadow-elevated p-3 transition-shadow",
        isDragging && "shadow-lg shadow-black/40 ring-1 ring-electric/50",
        !link.is_enabled && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="cursor-grab touch-none rounded-md p-1.5 text-alloy-faint hover:bg-shadow-raised hover:text-alloy active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-4 w-4">
          <path d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01" />
        </svg>
      </button>

      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-shadow-raised">
        {link.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.thumbnail_url} alt="" className="h-full w-full object-cover" />
        ) : link.emoji ? (
          <span className="text-base">{link.emoji}</span>
        ) : link.icon ? (
          <BrandIcon name={link.icon} className="h-4 w-4 text-alloy-dim" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-alloy-faint" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-alloy">{link.title}</p>
        <p className="truncate text-xs text-alloy-faint">{link.url}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => onToggle(link.id, !link.is_enabled)}
          role="switch"
          aria-checked={link.is_enabled}
          aria-label={link.is_enabled ? "Disable link" : "Enable link"}
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            link.is_enabled ? "bg-electric" : "bg-shadow-raised border border-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
              link.is_enabled ? "translate-x-4.5" : "translate-x-0.5",
            )}
          />
        </button>
        <IconButton label="Edit" onClick={() => setEditing(true)}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </IconButton>
        <IconButton label="Duplicate" onClick={() => onDuplicate(link.id)}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </IconButton>
        <IconButton label="Delete" onClick={() => onDelete(link.id)} danger>
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-md p-1.5 text-alloy-faint transition-colors hover:bg-shadow-raised",
        danger ? "hover:text-red-400" : "hover:text-alloy",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        {children}
      </svg>
    </button>
  );
}
