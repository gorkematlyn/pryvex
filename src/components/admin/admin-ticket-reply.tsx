"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { replyToTicket, changeTicketStatus } from "@/app/admin/tickets/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, FieldError } from "@/components/ui/card";
import type { TicketStatus } from "@/lib/db/types";

const STATUS_ACTIONS: { status: TicketStatus; label: string }[] = [
  { status: "resolved", label: "Mark resolved" },
  { status: "closed", label: "Close" },
  { status: "open", label: "Reopen" },
];

export function AdminTicketReply({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ error?: string; success?: string }>({});

  async function handleReply() {
    setPending("reply");
    setResult({});
    const response = await replyToTicket(ticketId, body);
    setPending(null);
    setResult(response);
    if (response.success) {
      setBody("");
      router.refresh();
    }
  }

  async function handleStatus(status: TicketStatus) {
    setPending(status);
    setResult({});
    const response = await changeTicketStatus(ticketId, status);
    setPending(null);
    setResult(response);
    if (response.success) router.refresh();
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold text-alloy">Reply</h2>

      <Textarea
        className="mt-3"
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your reply…"
        maxLength={4000}
        aria-label="Reply to ticket"
      />

      <FieldError>{result.error}</FieldError>
      {result.success && <p className="mt-2 text-xs text-electric">{result.success}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleReply} disabled={pending !== null || !body.trim()}>
          {pending === "reply" ? "Sending…" : "Send reply"}
        </Button>

        <span className="mx-1 h-4 w-px bg-border" aria-hidden />

        {STATUS_ACTIONS.filter((action) => action.status !== currentStatus).map((action) => (
          <Button
            key={action.status}
            variant="secondary"
            size="sm"
            disabled={pending !== null}
            onClick={() => handleStatus(action.status)}
          >
            {pending === action.status ? "…" : action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
