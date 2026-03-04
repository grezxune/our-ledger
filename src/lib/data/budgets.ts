import "server-only";
import { api } from "@convex/_generated/api";
import type { BudgetPeriod, EntityBudget } from "@/lib/domain/types";
import { asId, createAuthenticatedConvexClient } from "@/lib/data/convex";
import { ensureUser } from "@/lib/data/users";

async function requireUserId(userEmail: string) {
  const user = await ensureUser(userEmail);
  return asId<"users">(user.id);
}

/**
 * Lists all budgets for an authorized entity member.
 */
export async function listEntityBudgets(userEmail: string, entityId: string): Promise<EntityBudget[]> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  return client.query(api.budgets.queries.listByEntity, {
    userId,
    entityId: asId<"entities">(entityId),
  });
}

/**
 * Creates an entity budget for weekly, monthly, or yearly planning.
 */
export async function createEntityBudget(
  userEmail: string,
  entityId: string,
  input: { name: string; period: BudgetPeriod; effectiveDate: string },
): Promise<string> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  return client.mutation(api.budgets.mutations.createBudget, {
    userId,
    entityId: asId<"entities">(entityId),
    input,
  });
}

/**
 * Adds a planned income source line to a budget.
 */
export async function addBudgetIncomeSource(
  userEmail: string,
  budgetId: string,
  input: { name: string; amountCents: number; cadence: BudgetPeriod; notes?: string },
): Promise<string> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  return client.mutation(api.budgets.mutations.addIncomeSource, {
    userId,
    budgetId: asId<"entityBudgets">(budgetId),
    input,
  });
}

/**
 * Updates a planned income source line on a budget.
 */
export async function updateBudgetIncomeSource(
  userEmail: string,
  incomeSourceId: string,
  input: { name: string; amountCents: number; cadence: BudgetPeriod; notes?: string },
): Promise<void> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  await client.mutation(api.budgets.incomeMutations.updateIncomeSource, {
    userId,
    incomeSourceId: asId<"budgetIncomeSources">(incomeSourceId),
    input,
  });
}

/**
 * Adds a planned recurring expense line to a budget.
 */
export async function addBudgetRecurringExpense(
  userEmail: string,
  budgetId: string,
  input: {
    name: string;
    amountCents: number;
    cadence: BudgetPeriod;
    autoPay?: boolean;
    accountId?: string;
    categoryId: string;
    notes?: string;
  },
): Promise<string> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  return client.mutation(api.budgets.mutations.addRecurringExpense, {
    userId,
    budgetId: asId<"entityBudgets">(budgetId),
    input: {
      ...input,
      accountId: input.accountId ? asId<"entityAccounts">(input.accountId) : undefined,
      categoryId: asId<"entityExpenseCategories">(input.categoryId),
    },
  });
}

/**
 * Updates a planned recurring expense line on a budget.
 */
export async function updateBudgetRecurringExpense(
  userEmail: string,
  recurringExpenseId: string,
  input: {
    name: string;
    amountCents: number;
    cadence: BudgetPeriod;
    autoPay?: boolean;
    accountId: string;
    categoryId: string;
    notes?: string;
  },
): Promise<void> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  await client.mutation(api.budgets.incomeMutations.updateRecurringExpense, {
    userId,
    recurringExpenseId: asId<"budgetRecurringExpenses">(recurringExpenseId),
    input: {
      ...input,
      accountId: asId<"entityAccounts">(input.accountId),
      categoryId: asId<"entityExpenseCategories">(input.categoryId),
    },
  });
}

/**
 * Removes a planned income source from a budget.
 */
export async function removeBudgetIncomeSource(userEmail: string, incomeSourceId: string): Promise<void> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  await client.mutation(api.budgets.mutations.removeIncomeSource, {
    userId,
    incomeSourceId: asId<"budgetIncomeSources">(incomeSourceId),
  });
}

/**
 * Removes a planned recurring expense from a budget.
 */
export async function removeBudgetRecurringExpense(userEmail: string, recurringExpenseId: string): Promise<void> {
  const userId = await requireUserId(userEmail);
  const client = await createAuthenticatedConvexClient(userEmail);

  await client.mutation(api.budgets.mutations.removeRecurringExpense, {
    userId,
    recurringExpenseId: asId<"budgetRecurringExpenses">(recurringExpenseId),
  });
}
