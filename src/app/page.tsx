import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Eye, ReceiptText, Users, Wallet } from "lucide-react";
import { AuditEventList } from "@/components/audit-event-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarketingLanding } from "@/components/marketing/marketing-landing";
import { getAuthSession, requireAuthSession } from "@/lib/auth/session";
import { listAuditEvents } from "@/lib/data/audit";
import { listEntitiesForUser } from "@/lib/data/entities";
import { acceptInvitation, listUserInvitations } from "@/lib/data/invitations";
import { withToast } from "@/lib/navigation/toast";
import { ensureUser } from "@/lib/data/users";

async function acceptInviteAction(invitationId: string) {
  "use server";

  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  await acceptInvitation(email, invitationId);
  redirect(withToast("/", "invitation-accepted"));
}

/**
 * Authenticated workspace home with entity index and pending invites.
 */
export default async function Home() {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return (
      <AppShell session={session}>
        <MarketingLanding />
      </AppShell>
    );
  }

  const userEmail = session.user.email.toLowerCase();
  await ensureUser(userEmail, session.user.name);
  const [entities, invites, audits] = await Promise.all([
    listEntitiesForUser(userEmail),
    listUserInvitations(userEmail),
    listAuditEvents(userEmail, 8),
  ]);

  return (
    <AppShell session={session}>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Your Entities" className="lg:col-span-2">
          {entities.length === 0 ? (
            <p className="text-sm text-foreground/80">No entities yet. Create your first household or business.</p>
          ) : (
            <ul className="grid gap-3">
              {entities.map(({ entity, membership }) => (
                <li key={entity.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{entity.name}</p>
                      <p className="text-xs uppercase tracking-[0.12em] text-foreground/70">
                        {entity.type} · {membership.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        asChild
                        ariaLabel={`Open ${entity.name} overview`}
                        className="rounded-lg px-3 py-1"
                        variant="secondary"
                      >
                        <Link href={`/entity/${entity.id}`}>
                          <Eye aria-hidden className="size-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        asChild
                        ariaLabel={`Open ${entity.name} budget`}
                        className="rounded-lg px-3 py-1"
                        variant="secondary"
                      >
                        <Link href={`/entity/${entity.id}/budget`}>
                          <Wallet aria-hidden className="size-4" />
                          Budget
                        </Link>
                      </Button>
                      <Button
                        asChild
                        ariaLabel={`Open ${entity.name} transactions`}
                        className="rounded-lg px-3 py-1"
                        variant="secondary"
                      >
                        <Link href={`/entity/${entity.id}/transactions`}>
                          <ReceiptText aria-hidden className="size-4" />
                          Transactions
                        </Link>
                      </Button>
                      <Button
                        asChild
                        ariaLabel={`Open ${entity.name} members`}
                        className="rounded-lg px-3 py-1"
                        variant="secondary"
                      >
                        <Link href={`/entity/${entity.id}/members`}>
                          <Users aria-hidden className="size-4" />
                          Members
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Pending Invites">
          {invites.length === 0 ? (
            <p className="text-sm text-foreground/80">No pending invitations.</p>
          ) : (
            <ul className="space-y-3">
              {invites.map((invite) => (
                <li key={invite.id} className="rounded-xl border border-line p-3 text-sm">
                  <p>Entity: {invite.entityId}</p>
                  <p>Role: {invite.role}</p>
                  <form action={acceptInviteAction.bind(null, invite.id)} className="mt-2">
                    <Button ariaLabel="Accept invitation" startIcon={<Check className="size-4" />} type="submit">
                      Accept Invite
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent Audit Events">
        <AuditEventList emptyMessage="No audit events recorded yet." events={audits} />
        <Button asChild ariaLabel="Open all audits" className="mt-3 rounded-lg px-3 py-1" variant="secondary">
          <Link href="/audits">View All Audits</Link>
        </Button>
      </Card>
    </AppShell>
  );
}
