import { EntityShell } from "@/components/entity/entity-shell";
import { EntityBudgetLive } from "@/components/entity/entity-budget-live";
import { requireAuthSession } from "@/lib/auth/session";
import { getEntityForUser, requireMembership } from "@/lib/data/entities";

interface SnapshotPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Entity snapshot section for cadence-based financial meetings.
 */
export default async function EntitySnapshotPage({ params }: SnapshotPageProps) {
  const { id } = await params;
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    throw new Error("Session missing email.");
  }

  const [entity, membership] = await Promise.all([
    getEntityForUser(email, id),
    requireMembership(email, id),
  ]);

  return (
    <EntityShell entity={entity} membership={membership} session={session}>
      <EntityBudgetLive currency={entity.currency} entityId={id} mode="snapshot" />
    </EntityShell>
  );
}
