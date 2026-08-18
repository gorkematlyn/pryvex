"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProfile } from "@/lib/domain/current-user";
import { getEntitlements } from "@/lib/domain/entitlements";
import { createTicket, addTicketMessage, getTicketForUser } from "@/lib/repo/tickets";

export type SupportActionResult = { error?: string; success?: string; ticketId?: string };

const createSchema = z.object({
  subject: z.string().min(3, "Give the request a short subject").max(150),
  body: z.string().min(10, "Describe the problem in a little more detail").max(4000),
});

export async function openTicket(input: {
  subject: string;
  body: string;
}): Promise<SupportActionResult> {
  const { userId } = await requireProfile();

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  // Priority is derived from the plan, never chosen by the user — otherwise
  // everything arrives flagged "high".
  const entitlements = await getEntitlements(userId);
  const priority = entitlements.features.priority_support ? "high" : "normal";

  const ticket = await createTicket({
    userId,
    subject: parsed.data.subject.trim(),
    body: parsed.data.body.trim(),
    priority,
  });

  revalidatePath("/dashboard/support");
  return { success: "Ticket opened.", ticketId: ticket.id };
}

export async function replyAsUser(ticketId: string, body: string): Promise<SupportActionResult> {
  const { userId } = await requireProfile();
  if (!body.trim()) return { error: "Write a message first." };

  // Ownership check before the write — ticket ids are guessable UUIDs in
  // the URL and this action must not become a way to post into someone
  // else's thread.
  const ticket = await getTicketForUser(userId, ticketId);
  if (!ticket) return { error: "That ticket was not found." };

  await addTicketMessage({
    ticketId,
    authorUserId: userId,
    isStaff: false,
    body: body.trim(),
  });

  revalidatePath(`/dashboard/support/${ticketId}`);
  return { success: "Reply sent." };
}
