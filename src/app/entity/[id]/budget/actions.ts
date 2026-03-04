"use server";

import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/session";
import { createEntityAccount } from "@/lib/data/accounts";
import {
  createEntityExpenseCategory,
  listEntityExpenseCategories,
} from "@/lib/data/expense-categories";
import { isDuplicateExpenseCategoryError } from "@/lib/data/expense-category-errors";
import { createEntityInstitution, listEntityInstitutions } from "@/lib/data/institutions";
import {
  addBudgetIncomeSource,
  addBudgetRecurringExpense,
  createEntityBudget,
  listEntityBudgets,
  removeBudgetIncomeSource,
  removeBudgetRecurringExpense,
  updateBudgetIncomeSource,
  updateBudgetRecurringExpense,
} from "@/lib/data/budgets";
import {
  ADD_ACCOUNT_OPTION,
  ADD_EXPENSE_CATEGORY_OPTION,
  ADD_INSTITUTION_OPTION,
} from "@/lib/domain/expense-form";
import { withToast } from "@/lib/navigation/toast";

async function requireUserEmail() {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  return email;
}

function normalizeInlineName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function isMissingConvexFunctionError(error: unknown, functionPath: string): boolean {
  return error instanceof Error && error.message.includes(`Could not find public function for '${functionPath}'`);
}

async function fallbackReplaceIncomeSource(
  email: string,
  entityId: string,
  incomeSourceId: string,
  input: {
    name: string;
    amountCents: number;
    cadence: "weekly" | "monthly" | "yearly";
    notes?: string;
  },
): Promise<void> {
  const budgets = await listEntityBudgets(email, entityId);
  const matchedBudget = budgets.find((budget) => budget.incomeSources.some((item) => item.id === incomeSourceId));
  if (!matchedBudget) {
    throw new Error("Income source not found.");
  }

  const replacementId = await addBudgetIncomeSource(email, matchedBudget.id, input);
  try {
    await removeBudgetIncomeSource(email, incomeSourceId);
  } catch (error) {
    await removeBudgetIncomeSource(email, replacementId).catch(() => undefined);
    throw error;
  }
}

async function fallbackReplaceRecurringExpense(
  email: string,
  entityId: string,
  recurringExpenseId: string,
  input: {
    name: string;
    amountCents: number;
    cadence: "weekly" | "monthly" | "yearly";
    accountId: string;
    categoryId: string;
    notes?: string;
  },
): Promise<void> {
  const budgets = await listEntityBudgets(email, entityId);
  const matchedBudget = budgets.find((budget) =>
    budget.recurringExpenses.some((item) => item.id === recurringExpenseId),
  );
  if (!matchedBudget) {
    throw new Error("Recurring expense not found.");
  }

  const replacementId = await addBudgetRecurringExpense(email, matchedBudget.id, input);
  try {
    await removeBudgetRecurringExpense(email, recurringExpenseId);
  } catch (error) {
    await removeBudgetRecurringExpense(email, replacementId).catch(() => undefined);
    throw error;
  }
}

/**
 * Creates an entity budget with weekly/monthly/yearly period.
 */
export async function createBudgetAction(entityId: string, formData: FormData): Promise<void> {
  const email = await requireUserEmail();
  const period = (formData.get("period") as "weekly" | "monthly" | "yearly") || "monthly";

  await createEntityBudget(email, entityId, {
    name: String(formData.get("name") || "Entity Budget").trim(),
    period,
    effectiveDate: String(formData.get("effectiveDate") || new Date().toISOString().slice(0, 10)),
  });

  redirect(withToast(`/entity/${entityId}/budget`, "budget-created"));
}

/**
 * Adds planned income source to budget.
 */
export async function addIncomeSourceAction(entityId: string, budgetId: string, formData: FormData): Promise<void> {
  const email = await requireUserEmail();
  const amount = Number(formData.get("amount") || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Income amount must be greater than zero.");
  }

  await addBudgetIncomeSource(email, budgetId, {
    name: String(formData.get("name") || "Income Source").trim(),
    amountCents: Math.round(amount * 100),
    cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly",
    notes: String(formData.get("notes") || "").trim() || undefined,
  });

  redirect(withToast(`/entity/${entityId}/budget`, "income-source-added"));
}

/**
 * Updates planned income source details.
 */
export async function updateIncomeSourceAction(
  entityId: string,
  incomeSourceId: string,
  formData: FormData,
): Promise<void> {
  const email = await requireUserEmail();
  const amount = Number(formData.get("amount") || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Income amount must be greater than zero.");
  }

  const payload = {
    name: String(formData.get("name") || "Income Source").trim(),
    amountCents: Math.round(amount * 100),
    cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly",
    notes: String(formData.get("notes") || "").trim() || undefined,
  };
  try {
    await updateBudgetIncomeSource(email, incomeSourceId, payload);
  } catch (error) {
    if (!isMissingConvexFunctionError(error, "budgets/incomeMutations:updateIncomeSource")) {
      throw error;
    }
    await fallbackReplaceIncomeSource(email, entityId, incomeSourceId, payload);
  }

  redirect(withToast(`/entity/${entityId}/budget`, "income-source-updated"));
}

/**
 * Adds planned recurring expense to budget.
 */
