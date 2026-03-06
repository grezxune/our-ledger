import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { requireUserById } from "../lib/users";

export interface AuditViewer {
  userId: Id<"users">;
  isSuperAdmin: boolean;
  visibleEntityIds: Set<Id<"entities">>;
}

interface RelatedReference {
  table: TableNames;
  id: string;
}

interface RecordSnapshot {
  table: TableNames;
  id: string;
  exists: boolean;
  data: Record<string, unknown> | null;
}

const METADATA_REFERENCE_TABLES: Record<string, TableNames> = {
  entityId: "entities",
  budgetId: "entityBudgets",
  accountId: "entityAccounts",
  institutionId: "entityInstitutions",
  expenseCategoryId: "entityExpenseCategories",
  incomeSourceId: "budgetIncomeSources",
  recurringExpenseId: "budgetRecurringExpenses",
  unplannedIncomeSourceId: "budgetUnplannedIncomeSources",
  oneOffExpenseEntryId: "budgetOneOffExpenseEntries",
  accountBalanceId: "budgetMonthlyAccountBalances",
  creditCardReconciliationId: "budgetCreditCardReconciliations",
  transactionId: "transactions",
  sourceTransactionId: "transactions",
  invitationId: "invitations",
  documentId: "documents",
};

function resolveTargetTable(action: string): TableNames | null {
  if (action.startsWith("entity.")) return "entities";
  if (action.startsWith("account.")) return "entityAccounts";
  if (action.startsWith("institution.")) return "entityInstitutions";
  if (action.startsWith("expense_category.")) return "entityExpenseCategories";
  if (action.startsWith("transaction.")) return "transactions";
  if (action === "budget.created") return "entityBudgets";
  if (action.startsWith("budget.income_source_")) return "budgetIncomeSources";
  if (action.startsWith("budget.recurring_expense_")) return "budgetRecurringExpenses";
  if (action.startsWith("budget.unplanned_income_")) return "budgetUnplannedIncomeSources";
  if (action.startsWith("budget.one_off_expense_")) return "budgetOneOffExpenseEntries";
  if (action.startsWith("budget.account_balance_")) return "budgetMonthlyAccountBalances";
  if (action.startsWith("budget.credit_card_reconciliation_")) return "budgetCreditCardReconciliations";
  if (action.startsWith("invitation.")) return "invitations";
  if (action.startsWith("document.")) return "documents";
  if (action.startsWith("storage.config.")) return "storageConfigurations";
  return null;
}

function readString(data: Record<string, unknown> | null, key: string): string | undefined {
  const value = data?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function collectRelatedReferences(
  metadata: Record<string, string> | undefined,
  targetData: Record<string, unknown> | null,
): RelatedReference[] {
  const related: RelatedReference[] = [];
  for (const [key, table] of Object.entries(METADATA_REFERENCE_TABLES)) {
    const value = metadata?.[key];
    if (value) related.push({ table, id: value });
  }

  const targetEntityId = readString(targetData, "entityId");
  const targetBudgetId = readString(targetData, "budgetId");
  const targetAccountId = readString(targetData, "accountId");
  const sourceTransactionId = readString(targetData, "sourceTransactionId");
  if (targetEntityId) related.push({ table: "entities", id: targetEntityId });
  if (targetBudgetId) related.push({ table: "entityBudgets", id: targetBudgetId });
  if (targetAccountId) related.push({ table: "entityAccounts", id: targetAccountId });
  if (sourceTransactionId) related.push({ table: "transactions", id: sourceTransactionId });

  return related;
}

async function loadRecordSnapshot(
  ctx: QueryCtx,
  table: TableNames,
  id: string,
): Promise<RecordSnapshot | null> {
  const normalizedId = ctx.db.normalizeId(table, id);
  if (!normalizedId) {
    return null;
  }

  const document = await ctx.db.get(normalizedId as Id<TableNames>);
  return {
    table,
    id,
    exists: Boolean(document),
    data: document ? { ...document } : null,
  };
}

export async function getAuditViewer(ctx: QueryCtx, userId: Id<"users">): Promise<AuditViewer> {
  const user = await requireUserById(ctx, userId);
  const memberships = await ctx.db
    .query("memberships")
    .withIndex("by_userId", (queryBuilder) => queryBuilder.eq("userId", userId))
    .collect();

  return {
    userId,
    isSuperAdmin: user.platformRole === "super_admin",
    visibleEntityIds: new Set(memberships.map((membership) => membership.entityId)),
  };
}

export function canViewAuditEvent(event: Doc<"auditEvents">, viewer: AuditViewer): boolean {
  if (event.entityId) {
    return viewer.visibleEntityIds.has(event.entityId);
  }

  return event.actorUserId === viewer.userId || viewer.isSuperAdmin;
}

export async function resolveAuditDetail(
  ctx: QueryCtx,
  event: Doc<"auditEvents">,
) {
  const entity = event.entityId ? await ctx.db.get(event.entityId) : null;
  const targetTable = resolveTargetTable(event.action);
  const targetRecord = targetTable ? await loadRecordSnapshot(ctx, targetTable, event.target) : null;
  const references = collectRelatedReferences(event.metadata, targetRecord?.data ?? null);
  const dedupedReferences = Array.from(
    new Map(references.map((entry) => [`${entry.table}:${entry.id}`, entry])).values(),
  ).filter((entry) => !(targetRecord && entry.table === targetRecord.table && entry.id === targetRecord.id));

  const relatedCandidates = await Promise.all(
    dedupedReferences.map(async (entry) => loadRecordSnapshot(ctx, entry.table, entry.id)),
  );
  const relatedRecords = relatedCandidates.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return {
    entity: entity
      ? {
          id: entity._id,
          name: entity.name,
          type: entity.type,
          currency: entity.currency,
        }
      : null,
    targetType: targetTable,
    targetRecord,
    relatedRecords,
  };
}
