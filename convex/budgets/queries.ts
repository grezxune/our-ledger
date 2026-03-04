import { v } from "convex/values";
import { authenticatedQuery } from "../lib/authFunctions";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { requireMembership } from "../lib/permissions";
import { calculateBudgetSummary } from "./math";

function mapIncomeSource(item: Doc<"budgetIncomeSources">) {
  return {
    id: item._id,
    budgetId: item.budgetId,
    entityId: item.entityId,
    name: item.name,
    amountCents: item.amountCents,
    cadence: item.cadence,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapRecurringExpense(item: Doc<"budgetRecurringExpenses">) {
  return {
    id: item._id,
    budgetId: item.budgetId,
    entityId: item.entityId,
    accountId: item.accountId,
    categoryId: item.categoryId,
    name: item.name,
    amountCents: item.amountCents,
    cadence: item.cadence,
    autoPay: item.autoPay ?? false,
    category: item.category,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function loadBudgetDetails(
  ctx: QueryCtx,
  budget: Doc<"entityBudgets">,
) {
  const [incomes, expenses] = await Promise.all([
    ctx.db.query("budgetIncomeSources").withIndex("by_budgetId", (q) => q.eq("budgetId", budget._id)).collect(),
    ctx.db
      .query("budgetRecurringExpenses")
      .withIndex("by_budgetId", (q) => q.eq("budgetId", budget._id))
      .collect(),
  ]);
  const accountIds = Array.from(
    new Set(expenses.map((item) => item.accountId).filter((value): value is Id<"entityAccounts"> => Boolean(value))),
  );
  const accountEntries = await Promise.all(accountIds.map((accountId) => ctx.db.get(accountId)));
  const accountMap = new Map(accountEntries.filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)).map((entry) => [entry._id, entry]));

  const summary = calculateBudgetSummary({
    period: budget.period,
    incomes: incomes.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
    expenses: expenses.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
  });

  return {
    id: budget._id,
    entityId: budget.entityId,
    name: budget.name,
    period: budget.period,
    effectiveDate: budget.effectiveDate,
    status: budget.status,
    summary,
    incomeSources: incomes.map(mapIncomeSource),
    recurringExpenses: expenses.map((item) => {
      const account = item.accountId ? accountMap.get(item.accountId) : null;
      return {
        ...mapRecurringExpense(item),
        paidFromAccount: account
          ? {
              id: account._id,
              name: account.name,
              source: account.source,
            }
          : undefined,
      };
    }),
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

/**
 * Lists budgets and computed expected-remaining summaries for an entity.
 */
export const listByEntity = authenticatedQuery({
  args: {
    userId: v.id("users"),
    entityId: v.id("entities"),
  },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.userId, args.entityId);

    const budgets = await ctx.db
      .query("entityBudgets")
      .withIndex("by_entityId", (q) => q.eq("entityId", args.entityId))
      .collect();

    const hydrated = await Promise.all(budgets.map((budget) => loadBudgetDetails(ctx, budget)));
    return hydrated.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  },
});

/**
 * Loads one budget with line items and expected-remaining summary.
 */
export const getBudgetById = authenticatedQuery({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) {
      throw new Error("Budget not found.");
    }

    await requireMembership(ctx, args.userId, budget.entityId);
    return loadBudgetDetails(ctx, budget);
  },
});
