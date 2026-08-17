"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { FieldError } from "@/components/ui/card";
import { ICON_OPTIONS } from "@/lib/domain/icons";

export interface LinkFormValues {
  title: string;
  url: string;
  emoji: string;
  icon: string;
  thumbnail_url: string;
}

export function LinkForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Add link",
}: {
  initial?: Partial<LinkFormValues>;
  onSubmit: (values: LinkFormValues) => Promise<string | void>;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<LinkFormValues>({
    title: initial?.title ?? "",
    url: initial?.url ?? "",
    emoji: initial?.emoji ?? "",
    icon: initial?.icon ?? "",
    thumbnail_url: initial?.thumbnail_url ?? "",
  });
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await onSubmit(values);
    setPending(false);
    if (result) setError(result);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-shadow-raised p-4">
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="My latest drop"
            required
            maxLength={120}
          />
        </div>
        <div>
          <Label htmlFor="emoji">Emoji</Label>
          <Input
            id="emoji"
            value={values.emoji}
            onChange={(e) => setValues((v) => ({ ...v, emoji: e.target.value }))}
            placeholder="✨"
            maxLength={4}
            className="w-16 text-center"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="url">Destination URL</Label>
        <Input
          id="url"
          type="url"
          value={values.url}
          onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))}
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="icon">Icon</Label>
          <select
            id="icon"
            value={values.icon}
            onChange={(e) => setValues((v) => ({ ...v, icon: e.target.value }))}
            className="w-full rounded-lg border border-border bg-shadow-raised px-3.5 py-2.5 text-sm text-alloy outline-none focus:border-electric focus:ring-1 focus:ring-electric"
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
          <Input
            id="thumbnail_url"
            type="url"
            value={values.thumbnail_url}
            onChange={(e) => setValues((v) => ({ ...v, thumbnail_url: e.target.value }))}
            placeholder="Optional image URL"
          />
        </div>
      </div>

      <FieldError>{error}</FieldError>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
