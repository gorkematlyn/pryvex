import { query, queryOne } from "@/lib/db/pool";
import type { NotificationLevel, NotificationRow } from "@/lib/db/types";

export interface NotificationInput {
  title: string;
  body: string;
  level: NotificationLevel;
  actionUrl?: string | null;
}

export async function notifyUser(userId: string, input: NotificationInput): Promise<void> {
  await query(
    "insert into notifications (user_id, title, body, level, action_url) values ($1, $2, $3, $4, $5)",
    [userId, input.title, input.body, input.level, input.actionUrl ?? null],
  );
}

/** One statement for the whole audience — the admin bulk composer can target thousands of rows. */
export async function notifyUsers(userIds: string[], input: NotificationInput): Promise<number> {
  if (userIds.length === 0) return 0;
  const rows = await query<{ id: string }>(
    `insert into notifications (user_id, title, body, level, action_url)
     select unnest($1::uuid[]), $2, $3, $4, $5
     returning id`,
    [userIds, input.title, input.body, input.level, input.actionUrl ?? null],
  );
  return rows.length;
}

export function listNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
  return query<NotificationRow>(
    "select * from notifications where user_id = $1 order by created_at desc limit $2",
    [userId, limit],
  );
}

export async function countUnread(userId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    "select count(*)::text as count from notifications where user_id = $1 and read_at is null",
    [userId],
  );
  return Number(row?.count ?? 0);
}

export async function markAllRead(userId: string): Promise<void> {
  await query("update notifications set read_at = now() where user_id = $1 and read_at is null", [
    userId,
  ]);
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  await query("update notifications set read_at = now() where user_id = $1 and id = $2", [
    userId,
    notificationId,
  ]);
}
