import { query, queryOne, withTransaction } from "@/lib/db/pool";
import type {
  SupportTicketRow,
  TicketMessageRow,
  TicketPriority,
  TicketStatus,
} from "@/lib/db/types";

export interface TicketWithUser extends SupportTicketRow {
  email: string;
  username: string | null;
  message_count: number;
}

export async function createTicket(input: {
  userId: string;
  subject: string;
  body: string;
  priority: TicketPriority;
}): Promise<SupportTicketRow> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<SupportTicketRow>(
      `insert into support_tickets (user_id, subject, priority) values ($1, $2, $3) returning *`,
      [input.userId, input.subject, input.priority],
    );
    const ticket = rows[0];
    await client.query(
      "insert into ticket_messages (ticket_id, author_user_id, is_staff, body) values ($1, $2, false, $3)",
      [ticket.id, input.userId, input.body],
    );
    return ticket;
  });
}

export async function addTicketMessage(input: {
  ticketId: string;
  authorUserId: string;
  isStaff: boolean;
  body: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      "insert into ticket_messages (ticket_id, author_user_id, is_staff, body) values ($1, $2, $3, $4)",
      [input.ticketId, input.authorUserId, input.isStaff, input.body],
    );
    // A staff reply puts the ball back in the user's court and vice versa.
    await client.query(
      `update support_tickets
          set last_message_at = now(),
              status = case
                when status in ('resolved', 'closed') then 'open'
                when $2 then 'pending'
                else 'open'
              end
        where id = $1`,
      [input.ticketId, input.isStaff],
    );
  });
}

export function listTicketsForUser(userId: string): Promise<SupportTicketRow[]> {
  return query<SupportTicketRow>(
    "select * from support_tickets where user_id = $1 order by last_message_at desc",
    [userId],
  );
}

export function getTicketForUser(userId: string, ticketId: string): Promise<SupportTicketRow | null> {
  return queryOne<SupportTicketRow>("select * from support_tickets where id = $1 and user_id = $2", [
    ticketId,
    userId,
  ]);
}

export function getTicket(ticketId: string): Promise<TicketWithUser | null> {
  return queryOne<TicketWithUser>(
    `select t.*, u.email, p.username,
            (select count(*) from ticket_messages m where m.ticket_id = t.id)::int as message_count
       from support_tickets t
       join users u on u.id = t.user_id
       left join profiles p on p.id = t.user_id
      where t.id = $1`,
    [ticketId],
  );
}

export function listTicketMessages(ticketId: string): Promise<TicketMessageRow[]> {
  return query<TicketMessageRow>(
    "select * from ticket_messages where ticket_id = $1 order by created_at",
    [ticketId],
  );
}

export function listAllTickets(filter: { status?: TicketStatus }): Promise<TicketWithUser[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (filter.status) {
    params.push(filter.status);
    conditions.push(`t.status = $${params.length}`);
  }
  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";
  return query<TicketWithUser>(
    `select t.*, u.email, p.username,
            (select count(*) from ticket_messages m where m.ticket_id = t.id)::int as message_count
       from support_tickets t
       join users u on u.id = t.user_id
       left join profiles p on p.id = t.user_id
       ${where}
      order by
        case t.status when 'open' then 0 when 'pending' then 1 else 2 end,
        t.last_message_at desc`,
    params,
  );
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  await query("update support_tickets set status = $2 where id = $1", [ticketId, status]);
}

export async function countOpenTickets(): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from support_tickets where status in ('open', 'pending')",
  );
  return Number(row?.count ?? 0);
}
