import { cn } from "@/lib/cn";
import type { TicketMessageRow } from "@/lib/db/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Shared by the admin inbox and the user's own ticket view. `viewerIsStaff`
 * only decides which side is styled as "mine" — the message content and
 * order are identical for both, so neither party sees a different history.
 */
export function TicketThread({
  messages,
  viewerIsStaff,
}: {
  messages: TicketMessageRow[];
  viewerIsStaff: boolean;
}) {
  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const mine = message.is_staff === viewerIsStaff;
        return (
          <li
            key={message.id}
            className={cn("flex flex-col", mine ? "items-end" : "items-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3",
                message.is_staff
                  ? "bg-gradient-to-br from-electric/15 to-ultraviolet/10 ring-1 ring-inset ring-electric/20"
                  : "bg-shadow-raised ring-1 ring-inset ring-border",
              )}
            >
              <p className="whitespace-pre-wrap text-sm text-alloy">{message.body}</p>
            </div>
            <p className="mt-1 px-1 text-[11px] text-alloy-faint">
              {message.is_staff ? "Pryvex support" : "User"} · {formatDateTime(message.created_at)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
