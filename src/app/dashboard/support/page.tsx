import Link from "next/link";
import { requireProfile } from "@/lib/domain/current-user";
import { listTicketsForUser } from "@/lib/repo/tickets";
import { getBrandingSettings } from "@/lib/repo/app-settings";
import { Card } from "@/components/ui/card";
import { TicketStatusPill } from "@/components/admin/ticket-status-pill";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export const metadata = { title: "Support" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function SupportPage() {
  const { userId } = await requireProfile();
  const [tickets, branding] = await Promise.all([listTicketsForUser(userId), getBrandingSettings()]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-alloy">Support</h1>
        <p className="mt-1 text-sm text-alloy-dim">
          Open a request and we&rsquo;ll reply here.
          {branding.support_email && ` You can also email ${branding.support_email}.`}
        </p>
      </div>

      <NewTicketForm />

      <section>
        <h2 className="text-sm font-semibold text-alloy">Your requests</h2>
        {tickets.length === 0 ? (
          <Card className="mt-3 p-8 text-center">
            <p className="text-sm text-alloy-dim">You haven&rsquo;t opened any requests yet.</p>
          </Card>
        ) : (
          <Card className="mt-3 divide-y divide-border-soft">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-shadow-elevated/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-alloy">{ticket.subject}</p>
                  <p className="mt-0.5 text-xs text-alloy-faint">
                    Opened {formatDate(ticket.created_at)}
                  </p>
                </div>
                <TicketStatusPill status={ticket.status} />
              </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
