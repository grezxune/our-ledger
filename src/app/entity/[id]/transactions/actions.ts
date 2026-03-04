"use server";

import { redirect } from "next/navigation";
import { requireAuthSession } from "@/lib/auth/session";
import { createEntityExpenseCategory, listEntityExpenseCategories } from "@/lib/data/expense-categories";
import { isDuplicateExpenseCategoryError } from "@/lib/data/expense-category-errors";
import { createTransaction } from "@/lib/data/ledger";
import { ADD_EXPENSE_CATEGORY_OPTION } from "@/lib/domain/expense-form";
import { withToast } from "@/lib/navigation/toast";

/**
 * Adds manual ledger entries for one-off and recurring workflows.
 */
export async function createTransactionAction(entityId: string, formData: FormData): Promise<void> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

  const kind = (formData.get("kind") as "one_off" | "recurring") || "one_off";
  const categoryId = String(formData.get("categoryId") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }
  if (!categoryId || categoryId === ADD_EXPENSE_CATEGORY_OPTION) {
    throw new Error("Please select a valid expense category.");
  }
  const expenseCategories = await listEntityExpenseCategories(email, entityId);
  const selectedCategory = expenseCategories.find((category) => category.id === categoryId);
  if (!selectedCategory) {
    throw new Error("Selected expense category is not available for this entity.");
  }

  await createTransaction(email, entityId, {
    kind,
    type: (formData.get("type") as "income" | "expense") || "expense",
    status: (formData.get("status") as "pending" | "posted" | "voided") || "posted",
    amountCents: Math.round(amount * 100),
    date: String(formData.get("date") || new Date().toISOString().slice(0, 10)),
    category: selectedCategory.name,
    payee: String(formData.get("payee") || "").trim() || undefined,
    notes: String(formData.get("notes") || "").trim() || undefined,
    recurrence:
      kind === "recurring"
        ? {
            cadence: String(formData.get("cadence") || "monthly"),
            startDate: String(formData.get("startDate") || new Date().toISOString().slice(0, 10)),
            endDate: String(formData.get("endDate") || "").trim() || undefined,
            nextRunAt: String(formData.get("nextRunAt") || "").trim() || undefined,
          }
        : undefined,
  });

  redirect(withToast(`/entity/${entityId}/transactions`, "transaction-created"));
}

/**
 * Creates an expense category inline for transaction entry.
 */
export async function createTransactionExpenseCategoryAction(
  entityId: string,
  formData: FormData,
): Promise<{ id: string; name: string }> {
  const session = await requireAuthSession();
  const email = session.user?.email?.toLowerCase();
  if (!email) {
    redirect("/signin");
  }

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

  const normalizedName = name.toLowerCase().replace(/\s+/g, " ");
  const expenseCategories = await listEntityExpenseCategories(email, entityId);
  const existingCategory = expenseCategories.find(
    (category) => category.name.toLowerCase().replace(/\s+/g, " ") === normalizedName,
  );
  if (!existingCategory) {
    throw new Error("Unable to resolve the existing expense category.");
  }

  return {
    id: existingCategory.id,
    name: existingCategory.name,
  };
}
