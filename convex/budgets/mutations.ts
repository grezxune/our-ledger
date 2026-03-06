import { v } from "convex/values";
import { authenticatedMutation } from "../lib/authFunctions";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { recordAuditEvent } from "../lib/audit";
import { requireMembership } from "../lib/permissions";
import { nowIso } from "../lib/time";
import { budgetPeriodValidator } from "../lib/validators";
import { requireFiniteAmount, requireMonthKey } from "./month";

const createBudgetInputValidator = v.object({
  name: v.string(),
  period: budgetPeriodValidator,
  effectiveDate: v.string(),
});

const incomeSourceInputValidator = v.object({
  name: v.string(),
  amountCents: v.number(),
  cadence: budgetPeriodValidator,
  notes: v.optional(v.string()),
});

const recurringExpenseInputValidator = v.object({
  name: v.string(),
  amountCents: v.number(),
  cadence: budgetPeriodValidator,
  autoPay: v.optional(v.boolean()),
  accountId: v.optional(v.id("entityAccounts")),
  categoryId: v.id("entityExpenseCategories"),
  notes: v.optional(v.string()),
});

const unplannedIncomeInputValidator = v.object({
  month: v.string(),
  accountId: v.optional(v.id("entityAccounts")),
  name: v.string(),
  amountCents: v.number(),
  notes: v.optional(v.string()),
});

const oneOffExpenseInputValidator = v.object({
  month: v.string(),
  accountId: v.id("entityAccounts"),
  name: v.string(),
  amountCents: v.number(),
  notes: v.optional(v.string()),
});

const monthlyAccountBalanceInputValidator = v.object({
  month: v.string(),
  accountId: v.id("entityAccounts"),
  balanceCents: v.number(),
  notes: v.optional(v.string()),
});

const creditCardReconciliationInputValidator = v.object({
  month: v.string(),
  accountId: v.id("entityAccounts"),
  statementBalanceCents: v.number(),
  ledgerBalanceCents: v.number(),
  notes: v.optional(v.string()),
});

async function requireBudgetMembership(
  ctx: MutationCtx,
  userId: Id<"users">,
  budgetId: Id<"entityBudgets">,
) {
  const budget = await ctx.db.get(budgetId);
  if (!budget) {
    throw new Error("Budget not found.");
  }

  await requireMembership(ctx, userId, budget.entityId);
  return budget;
}

function requirePositiveAmount(amountCents: number) {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
}

async function requireEntityAccount(
  ctx: MutationCtx,
  entityId: Id<"entities">,
  accountId: Id<"entityAccounts">,
) {
  const account = await ctx.db.get(accountId);
  if (!account || account.entityId !== entityId) {
    throw new Error("Selected account is not available for this entity.");
  }
  return account;
}

export const createBudget = authenticatedMutation({
  args: {
    userId: v.id("users"),
    entityId: v.id("entities"),
    input: createBudgetInputValidator,
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.userId, args.entityId);
    const now = nowIso();
    const budgetId = await ctx.db.insert("entityBudgets", {
      entityId: args.entityId,
      name: args.input.name.trim(),
      period: args.input.period,
      effectiveDate: args.input.effectiveDate,
      status: "active",
      createdByUserId: args.userId,
      updatedByUserId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: args.entityId,
      action: "budget.created",
      target: budgetId,
      metadata: {
        budgetId: String(budgetId),
        name: args.input.name.trim(),
        period: args.input.period,
        effectiveDate: args.input.effectiveDate,
      },
    });

    return budgetId;
  },
});

export const addIncomeSource = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: incomeSourceInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    const now = nowIso();
    const lineId = await ctx.db.insert("budgetIncomeSources", {
      budgetId: args.budgetId,
      entityId: budget.entityId,
      ...args.input,
      name: args.input.name.trim(),
      createdByUserId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: "budget.income_source_added",
      target: lineId,
      metadata: { budgetId: String(args.budgetId), incomeSourceId: String(lineId) },
    });

    return lineId;
  },
});

export const addRecurringExpense = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: recurringExpenseInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    const expenseCategory = await ctx.db.get(args.input.categoryId);
    if (!expenseCategory || expenseCategory.entityId !== budget.entityId) {
      throw new Error("Selected expense category is not available for this entity.");
    }
    if (args.input.accountId) {
      const account = await ctx.db.get(args.input.accountId);
      if (!account || account.entityId !== budget.entityId) {
        throw new Error("Selected account is not available for this entity.");
      }
    }
    const now = nowIso();
    const lineId = await ctx.db.insert("budgetRecurringExpenses", {
      budgetId: args.budgetId,
      entityId: budget.entityId,
      ...args.input,
      autoPay: args.input.autoPay ?? false,
      category: expenseCategory.name,
      name: args.input.name.trim(),
      createdByUserId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: "budget.recurring_expense_added",
      target: lineId,
      metadata: {
        budgetId: String(args.budgetId),
        recurringExpenseId: String(lineId),
        expenseCategoryId: String(args.input.categoryId),
        category: expenseCategory.name,
        autoPay: String(args.input.autoPay ?? false),
      },
    });

    return lineId;
  },
});

/**
 * Adds a month-specific one-off income source used in plan-vs-actual snapshots.
 */
export const addUnplannedIncomeSource = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: unplannedIncomeInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const month = requireMonthKey(args.input.month);
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    if (args.input.accountId) {
      await requireEntityAccount(ctx, budget.entityId, args.input.accountId);
    }
    const now = nowIso();
    const lineId = await ctx.db.insert("budgetUnplannedIncomeSources", {
      budgetId: args.budgetId,
      entityId: budget.entityId,
      month,
      accountId: args.input.accountId,
      name: args.input.name.trim(),
      amountCents: args.input.amountCents,
      notes: args.input.notes,
      createdByUserId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: "budget.unplanned_income_added",
      target: lineId,
      metadata: {
        budgetId: String(args.budgetId),
        unplannedIncomeSourceId: String(lineId),
        accountId: args.input.accountId ? String(args.input.accountId) : "",
        month,
        name: args.input.name.trim(),
        amountCents: String(args.input.amountCents),
      },
    });

    return lineId;
  },
});

