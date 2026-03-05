import { v } from "convex/values";
import { authenticatedMutation } from "../lib/authFunctions";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { recordAuditEvent } from "../lib/audit";
import { requireMembership } from "../lib/permissions";
import { nowIso } from "../lib/time";

async function touchBudget(
  ctx: MutationCtx,
  budgetId: Id<"entityBudgets">,
  userId: Id<"users">,
) {
  const now = nowIso();
  await ctx.db.patch(budgetId, {
    updatedAt: now,
    updatedByUserId: userId,
  });
}

export const removeIncomeSource = authenticatedMutation({
  args: {
    userId: v.id("users"),
    incomeSourceId: v.id("budgetIncomeSources"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.incomeSourceId);
    if (!item) throw new Error("Income source not found.");

    await requireMembership(ctx, args.userId, item.entityId);
    await ctx.db.delete(item._id);
    await touchBudget(ctx, item.budgetId, args.userId);
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: item.entityId,
      action: "budget.income_source_removed",
      target: item._id,
      metadata: {
        budgetId: String(item.budgetId),
        incomeSourceId: String(item._id),
        name: item.name,
        amountCents: String(item.amountCents),
        cadence: item.cadence,
        notes: item.notes || "",
      },
    });
  },
});

export const removeRecurringExpense = authenticatedMutation({
  args: {
    userId: v.id("users"),
    recurringExpenseId: v.id("budgetRecurringExpenses"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.recurringExpenseId);
    if (!item) throw new Error("Recurring expense not found.");

    await requireMembership(ctx, args.userId, item.entityId);
    await ctx.db.delete(item._id);
    await touchBudget(ctx, item.budgetId, args.userId);
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: item.entityId,
      action: "budget.recurring_expense_removed",
      target: item._id,
      metadata: {
        budgetId: String(item.budgetId),
        recurringExpenseId: String(item._id),
        accountId: item.accountId ? String(item.accountId) : "",
        expenseCategoryId: item.categoryId ? String(item.categoryId) : "",
        name: item.name,
        amountCents: String(item.amountCents),
        cadence: item.cadence,
        category: item.category || "",
        notes: item.notes || "",
      },
    });
  },
});

export const removeUnplannedIncomeSource = authenticatedMutation({
  args: {
    userId: v.id("users"),
    unplannedIncomeSourceId: v.id("budgetUnplannedIncomeSources"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.unplannedIncomeSourceId);
    if (!item) throw new Error("Unplanned income source not found.");

    await requireMembership(ctx, args.userId, item.entityId);
    await ctx.db.delete(item._id);
    await touchBudget(ctx, item.budgetId, args.userId);
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: item.entityId,
      action: "budget.unplanned_income_removed",
      target: item._id,
      metadata: {
        budgetId: String(item.budgetId),
        unplannedIncomeSourceId: String(item._id),
        month: item.month,
        name: item.name,
        amountCents: String(item.amountCents),
        notes: item.notes || "",
      },
    });
  },
});

export const removeCreditCardReconciliation = authenticatedMutation({
  args: {
    userId: v.id("users"),
    creditCardReconciliationId: v.id("budgetCreditCardReconciliations"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.creditCardReconciliationId);
    if (!item) throw new Error("Credit card reconciliation not found.");

    await requireMembership(ctx, args.userId, item.entityId);
    await ctx.db.delete(item._id);
    await touchBudget(ctx, item.budgetId, args.userId);
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: item.entityId,
      action: "budget.credit_card_reconciliation_removed",
      target: item._id,
      metadata: {
        budgetId: String(item.budgetId),
        creditCardReconciliationId: String(item._id),
        month: item.month,
        accountId: String(item.accountId),
        statementBalanceCents: String(item.statementBalanceCents),
        ledgerBalanceCents: String(item.ledgerBalanceCents),
        notes: item.notes || "",
      },
    });
  },
});
