"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openTicket } from "@/app/dashboard/support/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

export function NewTicketForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await openTicket({ subject, body });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubject("");
    setBody("");
    setOpen(false);
    if (result.ticketId) router.push(`/dashboard/support/${result.ticketId}`);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>New request</Button>
    );
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="ticket-subject">Subject</Label>
          <Input
            id="ticket-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What do you need help with?"
            maxLength={150}
            required
          />
        </div>

        <div>
          <Label htmlFor="ticket-body">Details</Label>
          <Textarea
            id="ticket-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Include anything that helps us reproduce the problem."
            maxLength={4000}
            required
          />
        </div>

        <FieldError>{error}</FieldError>

        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Sending…" : "Open request"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
