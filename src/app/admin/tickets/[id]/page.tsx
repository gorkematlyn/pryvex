import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, listTicketMessages } from "@/lib/repo/tickets";
import { getUserDetail } from "@/lib/repo/admin";
import { Card } from "@/components/ui/card";
import { TicketThread } from "@/components/support/ticket-thread";
import { TicketStatusPill } from "@/components/admin/ticket-status-pill";
import { AdminTicketReply } from "@/components/admin/admin-ticket-reply";
import { PlanBadge } from "@/components/admin/plan-badge";

export const metadata = { title: "Ticket" };

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [messages, user] = await Promise.all([
    listTicketMessages(id),
    getUserDetail(ticket.user_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/tickets" className="text-xs text-alloy-faint hover:text-alloy">
          ← Support
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-alloy">{ticket.subject}</h1>
          <TicketStatusPill status={ticket.status} />
        </div>
        <p className="mt-1 text-sm text-alloy-dim">
          <Link href={`/admin/users/${ticket.user_id}`} className="hover:text-electric">
            {ticket.username ? `@${ticket.username}` : ticket.email}
          </Link>
          {user?.plan_name && (
            <>
              {" · "}
              <PlanBadge name={user.plan_name} price={user.plan_price} />
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <TicketThread messages={messages} viewerIsStaff />
          </Card>

          <AdminTicketReply ticketId={ticket.id} currentStatus={ticket.status} />
        </div>

        <Card className="h-fit p-5">
          <h2 className="text-sm font-semibold text-alloy">Requester</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-alloy-faint">Email</dt>
              <dd className="truncate text-alloy">{ticket.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-alloy-faint">Plan</dt>
              <dd className="text-alloy">{user?.plan_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-alloy-faint">Priority</dt>
              <dd className="capitalize text-alloy">{ticket.priority}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-alloy-faint">Links</dt>
              <dd className="text-alloy">{user?.link_count ?? 0}</dd>
            </div>
          </dl>
          <Link
            href={`/admin/users/${ticket.user_id}`}
            className="mt-4 block text-xs text-electric hover:underline"
          >
            Open full account →
          </Link>
        </Card>
      </div>
    </div>
  );
}
