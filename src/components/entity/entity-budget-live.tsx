"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import { EntityBudgetLiveView } from "@/components/entity/entity-budget-live-view";
import { useAuthUser } from "@/hooks/use-auth-user";
import { calculateBudgetSummary } from "@/lib/budget/math";
import { getCurrentMonthKey, isMonthKey } from "@/lib/budget/monthly";
import {
  ADD_ACCOUNT_OPTION,
  ADD_EXPENSE_CATEGORY_OPTION,
  ADD_INSTITUTION_OPTION,
  parseCheckboxValue,
} from "@/lib/domain/expense-form";
import type { BudgetMonthlySnapshot, BudgetPeriod, EntityAccount, EntityBudget } from "@/lib/domain/types";
import type { ToastKey } from "@/lib/navigation/toast";
import { withToast } from "@/lib/navigation/toast";

interface EntityBudgetLiveProps {
  entityId: string;
  currency: string;
}

interface NamedEntityOption {
  id: string;
  entityId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateBudgetArgs {
  userId: Id<"users">;
  entityId: Id<"entities">;
  input: { name: string; period: BudgetPeriod; effectiveDate: string };
}

interface AddIncomeSourceArgs {
  userId: Id<"users">;
  budgetId: Id<"entityBudgets">;
  input: { name: string; amountCents: number; cadence: BudgetPeriod; notes?: string };
}

interface RemoveIncomeSourceArgs {
  userId: Id<"users">;
  incomeSourceId: Id<"budgetIncomeSources">;
}

interface AddRecurringExpenseArgs {
  userId: Id<"users">;
  budgetId: Id<"entityBudgets">;
  input: {
    name: string;
    amountCents: number;
    cadence: BudgetPeriod;
    autoPay?: boolean;
    accountId?: Id<"entityAccounts">;
    categoryId: Id<"entityExpenseCategories">;
    notes?: string;
  };
}

interface RemoveRecurringExpenseArgs {
  userId: Id<"users">;
  recurringExpenseId: Id<"budgetRecurringExpenses">;
}

function normalizeInlineName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function isMissingConvexFunctionError(error: unknown, functionPath: string): boolean {
  return error instanceof Error && error.message.includes(`Could not find public function for '${functionPath}'`);
}

function withSummary(budget: EntityBudget): EntityBudget {
  return {
    ...budget,
    summary: calculateBudgetSummary({
      period: budget.period,
      incomes: budget.incomeSources.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
      expenses: budget.recurringExpenses.map((item) => ({ amountCents: item.amountCents, cadence: item.cadence })),
    }),
  };
}

function sortBudgets(budgets: EntityBudget[]): EntityBudget[] {
  return [...budgets].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function updateBudgetListQueries(
  localStore: OptimisticLocalStore,
  updater: (budgets: EntityBudget[]) => EntityBudget[] | null,
) {
  const entries = localStore.getAllQueries(api.budgets.queries.listByEntity);
  for (const entry of entries) {
    if (!entry.value) continue;
    const updated = updater(entry.value as EntityBudget[]);
    if (!updated) continue;
    localStore.setQuery(api.budgets.queries.listByEntity, entry.args, updated);
  }
}

/**
 * Reactive budget workspace powered by Convex client queries/mutations.
 */
export function EntityBudgetLive({ entityId, currency }: EntityBudgetLiveProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authArgs, userId } = useAuthUser();
  const resolvedEntityId = entityId as Id<"entities">;
  const queryArgs = useMemo(() => authArgs({ entityId: resolvedEntityId }), [authArgs, resolvedEntityId]);

  const budgetsQuery = useQuery(api.budgets.queries.listByEntity, queryArgs);
  const accountsQuery = useQuery(api.accounts.queries.listByEntity, queryArgs);
  const institutionsQuery = useQuery(api.institutions.queries.listByEntity, queryArgs);
  const expenseCategoriesQuery = useQuery(api.expenseCategories.queries.listByEntity, queryArgs);
  const budgets = useMemo(() => ((budgetsQuery as EntityBudget[] | undefined) ?? []), [budgetsQuery]);
  const accounts = useMemo(() => (accountsQuery || []) as EntityAccount[], [accountsQuery]);
  const institutions = useMemo(() => (institutionsQuery || []) as NamedEntityOption[], [institutionsQuery]);
  const expenseCategories = useMemo(
    () => (expenseCategoriesQuery || []) as NamedEntityOption[],
    [expenseCategoriesQuery],
  );
  const activeBudget = budgets.find((budget) => budget.status === "active") || budgets[0] || null;
  const [snapshotMonth, setSnapshotMonth] = useState(() => getCurrentMonthKey());
  const monthlySnapshotQueryArgs = useMemo(() => {
    if (!activeBudget) {
      return "skip";
    }
    return authArgs({ budgetId: activeBudget.id as Id<"entityBudgets">, month: snapshotMonth });
  }, [activeBudget, authArgs, snapshotMonth]);
  const monthlySnapshotQuery = useQuery(api.budgets.queries.getMonthlySnapshot, monthlySnapshotQueryArgs);
  const monthlySnapshot = monthlySnapshotQuery as BudgetMonthlySnapshot | undefined;

  const showToast = useCallback(
    (toast: ToastKey) => {
      const search = searchParams.toString();
      const currentPath = search ? `${pathname}?${search}` : pathname;
      router.replace(withToast(currentPath, toast), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const createBudget = useMutation(api.budgets.mutations.createBudget).withOptimisticUpdate((localStore, args) => {
    const typedArgs = args as unknown as CreateBudgetArgs;
    const now = new Date().toISOString();
    updateBudgetListQueries(localStore, (currentBudgets) =>
      sortBudgets([
        ...currentBudgets,
        {
          id: `optimistic-budget-${typedArgs.input.period}-${typedArgs.input.effectiveDate}-${normalizeInlineName(typedArgs.input.name)}`,
          entityId: typedArgs.entityId,
          name: typedArgs.input.name.trim(),
          period: typedArgs.input.period,
          effectiveDate: typedArgs.input.effectiveDate,
          status: "active",
          incomeSources: [],
          recurringExpenses: [],
          summary: { projectedIncomeCents: 0, projectedExpenseCents: 0, expectedRemainingCents: 0 },
          createdAt: now,
          updatedAt: now,
        },
      ]),
    );
  });

  const addIncomeSource = useMutation(api.budgets.mutations.addIncomeSource).withOptimisticUpdate((localStore, args) => {
    const typedArgs = args as unknown as AddIncomeSourceArgs;
    const now = new Date().toISOString();
    updateBudgetListQueries(localStore, (currentBudgets) => {
      let changed = false;
      const next = currentBudgets.map((budget) => {
        if (budget.id !== typedArgs.budgetId) return budget;
        changed = true;
        return withSummary({
          ...budget,
          updatedAt: now,
          incomeSources: [
            ...budget.incomeSources,
            {
              id: `optimistic-income-${budget.id}-${normalizeInlineName(typedArgs.input.name)}-${typedArgs.input.amountCents}-${typedArgs.input.cadence}`,
              budgetId: budget.id,
              entityId: budget.entityId,
              createdAt: now,
              updatedAt: now,
              ...typedArgs.input,
            },
          ],
        });
      });
      return changed ? sortBudgets(next) : null;
    });
  });

  const removeIncomeSource = useMutation(api.budgets.mutations.removeIncomeSource).withOptimisticUpdate((localStore, args) => {
    const typedArgs = args as unknown as RemoveIncomeSourceArgs;
    updateBudgetListQueries(localStore, (currentBudgets) => {
      let changed = false;
      const next = currentBudgets.map((budget) => {
        if (!budget.incomeSources.some((item) => item.id === typedArgs.incomeSourceId)) return budget;
        changed = true;
        return withSummary({ ...budget, incomeSources: budget.incomeSources.filter((item) => item.id !== typedArgs.incomeSourceId) });
      });
      return changed ? next : null;
    });
  });

  const addRecurringExpense = useMutation(api.budgets.mutations.addRecurringExpense).withOptimisticUpdate((localStore, args) => {
    const typedArgs = args as unknown as AddRecurringExpenseArgs;
    const now = new Date().toISOString();
    updateBudgetListQueries(localStore, (currentBudgets) => {
      let changed = false;
      const next = currentBudgets.map((budget) => {
        if (budget.id !== typedArgs.budgetId) return budget;
        changed = true;
        return withSummary({
          ...budget,
          updatedAt: now,
          recurringExpenses: [
            ...budget.recurringExpenses,
            {
              id: `optimistic-recurring-${budget.id}-${normalizeInlineName(typedArgs.input.name)}-${typedArgs.input.amountCents}-${typedArgs.input.cadence}`,
              budgetId: budget.id,
              entityId: budget.entityId,
              createdAt: now,
              updatedAt: now,
              category: budget.recurringExpenses.find((item) => item.categoryId === typedArgs.input.categoryId)?.category,
              ...typedArgs.input,
              autoPay: typedArgs.input.autoPay ?? false,
            },
          ],
        });
      });
      return changed ? sortBudgets(next) : null;
    });
  });

  const removeRecurringExpense = useMutation(api.budgets.mutations.removeRecurringExpense).withOptimisticUpdate((localStore, args) => {
    const typedArgs = args as unknown as RemoveRecurringExpenseArgs;
    updateBudgetListQueries(localStore, (currentBudgets) => {
      let changed = false;
      const next = currentBudgets.map((budget) => {
        if (!budget.recurringExpenses.some((item) => item.id === typedArgs.recurringExpenseId)) return budget;
        changed = true;
        return withSummary({
          ...budget,
          recurringExpenses: budget.recurringExpenses.filter((item) => item.id !== typedArgs.recurringExpenseId),
        });
      });
      return changed ? next : null;
    });
  });

  const updateIncomeSource = useMutation(api.budgets.incomeMutations.updateIncomeSource);
  const updateRecurringExpense = useMutation(api.budgets.incomeMutations.updateRecurringExpense);
  const addUnplannedIncomeSource = useMutation(api.budgets.mutations.addUnplannedIncomeSource);
  const removeUnplannedIncomeSource = useMutation(api.budgets.mutations.removeUnplannedIncomeSource);
  const upsertCreditCardReconciliation = useMutation(api.budgets.mutations.upsertCreditCardReconciliation);
  const removeCreditCardReconciliation = useMutation(api.budgets.mutations.removeCreditCardReconciliation);
  const createAccount = useMutation(api.accounts.mutations.create);
  const createInstitution = useMutation(api.institutions.mutations.create);
  const createExpenseCategory = useMutation(api.expenseCategories.mutations.create);

  const requireUserId = useCallback(() => {
    if (!userId) throw new Error("Authentication required.");
    return userId;
  }, [userId]);

  const createBudgetAction = useCallback(async (formData: FormData) => {
    const currentUserId = requireUserId();
    await createBudget({ userId: currentUserId, entityId: resolvedEntityId, input: { name: String(formData.get("name") || "Entity Budget").trim(), period: (formData.get("period") as "weekly" | "monthly" | "yearly") || "monthly", effectiveDate: String(formData.get("effectiveDate") || new Date().toISOString().slice(0, 10)) } });
    showToast("budget-created");
  }, [createBudget, requireUserId, resolvedEntityId, showToast]);

  const addIncomeSourceAction = useCallback(async (formData: FormData) => {
    if (!activeBudget) throw new Error("Budget not found.");
    const amount = Number(formData.get("amount") || 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Income amount must be greater than zero.");
    await addIncomeSource({ userId: requireUserId(), budgetId: activeBudget.id as Id<"entityBudgets">, input: { name: String(formData.get("name") || "Income Source").trim(), amountCents: Math.round(amount * 100), cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly", notes: String(formData.get("notes") || "").trim() || undefined } });
    showToast("income-source-added");
  }, [activeBudget, addIncomeSource, requireUserId, showToast]);

  const updateIncomeSourceAction = useCallback(async (incomeSourceId: string, formData: FormData) => {
    const payload = { name: String(formData.get("name") || "Income Source").trim(), amountCents: Math.round(Number(formData.get("amount") || 0) * 100), cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly", notes: String(formData.get("notes") || "").trim() || undefined };
    if (!Number.isFinite(payload.amountCents) || payload.amountCents <= 0) throw new Error("Income amount must be greater than zero.");
    try {
      await updateIncomeSource({ userId: requireUserId(), incomeSourceId: incomeSourceId as Id<"budgetIncomeSources">, input: payload });
    } catch (error) {
      if (!isMissingConvexFunctionError(error, "budgets/incomeMutations:updateIncomeSource")) throw error;
      const budget = budgets.find((item) => item.incomeSources.some((line) => line.id === incomeSourceId));
      if (!budget) throw new Error("Income source not found.");
      const replacementId = await addIncomeSource({ userId: requireUserId(), budgetId: budget.id as Id<"entityBudgets">, input: payload });
      await removeIncomeSource({ userId: requireUserId(), incomeSourceId: incomeSourceId as Id<"budgetIncomeSources"> }).catch(async (removeError) => { await removeIncomeSource({ userId: requireUserId(), incomeSourceId: replacementId }); throw removeError; });
    }
    showToast("income-source-updated");
  }, [addIncomeSource, budgets, removeIncomeSource, requireUserId, showToast, updateIncomeSource]);

  const removeIncomeSourceAction = useCallback(async (incomeSourceId: string) => {
    await removeIncomeSource({ userId: requireUserId(), incomeSourceId: incomeSourceId as Id<"budgetIncomeSources"> });
    showToast("income-source-removed");
  }, [removeIncomeSource, requireUserId, showToast]);

  const addRecurringExpenseAction = useCallback(async (formData: FormData) => {
    if (!activeBudget) throw new Error("Budget not found.");
    const amount = Number(formData.get("amount") || 0);
    const accountId = String(formData.get("accountId") || "").trim();
    const categoryId = String(formData.get("categoryId") || "").trim();
    const autoPay = parseCheckboxValue(formData, "autoPay");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Recurring expense amount must be greater than zero.");
    if (!accountId || accountId === ADD_ACCOUNT_OPTION) throw new Error("Please select a valid paid-from account.");
    if (!categoryId || categoryId === ADD_EXPENSE_CATEGORY_OPTION) throw new Error("Please select a valid expense category.");
    await addRecurringExpense({ userId: requireUserId(), budgetId: activeBudget.id as Id<"entityBudgets">, input: { name: String(formData.get("name") || "Recurring Expense").trim(), amountCents: Math.round(amount * 100), cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly", autoPay, accountId: accountId as Id<"entityAccounts">, categoryId: categoryId as Id<"entityExpenseCategories">, notes: String(formData.get("notes") || "").trim() || undefined } });
    showToast("recurring-expense-added");
  }, [activeBudget, addRecurringExpense, requireUserId, showToast]);

  const updateRecurringExpenseAction = useCallback(async (recurringExpenseId: string, formData: FormData) => {
    const amount = Number(formData.get("amount") || 0);
    const accountId = String(formData.get("accountId") || "").trim();
    const categoryId = String(formData.get("categoryId") || "").trim();
    const autoPay = parseCheckboxValue(formData, "autoPay");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Recurring expense amount must be greater than zero.");
    if (!accountId || accountId === ADD_ACCOUNT_OPTION) throw new Error("Please select a valid paid-from account.");
    if (!categoryId || categoryId === ADD_EXPENSE_CATEGORY_OPTION) throw new Error("Please select a valid expense category.");
    const payload = { name: String(formData.get("name") || "Recurring Expense").trim(), amountCents: Math.round(amount * 100), cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly", autoPay, accountId: accountId as Id<"entityAccounts">, categoryId: categoryId as Id<"entityExpenseCategories">, notes: String(formData.get("notes") || "").trim() || undefined };
    try {
      await updateRecurringExpense({ userId: requireUserId(), recurringExpenseId: recurringExpenseId as Id<"budgetRecurringExpenses">, input: payload });
    } catch (error) {
      if (!isMissingConvexFunctionError(error, "budgets/incomeMutations:updateRecurringExpense")) throw error;
      const budget = budgets.find((item) => item.recurringExpenses.some((line) => line.id === recurringExpenseId));
      if (!budget) throw new Error("Recurring expense not found.");
      const replacementId = await addRecurringExpense({ userId: requireUserId(), budgetId: budget.id as Id<"entityBudgets">, input: payload });
      await removeRecurringExpense({ userId: requireUserId(), recurringExpenseId: recurringExpenseId as Id<"budgetRecurringExpenses"> }).catch(async (removeError) => { await removeRecurringExpense({ userId: requireUserId(), recurringExpenseId: replacementId }); throw removeError; });
    }
    showToast("recurring-expense-updated");
  }, [addRecurringExpense, budgets, removeRecurringExpense, requireUserId, showToast, updateRecurringExpense]);

  const removeRecurringExpenseAction = useCallback(async (recurringExpenseId: string) => {
    await removeRecurringExpense({ userId: requireUserId(), recurringExpenseId: recurringExpenseId as Id<"budgetRecurringExpenses"> });
    showToast("recurring-expense-removed");
  }, [removeRecurringExpense, requireUserId, showToast]);

  const setSnapshotMonthAction = useCallback((month: string) => {
    if (!isMonthKey(month)) {
      return;
    }
    setSnapshotMonth(month);
  }, []);

  const addUnplannedIncomeSourceAction = useCallback(async (formData: FormData) => {
    if (!activeBudget) throw new Error("Budget not found.");
    const month = String(formData.get("month") || snapshotMonth).trim();
    const amount = Number(formData.get("amount") || 0);
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Income amount must be greater than zero.");
    await addUnplannedIncomeSource({
      userId: requireUserId(),
      budgetId: activeBudget.id as Id<"entityBudgets">,
      input: {
        month,
        name: String(formData.get("name") || "Unplanned Income").trim(),
        amountCents: Math.round(amount * 100),
        notes: String(formData.get("notes") || "").trim() || undefined,
      },
    });
    showToast("unplanned-income-added");
  }, [activeBudget, addUnplannedIncomeSource, requireUserId, showToast, snapshotMonth]);

  const removeUnplannedIncomeSourceAction = useCallback(async (unplannedIncomeSourceId: string) => {
    await removeUnplannedIncomeSource({
      userId: requireUserId(),
      unplannedIncomeSourceId: unplannedIncomeSourceId as Id<"budgetUnplannedIncomeSources">,
    });
    showToast("unplanned-income-removed");
  }, [removeUnplannedIncomeSource, requireUserId, showToast]);

  const upsertCreditCardReconciliationAction = useCallback(async (formData: FormData) => {
    if (!activeBudget) throw new Error("Budget not found.");
    const month = String(formData.get("month") || snapshotMonth).trim();
    const accountId = String(formData.get("accountId") || "").trim();
    const statementBalance = Number(formData.get("statementBalance") || 0);
    const ledgerBalance = Number(formData.get("ledgerBalance") || 0);
    if (!accountId) throw new Error("Please choose an account.");
    if (!Number.isFinite(statementBalance)) throw new Error("Statement balance must be a valid number.");
    if (!Number.isFinite(ledgerBalance)) throw new Error("Ledger balance must be a valid number.");
    await upsertCreditCardReconciliation({
      userId: requireUserId(),
      budgetId: activeBudget.id as Id<"entityBudgets">,
      input: {
        month,
        accountId: accountId as Id<"entityAccounts">,
        statementBalanceCents: Math.round(statementBalance * 100),
        ledgerBalanceCents: Math.round(ledgerBalance * 100),
        notes: String(formData.get("notes") || "").trim() || undefined,
      },
    });
    showToast("credit-reconciliation-saved");
  }, [activeBudget, requireUserId, showToast, snapshotMonth, upsertCreditCardReconciliation]);

  const removeCreditCardReconciliationAction = useCallback(async (creditCardReconciliationId: string) => {
    await removeCreditCardReconciliation({
      userId: requireUserId(),
      creditCardReconciliationId: creditCardReconciliationId as Id<"budgetCreditCardReconciliations">,
    });
    showToast("credit-reconciliation-removed");
  }, [removeCreditCardReconciliation, requireUserId, showToast]);

  const createAccountAction = useCallback(async (formData: FormData) => {
    const source = (formData.get("source") as "manual" | "plaid") || "manual";
    const institutionId = String(formData.get("institutionId") || "").trim();
    const name = String(formData.get("name") || "Checking Account").trim();
    if (!institutionId || institutionId === ADD_INSTITUTION_OPTION) throw new Error("Please select a valid institution.");
    const accountId = await createAccount({ userId: requireUserId(), entityId: resolvedEntityId, input: { name, currency: String(formData.get("currency") || "USD").trim(), source, institutionId: institutionId as Id<"entityInstitutions">, plaidAccountId: source === "plaid" ? String(formData.get("plaidAccountId") || "").trim() || undefined : undefined } });
    return { id: accountId, name, source };
  }, [createAccount, requireUserId, resolvedEntityId]);

  const createInstitutionAction = useCallback(async (formData: FormData): Promise<{ id: string; name: string }> => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Institution name is required.");
    try {
      const institutionId = await createInstitution({ userId: requireUserId(), entityId: resolvedEntityId, input: { name } });
      return { id: institutionId, name };
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("already exists")) throw error;
    }
    const existing = institutions.find((institution) => normalizeInlineName(institution.name) === normalizeInlineName(name));
    if (!existing) throw new Error("Unable to resolve the existing institution.");
    return { id: existing.id, name: existing.name };
  }, [createInstitution, institutions, requireUserId, resolvedEntityId]);

  const createExpenseCategoryAction = useCallback(async (formData: FormData): Promise<{ id: string; name: string }> => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Category name is required.");
    try {
      const categoryId = await createExpenseCategory({ userId: requireUserId(), entityId: resolvedEntityId, input: { name } });
      return { id: categoryId, name };
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("already exists")) throw error;
    }
    const existing = expenseCategories.find((category) => normalizeInlineName(category.name) === normalizeInlineName(name));
    if (!existing) throw new Error("Unable to resolve the existing expense category.");
    return { id: existing.id, name: existing.name };
  }, [createExpenseCategory, expenseCategories, requireUserId, resolvedEntityId]);

  return (
    <EntityBudgetLiveView
      accounts={accounts}
      addIncomeSourceAction={addIncomeSourceAction}
      addUnplannedIncomeSourceAction={addUnplannedIncomeSourceAction}
      addRecurringExpenseAction={addRecurringExpenseAction}
      budgets={budgets}
      createAccountAction={createAccountAction}
      createBudgetAction={createBudgetAction}
      createExpenseCategoryAction={createExpenseCategoryAction}
      createInstitutionAction={createInstitutionAction}
      currency={currency}
      expenseCategories={expenseCategories}
      institutions={institutions}
      monthlySnapshot={monthlySnapshot}
      removeCreditCardReconciliationAction={removeCreditCardReconciliationAction}
      removeIncomeSourceAction={removeIncomeSourceAction}
      removeRecurringExpenseAction={removeRecurringExpenseAction}
      removeUnplannedIncomeSourceAction={removeUnplannedIncomeSourceAction}
      setSnapshotMonthAction={setSnapshotMonthAction}
      snapshotMonth={snapshotMonth}
      upsertCreditCardReconciliationAction={upsertCreditCardReconciliationAction}
      updateIncomeSourceAction={updateIncomeSourceAction}
      updateRecurringExpenseAction={updateRecurringExpenseAction}
    />
  );
}
