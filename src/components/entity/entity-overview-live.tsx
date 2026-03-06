"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { FolderKanban, ReceiptText, Wallet } from "lucide-react";
import type { Session } from "next-auth";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { EntityShell } from "@/components/entity/entity-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEntityAccess } from "@/hooks/use-entity-access";
import type { EntityBudget, EntityDocument, LedgerTransaction } from "@/lib/domain/types";

interface EntityOverviewLiveProps {
  session: Session;
  entityId: string;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Live entity overview with reactive budget/transaction/document snapshots.
 */
export function EntityOverviewLive({ session, entityId }: EntityOverviewLiveProps) {
  const { entity, isLoading, membership, userId } = useEntityAccess(entityId);
  const resolvedEntityId = entityId as Id<"entities">;
  const queryArgs = useMemo(
    () => (userId ? { userId, entityId: resolvedEntityId } : "skip"),
    [resolvedEntityId, userId],
  );

  const allTransactions = (useQuery(api.ledger.queries.listByEntity, queryArgs) || []) as LedgerTransaction[];
  const allDocuments = (useQuery(api.documents.queries.listByEntity, queryArgs) || []) as EntityDocument[];
  const budgets = (useQuery(api.budgets.queries.listByEntity, queryArgs) || []) as EntityBudget[];

  if (isLoading || !entity || !membership) {
    return (
      <EntityShell
        entity={{
          id: entityId,
          type: "household",
          name: "Loading...",
          address: { formatted: "Loading...", line1: "Loading...", countryCode: "US" },
          currency: "USD",
          createdAt: "",
          updatedAt: "",
        }}
        membership={{ id: "loading", entityId, userEmail: session.user?.email || "", role: "user", createdAt: "" }}
        session={session}
      >
        <Card title="Overview">
          <p className="text-sm text-foreground/75">Loading overview...</p>
        </Card>
      </EntityShell>
    );
  }

  const transactions = allTransactions.slice(0, 8);
  const documents = allDocuments.slice(0, 8);
  const activeBudget = budgets.find((budget) => budget.status === "active") || budgets[0] || null;

  return (
    <EntityShell entity={entity} membership={membership} session={session}>
      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Meeting Snapshot" className="xl:col-span-1">
          {activeBudget ? (
            <>
              <p className="text-sm text-foreground/75">
                {activeBudget.name} · {activeBudget.period}
              </p>
              <p className="mt-3 text-sm">Expected Remaining</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(activeBudget.summary.expectedRemainingCents, entity.currency)}
              </p>
              <Button asChild ariaLabel="Open snapshots section" className="mt-3 rounded-lg px-3 py-1" variant="secondary">
                <Link href={`/entity/${entityId}/snapshot`}>
                  <Wallet aria-hidden className="size-4" />
                  Open Snapshots
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-foreground/70">No budget created yet.</p>
              <Button asChild ariaLabel="Open snapshots section" className="mt-3 rounded-lg px-3 py-1" variant="secondary">
                <Link href={`/entity/${entityId}/snapshot`}>
                  <Wallet aria-hidden className="size-4" />
                  Open Snapshots
                </Link>
              </Button>
            </>
          )}
        </Card>

        <Card title="Recent Transactions" className="xl:col-span-1">
          <ul className="space-y-2 text-sm">
            {transactions.map((item) => (
              <li className="rounded-xl border border-line/80 bg-surface px-3 py-2" key={item.id}>
                {item.type} · ${(item.amountCents / 100).toFixed(2)} · {item.category}
              </li>
            ))}
            {transactions.length === 0 ? <li className="text-foreground/70">No transactions yet.</li> : null}
          </ul>
          <Button asChild ariaLabel="Open transactions section" className="mt-3 rounded-lg px-3 py-1" variant="secondary">
            <Link href={`/entity/${entityId}/transactions`}>
              <ReceiptText aria-hidden className="size-4" />
              Open Transactions
            </Link>
          </Button>
        </Card>

        <Card title="Recent Documents" className="xl:col-span-1">
          <ul className="space-y-2 text-sm">
            {documents.map((document) => (
              <li className="rounded-xl border border-line/80 bg-surface px-3 py-2" key={document.id}>
                {document.fileName} ({Math.round(document.sizeBytes / 1024)} KB)
              </li>
            ))}
            {documents.length === 0 ? <li className="text-foreground/70">No documents uploaded yet.</li> : null}
          </ul>
          <Button asChild ariaLabel="Open manage tools section" className="mt-3 rounded-lg px-3 py-1" variant="secondary">
            <Link href={`/entity/${entityId}/manage`}>
              <FolderKanban aria-hidden className="size-4" />
              Open Manage Tools
            </Link>
          </Button>
        </Card>
      </div>
    </EntityShell>
  );
}
