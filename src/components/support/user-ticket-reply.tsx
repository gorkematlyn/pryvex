"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyAsUser } from "@/app/dashboard/support/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";

export function UserTicketReply({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(undefined);

    const result = await replyAsUser(ticketId, body);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setBody("");
    router.refresh();
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit}>
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add to this request…"
          maxLength={4000}
          aria-label="Reply"
        />
        <FieldError>{error}</FieldError>
        <Button type="submit" size="sm" className="mt-3" disabled={pending || !body.trim()}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </form>
    </Card>
  );
}