export async function addRecurringExpenseAction(entityId: string, budgetId: string, formData: FormData): Promise<void> {
  const email = await requireUserEmail();
  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("accountId") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Recurring expense amount must be greater than zero.");
  }
  if (!accountId || accountId === ADD_ACCOUNT_OPTION) {
    throw new Error("Please select a valid paid-from account.");
  }
  if (!categoryId || categoryId === ADD_EXPENSE_CATEGORY_OPTION) {
    throw new Error("Please select a valid expense category.");
  }

  await addBudgetRecurringExpense(email, budgetId, {
    name: String(formData.get("name") || "Recurring Expense").trim(),
    amountCents: Math.round(amount * 100),
    cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly",
    accountId,
    categoryId,
    notes: String(formData.get("notes") || "").trim() || undefined,
  });

  redirect(withToast(`/entity/${entityId}/budget`, "recurring-expense-added"));
}

/**
 * Creates a paid-from account for recurring expense attribution.
 */
export async function createBudgetAccountAction(
  entityId: string,
  formData: FormData,
): Promise<{ id: string; name: string; source: "manual" | "plaid" }> {
  const email = await requireUserEmail();
  const source = (formData.get("source") as "manual" | "plaid") || "manual";
  const institutionId = String(formData.get("institutionId") || "").trim();
  const name = String(formData.get("name") || "Checking Account").trim();
  if (!institutionId || institutionId === ADD_INSTITUTION_OPTION) {
    throw new Error("Please select a valid institution.");
  }

  const accountId = await createEntityAccount(email, entityId, {
    name,
    currency: String(formData.get("currency") || "USD").trim(),
    source,
    institutionId,
    plaidAccountId:
      source === "plaid" ? String(formData.get("plaidAccountId") || "").trim() || undefined : undefined,
  });

  return {
    id: accountId,
    name,
    source,
  };
}

/**
 * Creates an institution inline for account attribution.
 */
export async function createBudgetInstitutionAction(
  entityId: string,
  formData: FormData,
): Promise<{ id: string; name: string }> {
  const email = await requireUserEmail();
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    throw new Error("Institution name is required.");
  }

  try {
    const institutionId = await createEntityInstitution(email, entityId, name);
    return { id: institutionId, name };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("An institution with this name already exists.")) {
      throw error;
    }
  }

  const normalizedName = normalizeInlineName(name);
  const institutions = await listEntityInstitutions(email, entityId);
  const existingInstitution = institutions.find(
    (institution) => normalizeInlineName(institution.name) === normalizedName,
  );
  if (!existingInstitution) {
    throw new Error("Unable to resolve the existing institution.");
  }

  return {
    id: existingInstitution.id,
    name: existingInstitution.name,
  };
}

/**
 * Creates an expense category inline for recurring expense attribution.
 */
export async function createBudgetExpenseCategoryAction(
  entityId: string,
  formData: FormData,
): Promise<{ id: string; name: string }> {
  const email = await requireUserEmail();
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    throw new Error("Category name is required.");
  }

  try {
    const categoryId = await createEntityExpenseCategory(email, entityId, name);
    return { id: categoryId, name };
  } catch (error) {
    if (!isDuplicateExpenseCategoryError(error)) {
      throw error;
    }
  }

  const normalizedName = normalizeInlineName(name);
  const expenseCategories = await listEntityExpenseCategories(email, entityId);
  const existingCategory = expenseCategories.find(
    (category) => normalizeInlineName(category.name) === normalizedName,
  );
  if (!existingCategory) {
    throw new Error("Unable to resolve the existing expense category.");
  }

  return {
    id: existingCategory.id,
    name: existingCategory.name,
  };
}

/**
 * Removes planned income source from budget.
 */
export async function removeIncomeSourceAction(entityId: string, incomeSourceId: string): Promise<void> {
  const email = await requireUserEmail();
  await removeBudgetIncomeSource(email, incomeSourceId);
  redirect(withToast(`/entity/${entityId}/budget`, "income-source-removed"));
}

/**
 * Updates planned recurring expense details.
 */
export async function updateRecurringExpenseAction(
  entityId: string,
  recurringExpenseId: string,
  formData: FormData,
): Promise<void> {
  const email = await requireUserEmail();
  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("accountId") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Recurring expense amount must be greater than zero.");
  }
  if (!accountId || accountId === ADD_ACCOUNT_OPTION) {
    throw new Error("Please select a valid paid-from account.");
  }
  if (!categoryId || categoryId === ADD_EXPENSE_CATEGORY_OPTION) {
    throw new Error("Please select a valid expense category.");
  }

  const payload = {
    name: String(formData.get("name") || "Recurring Expense").trim(),
    amountCents: Math.round(amount * 100),
    cadence: (formData.get("cadence") as "weekly" | "monthly" | "yearly") || "monthly",
    accountId,
    categoryId,
    notes: String(formData.get("notes") || "").trim() || undefined,
  };
  try {
    await updateBudgetRecurringExpense(email, recurringExpenseId, payload);
  } catch (error) {
    if (!isMissingConvexFunctionError(error, "budgets/incomeMutations:updateRecurringExpense")) {
      throw error;
    }
    await fallbackReplaceRecurringExpense(email, entityId, recurringExpenseId, payload);
  }

  redirect(withToast(`/entity/${entityId}/budget`, "recurring-expense-updated"));
}

/**
 * Removes planned recurring expense from budget.
 */
export async function removeRecurringExpenseAction(entityId: string, recurringExpenseId: string): Promise<void> {
  const email = await requireUserEmail();
  await removeBudgetRecurringExpense(email, recurringExpenseId);
  redirect(withToast(`/entity/${entityId}/budget`, "recurring-expense-removed"));
}
