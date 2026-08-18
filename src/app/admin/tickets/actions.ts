"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/domain/current-admin";
import { addTicketMessage, setTicketStatus, getTicket } from "@/lib/repo/tickets";
import { notifyUser } from "@/lib/repo/notifications";
import { logAdminAction } from "@/lib/repo/admin";
import type { TicketStatus } from "@/lib/db/types";

export type TicketActionResult = { error?: string; success?: string };

export async function replyToTicket(
  ticketId: string,
  body: string,
): Promise<TicketActionResult> {
  const admin = await requireAdmin();
  if (!body.trim()) return { error: "Write a reply first." };

  const ticket = await getTicket(ticketId);
  if (!ticket) return { error: "That ticket no longer exists." };

  await addTicketMessage({
    ticketId,
    authorUserId: admin.id,
    isStaff: true,
    body: body.trim(),
  });

  // The user is not necessarily looking at the ticket, so the reply also
  // lands in their notification list.
  await notifyUser(ticket.user_id, {
    title: `Reply to “${ticket.subject}”`,
    body: body.trim().slice(0, 200),
    level: "info",
    actionUrl: `/dashboard/support/${ticketId}`,
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  return { success: "Reply sent." };
}

export async function changeTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<TicketActionResult> {
  const admin = await requireAdmin();

  await setTicketStatus(ticketId, status);
  await logAdminAction({
    actorUserId: admin.id,
    action: "ticket.set_status",
    targetType: "ticket",
    targetId: ticketId,
    detail: { status },
  });

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  return { success: `Marked ${status}.` };
}
