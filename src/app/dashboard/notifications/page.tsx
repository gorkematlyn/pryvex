import Link from "next/link";
import { requireProfile } from "@/lib/domain/current-user";
import { listNotifications, markAllRead } from "@/lib/repo/notifications";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { NotificationLevel } from "@/lib/db/types";

export const metadata = { title: "Notifications" };

const LEVEL_ACCENT: Record<NotificationLevel, string> = {
  info: "bg-electric",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage() {
  const { userId } = await requireProfile();
  const notifications = await listNotifications(userId, 50);

  // Opening the list is the read receipt. Rendering happens from the rows
  // fetched above, so the "unread" dots still show on this first paint and
  // only disappear on the next visit.
  await markAllRead(userId);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Notifications</h1>
        <p className="mt-1 text-sm text-alloy-dim">Messages about your account and plan.</p>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-alloy-dim">Nothing here yet.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border-soft">
          {notifications.map((note) => {
            const content = (
              <div className="flex gap-3 px-4 py-4">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    note.read_at ? "bg-border" : LEVEL_ACCENT[note.level],
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "text-sm",
                        note.read_at ? "text-alloy-dim" : "font-medium text-alloy",
                      )}
                    >
                      {note.title}
                    </p>
                    <time className="shrink-0 text-xs text-alloy-faint">
                      {formatDateTime(note.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-alloy-dim">{note.body}</p>
                </div>
              </div>
            );

            return note.action_url ? (
              <Link
                key={note.id}
                href={note.action_url}
                className="block transition-colors hover:bg-shadow-elevated/40"
              >
                {content}
              </Link>
            ) : (
              <div key={note.id}>{content}</div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