/**
 * Adds a month-specific one-off expense entry tracked by account.
 */
export const addOneOffExpenseEntry = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: oneOffExpenseInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const month = requireMonthKey(args.input.month);
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    await requireEntityAccount(ctx, budget.entityId, args.input.accountId);

    const now = nowIso();
    const entryId = await ctx.db.insert("budgetOneOffExpenseEntries", {
      budgetId: args.budgetId,
      entityId: budget.entityId,
      month,
      accountId: args.input.accountId,
      name: args.input.name.trim(),
      amountCents: args.input.amountCents,
      notes: args.input.notes,
      createdByUserId: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: "budget.one_off_expense_added",
      target: entryId,
      metadata: {
        budgetId: String(args.budgetId),
        oneOffExpenseEntryId: String(entryId),
        month,
        accountId: String(args.input.accountId),
        name: args.input.name.trim(),
        amountCents: String(args.input.amountCents),
      },
    });

    return entryId;
  },
});

/**
 * Saves (create/update) monthly account balance capture entries.
 */
export const upsertMonthlyAccountBalance = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: monthlyAccountBalanceInputValidator,
  },
  handler: async (ctx, args) => {
    const month = requireMonthKey(args.input.month);
    requireFiniteAmount(args.input.balanceCents, "Account balance");
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    await requireEntityAccount(ctx, budget.entityId, args.input.accountId);

    const now = nowIso();
    const existing = await ctx.db
      .query("budgetMonthlyAccountBalances")
      .withIndex("by_budgetId_month_accountId", (queryBuilder) =>
        queryBuilder
          .eq("budgetId", args.budgetId)
          .eq("month", month)
          .eq("accountId", args.input.accountId),
      )
      .first();

    const accountBalanceId =
      existing?._id ??
      (await ctx.db.insert("budgetMonthlyAccountBalances", {
        budgetId: args.budgetId,
        entityId: budget.entityId,
        month,
        accountId: args.input.accountId,
        balanceCents: args.input.balanceCents,
        notes: args.input.notes,
        createdByUserId: args.userId,
        createdAt: now,
        updatedAt: now,
      }));

    if (existing) {
      await ctx.db.patch(existing._id, {
        balanceCents: args.input.balanceCents,
        notes: args.input.notes,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: existing
        ? "budget.account_balance_updated"
        : "budget.account_balance_added",
      target: accountBalanceId,
      metadata: {
        budgetId: String(args.budgetId),
        accountBalanceId: String(accountBalanceId),
        month,
        accountId: String(args.input.accountId),
        balanceCents: String(args.input.balanceCents),
      },
    });

    return accountBalanceId;
  },
});

/**
 * Saves (create/update) a monthly credit card reconciliation entry for one account.
 */
export const upsertCreditCardReconciliation = authenticatedMutation({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    input: creditCardReconciliationInputValidator,
  },
  handler: async (ctx, args) => {
    const month = requireMonthKey(args.input.month);
    requireFiniteAmount(args.input.statementBalanceCents, "Statement balance");
    requireFiniteAmount(args.input.ledgerBalanceCents, "Ledger balance");
    const budget = await requireBudgetMembership(ctx, args.userId, args.budgetId);
    const account = await ctx.db.get(args.input.accountId);
    if (!account || account.entityId !== budget.entityId) {
      throw new Error("Selected account is not available for this entity.");
    }

    const now = nowIso();
    const existing = await ctx.db
      .query("budgetCreditCardReconciliations")
      .withIndex("by_budgetId_month_accountId", (queryBuilder) =>
        queryBuilder
          .eq("budgetId", args.budgetId)
          .eq("month", month)
          .eq("accountId", args.input.accountId),
      )
      .first();

    const reconciliationId =
      existing?._id ??
      (await ctx.db.insert("budgetCreditCardReconciliations", {
        budgetId: args.budgetId,
        entityId: budget.entityId,
        month,
        accountId: args.input.accountId,
        statementBalanceCents: args.input.statementBalanceCents,
        ledgerBalanceCents: args.input.ledgerBalanceCents,
        notes: args.input.notes,
        createdByUserId: args.userId,
        createdAt: now,
        updatedAt: now,
      }));

    if (existing) {
      await ctx.db.patch(existing._id, {
        statementBalanceCents: args.input.statementBalanceCents,
        ledgerBalanceCents: args.input.ledgerBalanceCents,
        notes: args.input.notes,
        updatedAt: now,
      });
    }

    await ctx.db.patch(args.budgetId, { updatedAt: now, updatedByUserId: args.userId });
    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: budget.entityId,
      action: existing
        ? "budget.credit_card_reconciliation_updated"
        : "budget.credit_card_reconciliation_added",
      target: reconciliationId,
      metadata: {
        budgetId: String(args.budgetId),
        creditCardReconciliationId: String(reconciliationId),
        accountId: String(args.input.accountId),
        month,
        statementBalanceCents: String(args.input.statementBalanceCents),
        ledgerBalanceCents: String(args.input.ledgerBalanceCents),
      },
    });

    return reconciliationId;
  },
});

export {
  removeMonthlyAccountBalance,
  removeOneOffExpenseEntry,
  removeCreditCardReconciliation,
  removeIncomeSource,
  removeRecurringExpense,
  removeUnplannedIncomeSource,
} from "./removeMutations";
