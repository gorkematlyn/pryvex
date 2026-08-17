"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import { createShortLink } from "@/app/dashboard/links/actions";

export function ShortLinkForm() {
  const [destination, setDestination] = useState("");
  const [slug, setSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await createShortLink({
      destination_url: destination,
      slug: slug || undefined,
      expires_at: expiresAt || undefined,
    });
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setDestination("");
    setSlug("");
    setExpiresAt("");
    router.refresh();
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Create a short link</h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_160px_auto] sm:items-end">
        <div>
          <Label htmlFor="destination">Destination URL</Label>
          <Input id="destination" type="url" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="https://example.com/post" />
        </div>
        <div>
          <Label htmlFor="slug">Custom alias</Label>
          <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="optional" />
        </div>
        <div>
          <Label htmlFor="expires">Expires</Label>
          <Input id="expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create"}
        </Button>
      </form>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
