import { v } from "convex/values";
import { authenticatedMutation } from "../lib/authFunctions";
import { recordAuditEvent } from "../lib/audit";
import { requireMembership } from "../lib/permissions";
import { nowIso } from "../lib/time";
import { budgetPeriodValidator } from "../lib/validators";

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
  accountId: v.id("entityAccounts"),
  categoryId: v.id("entityExpenseCategories"),
  notes: v.optional(v.string()),
});

function requirePositiveAmount(amountCents: number) {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
}

/**
 * Updates a planned income source line on a budget.
 */
export const updateIncomeSource = authenticatedMutation({
  args: {
    userId: v.id("users"),
    incomeSourceId: v.id("budgetIncomeSources"),
    input: incomeSourceInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const incomeSource = await ctx.db.get(args.incomeSourceId);
    if (!incomeSource) {
      throw new Error("Income source not found.");
    }

    await requireMembership(ctx, args.userId, incomeSource.entityId);
    const now = nowIso();
    await ctx.db.patch(args.incomeSourceId, {
      name: args.input.name.trim(),
      amountCents: args.input.amountCents,
      cadence: args.input.cadence,
      notes: args.input.notes,
      updatedAt: now,
    });

    await ctx.db.patch(incomeSource.budgetId, {
      updatedAt: now,
      updatedByUserId: args.userId,
    });

    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: incomeSource.entityId,
      action: "budget.income_source_updated",
      target: incomeSource._id,
      metadata: {
        budgetId: String(incomeSource.budgetId),
        incomeSourceId: String(incomeSource._id),
        previousName: incomeSource.name,
        previousAmountCents: String(incomeSource.amountCents),
        name: args.input.name.trim(),
        amountCents: String(args.input.amountCents),
        cadence: args.input.cadence,
        notes: args.input.notes?.trim() || "",
      },
    });
  },
});

/**
 * Updates a planned recurring expense line on a budget.
 */
export const updateRecurringExpense = authenticatedMutation({
  args: {
    userId: v.id("users"),
    recurringExpenseId: v.id("budgetRecurringExpenses"),
    input: recurringExpenseInputValidator,
  },
  handler: async (ctx, args) => {
    requirePositiveAmount(args.input.amountCents);
    const recurringExpense = await ctx.db.get(args.recurringExpenseId);
    if (!recurringExpense) {
      throw new Error("Recurring expense not found.");
    }

    await requireMembership(ctx, args.userId, recurringExpense.entityId);
    const account = await ctx.db.get(args.input.accountId);
    if (!account || account.entityId !== recurringExpense.entityId) {
      throw new Error("Selected account is not available for this entity.");
    }
    const expenseCategory = await ctx.db.get(args.input.categoryId);
    if (!expenseCategory || expenseCategory.entityId !== recurringExpense.entityId) {
      throw new Error("Selected expense category is not available for this entity.");
    }

    const now = nowIso();
    await ctx.db.patch(args.recurringExpenseId, {
      name: args.input.name.trim(),
      amountCents: args.input.amountCents,
      cadence: args.input.cadence,
      autoPay: args.input.autoPay ?? false,
      accountId: args.input.accountId,
      categoryId: args.input.categoryId,
      category: expenseCategory.name,
      notes: args.input.notes,
      updatedAt: now,
    });

    await ctx.db.patch(recurringExpense.budgetId, {
      updatedAt: now,
      updatedByUserId: args.userId,
    });

    await recordAuditEvent(ctx, {
      actorUserId: args.userId,
      entityId: recurringExpense.entityId,
      action: "budget.recurring_expense_updated",
      target: recurringExpense._id,
      metadata: {
        budgetId: String(recurringExpense.budgetId),
        recurringExpenseId: String(recurringExpense._id),
        previousName: recurringExpense.name,
        previousAmountCents: String(recurringExpense.amountCents),
        previousAccountId: recurringExpense.accountId ? String(recurringExpense.accountId) : "",
        previousExpenseCategoryId: recurringExpense.categoryId ? String(recurringExpense.categoryId) : "",
        previousCategory: recurringExpense.category || "",
        previousAutoPay: String(recurringExpense.autoPay ?? false),
        name: args.input.name.trim(),
        amountCents: String(args.input.amountCents),
        accountId: String(args.input.accountId),
        expenseCategoryId: String(args.input.categoryId),
        category: expenseCategory.name,
        autoPay: String(args.input.autoPay ?? false),
        cadence: args.input.cadence,
        notes: args.input.notes?.trim() || "",
      },
    });
  },
});
