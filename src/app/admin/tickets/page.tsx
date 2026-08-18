import Link from "next/link";
import { listAllTickets } from "@/lib/repo/tickets";
import { Card } from "@/components/ui/card";
import { TicketStatusPill } from "@/components/admin/ticket-status-pill";
import type { TicketStatus } from "@/lib/db/types";

export const metadata = { title: "Support" };

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Awaiting user" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tickets = await listAllTickets({ status: (status as TicketStatus) || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Support</h1>
        <p className="mt-1 text-sm text-alloy-dim">Messages from users, newest activity first.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = (status ?? "") === filter.value;
          return (
            <Link
              key={filter.value}
              href={filter.value ? `/admin/tickets?status=${filter.value}` : "/admin/tickets"}
              className={
                active
                  ? "rounded-lg bg-shadow-elevated px-3 py-1.5 text-sm font-medium text-alloy"
                  : "rounded-lg px-3 py-1.5 text-sm text-alloy-dim transition-colors hover:bg-shadow-elevated/60 hover:text-alloy"
              }
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-alloy-dim">No tickets here.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border-soft">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/admin/tickets/${ticket.id}`}
              className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-shadow-elevated/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-alloy">{ticket.subject}</span>
                  {ticket.priority === "high" && (
                    <span className="rounded-full bg-red-950/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                      High
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-alloy-faint">
                  {ticket.username ? `@${ticket.username}` : ticket.email} · {ticket.message_count}{" "}
                  message{ticket.message_count === 1 ? "" : "s"} · {relativeTime(ticket.last_message_at)}
                </p>
              </div>
              <TicketStatusPill status={ticket.status} />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
