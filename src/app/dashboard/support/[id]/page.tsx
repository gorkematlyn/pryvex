import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/domain/current-user";
import { getTicketForUser, listTicketMessages } from "@/lib/repo/tickets";
import { Card } from "@/components/ui/card";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketStatusPill } from "@/components/admin/ticket-status-pill";
import { UserTicketReply } from "@/components/support/user-ticket-reply";

export const metadata = { title: "Request" };

export default async function UserTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireProfile();

  // Scoped by owner, so another account's ticket id 404s rather than leaking.
  const ticket = await getTicketForUser(userId, id);
  if (!ticket) notFound();

  const messages = await listTicketMessages(id);
  const locked = ticket.status === "closed";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/dashboard/support" className="text-xs text-alloy-faint hover:text-alloy">
          ← Support
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-alloy">{ticket.subject}</h1>
          <TicketStatusPill status={ticket.status} />
        </div>
      </div>

      <Card className="p-5">
        <TicketThread messages={messages} viewerIsStaff={false} />
      </Card>

      {locked ? (
        <Card className="p-5 text-center">
          <p className="text-sm text-alloy-dim">
            This request is closed. Open a new one if you still need help.
          </p>
        </Card>
      ) : (
        <UserTicketReply ticketId={ticket.id} />
      )}
    </div>
  );
}
