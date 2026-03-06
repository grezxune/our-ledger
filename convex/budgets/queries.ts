import { v } from "convex/values";
import { authenticatedQuery } from "../lib/authFunctions";
import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { requireMembership } from "../lib/permissions";
import { calculateBudgetSummary } from "./math";
import { requireMonthKey, toMonthDateRange } from "./month";

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

function mapUnplannedIncomeSource(item: Doc<"budgetUnplannedIncomeSources">) {
  return {
    id: item._id,
    budgetId: item.budgetId,
    entityId: item.entityId,
    month: item.month,
    accountId: item.accountId,
    name: item.name,
    amountCents: item.amountCents,
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

/**
 * Returns monthly plan-vs-actual totals, one-off incomes, and card reconciliation entries.
 */
export const getMonthlySnapshot = authenticatedQuery({
  args: {
    userId: v.id("users"),
    budgetId: v.id("entityBudgets"),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.budgetId);
    if (!budget) {
      throw new Error("Budget not found.");
    }

    const month = requireMonthKey(args.month);
    await requireMembership(ctx, args.userId, budget.entityId);
    const { start, endExclusive } = toMonthDateRange(month);

    const [
      plannedIncomes,
      plannedExpenses,
      unplannedIncomeSources,
      oneOffExpenseEntries,
      accountBalances,
      reconciliations,
      transactions,
    ] = await Promise.all([
      ctx.db.query("budgetIncomeSources").withIndex("by_budgetId", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId)).collect(),
      ctx.db
        .query("budgetRecurringExpenses")
        .withIndex("by_budgetId", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId))
        .collect(),
      ctx.db
        .query("budgetUnplannedIncomeSources")
        .withIndex("by_budgetId_month", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId).eq("month", month))
        .collect(),
      ctx.db
        .query("budgetOneOffExpenseEntries")
        .withIndex("by_budgetId_month", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId).eq("month", month))
        .collect(),
      ctx.db
        .query("budgetMonthlyAccountBalances")
        .withIndex("by_budgetId_month", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId).eq("month", month))
        .collect(),
      ctx.db
        .query("budgetCreditCardReconciliations")
        .withIndex("by_budgetId_month", (queryBuilder) => queryBuilder.eq("budgetId", args.budgetId).eq("month", month))
        .collect(),
      ctx.db
        .query("transactions")
        .withIndex("by_entityId_date", (queryBuilder) =>
          queryBuilder.eq("entityId", budget.entityId).gte("date", start).lt("date", endExclusive),
        )
        .collect(),
    ]);

    const baseMonthly = calculateBudgetSummary({
      period: "monthly",
      incomes: plannedIncomes.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
      expenses: plannedExpenses.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
    });
    const unplannedIncomeCents = unplannedIncomeSources.reduce((sum, item) => sum + item.amountCents, 0);
    const oneOffExpenseCents = oneOffExpenseEntries.reduce((sum, item) => sum + item.amountCents, 0);
    const expectedIncomeCents = baseMonthly.projectedIncomeCents;
    const expectedExpenseCents = baseMonthly.projectedExpenseCents;
    const expectedRemainingCents = expectedIncomeCents - expectedExpenseCents;

    const postedTransactions = transactions.filter((item) => item.status === "posted");
    const postedIncomeCents = postedTransactions.reduce((sum, item) => (item.type === "income" ? sum + item.amountCents : sum), 0);
    const postedExpenseCents = postedTransactions.reduce((sum, item) => (item.type === "expense" ? sum + item.amountCents : sum), 0);
    const actualIncomeCents = postedIncomeCents + unplannedIncomeCents;
    const actualExpenseCents = postedExpenseCents + oneOffExpenseCents;
    const actualRemainingCents = actualIncomeCents - actualExpenseCents;
    const incomeVarianceCents = actualIncomeCents - expectedIncomeCents;
    const expenseVarianceCents = actualExpenseCents - expectedExpenseCents;
    const remainingVarianceCents = actualRemainingCents - expectedRemainingCents;

    const accountIds = Array.from(
      new Set(
        [
          ...reconciliations.map((item) => item.accountId),
          ...accountBalances.map((item) => item.accountId),
          ...oneOffExpenseEntries.map((item) => item.accountId),
          ...unplannedIncomeSources
            .map((item) => item.accountId)
            .filter((value): value is Id<"entityAccounts"> => Boolean(value)),
        ],
      ),
    );
    const reconciliationAccounts = await Promise.all(accountIds.map((accountId) => ctx.db.get(accountId)));
    const accountMap = new Map(
      reconciliationAccounts
        .filter((account): account is NonNullable<typeof account> => Boolean(account))
        .map((account) => [account._id, account]),
    );

    const mappedUnplannedIncomeSources = unplannedIncomeSources
      .map((item) => ({
        ...mapUnplannedIncomeSource(item),
        accountName: item.accountId ? accountMap.get(item.accountId)?.name || "Account removed" : undefined,
      }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const mappedOneOffExpenseEntries = oneOffExpenseEntries
      .map((item) => ({
        id: item._id,
        budgetId: item.budgetId,
        entityId: item.entityId,
        month: item.month,
        accountId: item.accountId,
        accountName: accountMap.get(item.accountId)?.name || "Account removed",
        name: item.name,
        amountCents: item.amountCents,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const mappedAccountBalances = accountBalances
      .map((item) => ({
        id: item._id,
        budgetId: item.budgetId,
        entityId: item.entityId,
        month: item.month,
        accountId: item.accountId,
        accountName: accountMap.get(item.accountId)?.name || "Account removed",
        balanceCents: item.balanceCents,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((left, right) => left.accountName.localeCompare(right.accountName));
    const totalAccountBalanceCents = mappedAccountBalances.reduce((sum, item) => sum + item.balanceCents, 0);

    const mappedReconciliations = reconciliations
      .map((item) => ({
        id: item._id,
        budgetId: item.budgetId,
        entityId: item.entityId,
        month: item.month,
        accountId: item.accountId,
        accountName: accountMap.get(item.accountId)?.name || "Account removed",
        statementBalanceCents: item.statementBalanceCents,
        ledgerBalanceCents: item.ledgerBalanceCents,
        reconciliationGapCents: item.statementBalanceCents - item.ledgerBalanceCents,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))
      .sort((left, right) => left.accountName.localeCompare(right.accountName));
    const totalReconciliationGapCents = mappedReconciliations.reduce(
      (sum, item) => sum + item.reconciliationGapCents,
      0,
    );

    return {
      month,
      expectedIncomeCents,
      expectedExpenseCents,
      expectedRemainingCents,
      actualIncomeCents,
      actualExpenseCents,
      actualRemainingCents,
      incomeVarianceCents,
      expenseVarianceCents,
      remainingVarianceCents,
      unplannedIncomeCents,
      oneOffExpenseCents,
      unplannedIncomeSources: mappedUnplannedIncomeSources,
      oneOffExpenseEntries: mappedOneOffExpenseEntries,
      accountBalances: mappedAccountBalances,
      creditCardReconciliations: mappedReconciliations,
      reconciledCardCount: mappedReconciliations.length,
      totalReconciliationGapCents,
      totalAccountBalanceCents,
    };
  },
});
