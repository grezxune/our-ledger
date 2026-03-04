"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatIncomeCurrency, toAmountInputValue, toCadenceLabel } from "@/components/entity/planned-income-source-format";
import { BUDGET_PERIOD_OPTIONS } from "@/lib/domain/options";
import type { BudgetRecurringExpense, EntityAccount } from "@/lib/domain/types";

interface NamedEntityOption {
  id: string;
  name: string;
}

interface RecurringExpenseListProps {
  recurringExpenses: BudgetRecurringExpense[];
  accounts: EntityAccount[];
  expenseCategories: NamedEntityOption[];
  currency: string;
  updateRecurringExpenseAction: (recurringExpenseId: string, formData: FormData) => Promise<void>;
  removeRecurringExpenseAction: (recurringExpenseId: string) => Promise<void>;
}

/**
 * Recurring expense list with confirmation-gated destructive action.
 */
export function RecurringExpenseList({
  recurringExpenses,
  accounts,
  expenseCategories,
  currency,
  updateRecurringExpenseAction,
  removeRecurringExpenseAction,
}: RecurringExpenseListProps) {
  const [editingRecurringExpenseId, setEditingRecurringExpenseId] = useState<string | null>(null);
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState<BudgetRecurringExpense | null>(null);
  const editingRecurringExpense = useMemo(
    () => recurringExpenses.find((item) => item.id === editingRecurringExpenseId) || null,
    [editingRecurringExpenseId, recurringExpenses],
  );
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: `${account.name} (${account.source === "plaid" ? "Plaid" : "Manual"})`,
        value: account.id,
      })),
    [accounts],
  );
  const categoryOptions = useMemo(
    () => expenseCategories.map((category) => ({ label: category.name, value: category.id })),
    [expenseCategories],
  );
  const resolvedAccountOptions = useMemo(() => {
    if (!editingRecurringExpense || !editingRecurringExpense.accountId) {
      return accountOptions;
    }

    const hasCurrent = accountOptions.some((option) => option.value === editingRecurringExpense.accountId);
    if (hasCurrent) {
      return accountOptions;
    }

    return [
      ...accountOptions,
      {
        label: editingRecurringExpense.paidFromAccount?.name || "Current account",
        value: editingRecurringExpense.accountId,
      },
    ];
  }, [accountOptions, editingRecurringExpense]);
  const resolvedCategoryOptions = useMemo(() => {
    if (!editingRecurringExpense || !editingRecurringExpense.categoryId) {
      return categoryOptions;
    }

    const hasCurrent = categoryOptions.some((option) => option.value === editingRecurringExpense.categoryId);
    if (hasCurrent) {
      return categoryOptions;
    }

    return [
      ...categoryOptions,
      {
        label: editingRecurringExpense.category || "Current category",
        value: editingRecurringExpense.categoryId,
      },
    ];
  }, [categoryOptions, editingRecurringExpense]);
  const canSubmitEdit = resolvedAccountOptions.length > 0 && resolvedCategoryOptions.length > 0;

  function closeEditModal() {
    setEditingRecurringExpenseId(null);
  }

  return (
    <>
      {recurringExpenses.length === 0 ? <p className="mt-4 text-sm text-foreground/70">No recurring planned expenses yet.</p> : null}

      {recurringExpenses.length > 0 ? (
        <>
          <ul className="mt-4 space-y-2 md:hidden">
            {recurringExpenses.map((item) => (
              <li className="rounded-xl border border-line p-3" key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-foreground/75">Category: {item.category || "Uncategorized"}</p>
                    <p className="text-xs text-foreground/75">Account: {item.paidFromAccount?.name || "Unassigned"}</p>
                    <p className="text-xs text-foreground/75">Cadence: {toCadenceLabel(item.cadence)}</p>
                    <p className="text-xs text-foreground/75">Auto Pay: {item.autoPay ? "Enabled" : "Disabled"}</p>
                    <p className="text-xs font-medium text-foreground/90">{formatIncomeCurrency(item.amountCents, currency)}</p>
                    {item.notes ? <p className="text-xs text-foreground/70">{item.notes}</p> : null}
                  </div>
                  <ActionMenu
                    items={
                      [
                        {
                          id: `edit-mobile-${item.id}`,
                          label: "Edit",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => setEditingRecurringExpenseId(item.id),
                        },
                        {
                          id: `delete-mobile-${item.id}`,
                          label: "Delete",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => setPendingDeleteExpense(item),
                          tone: "danger",
                        },
                      ] satisfies ActionMenuItem[]
                    }
                    menuAriaLabel={`Recurring expense actions for ${item.name}`}
                    triggerAriaLabel={`Open actions for recurring expense ${item.name}`}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-line/60 text-left text-xs uppercase tracking-[0.08em] text-foreground/70">
                  <th className="w-[24%] py-2 pr-2">Expense</th>
                  <th className="w-[14%] py-2 pr-2">Category</th>
                  <th className="w-[14%] py-2 pr-2">Account</th>
                  <th className="w-[12%] py-2 pr-2">Amount</th>
                  <th className="w-[12%] py-2 pr-2">Cadence</th>
                  <th className="w-[14%] py-2 pr-2">Auto Pay</th>
                  <th className="w-10 py-2 pr-0 text-right">
                    <span className="sr-only">Row actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recurringExpenses.map((item) => (
                  <tr className="align-top" key={item.id}>
                    <td className="py-2 pr-2">
                      <div className="break-words font-medium">{item.name}</div>
                      {item.notes ? <p className="mt-0.5 break-words text-xs text-foreground/70">{item.notes}</p> : null}
                    </td>
                    <td className="py-2 pr-2 text-foreground/85">{item.category || "Uncategorized"}</td>
                    <td className="py-2 pr-2 text-foreground/85">{item.paidFromAccount?.name || "Unassigned"}</td>
                    <td className="py-2 pr-2">{formatIncomeCurrency(item.amountCents, currency)}</td>
                    <td className="py-2 pr-2">{toCadenceLabel(item.cadence)}</td>
                    <td className="py-2 pr-2">
                      <span className="text-xs text-foreground/85">{item.autoPay ? "Enabled" : "Disabled"}</span>
                    </td>
                    <td className="w-10 py-2 pr-0">
                      <div className="flex justify-end">
                        <ActionMenu
                          items={
                            [
                              {
                                id: `edit-${item.id}`,
                                label: "Edit",
                                icon: <Pencil className="size-4" />,
                                onSelect: () => setEditingRecurringExpenseId(item.id),
                              },
                              {
                                id: `delete-${item.id}`,
                                label: "Delete",
                                icon: <Trash2 className="size-4" />,
                                onSelect: () => setPendingDeleteExpense(item),
                                tone: "danger",
                              },
                            ] satisfies ActionMenuItem[]
                          }
                          menuAriaLabel={`Recurring expense actions for ${item.name}`}
                          triggerAriaLabel={`Open actions for recurring expense ${item.name}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <Modal onClose={closeEditModal} open={Boolean(editingRecurringExpense)} title="Edit recurring expense">
        {editingRecurringExpense ? (
          <form
            action={updateRecurringExpenseAction.bind(null, editingRecurringExpense.id)}
            className="grid gap-3"
            key={`edit-${editingRecurringExpense.id}`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField defaultValue={editingRecurringExpense.name} label="Expense Name" name="name" required />
              <InputField
                defaultValue={toAmountInputValue(editingRecurringExpense.amountCents)}
                label="Amount"
                min="0.01"
                name="amount"
                required
                step="0.01"
                type="number"
              />
              <SelectField
                defaultValue={editingRecurringExpense.categoryId || resolvedCategoryOptions[0]?.value || ""}
                label="Expense Category"
                name="categoryId"
                options={resolvedCategoryOptions}
                required
              />
              <SelectField
                defaultValue={editingRecurringExpense.accountId || resolvedAccountOptions[0]?.value || ""}
                label="Paid From Account"
                name="accountId"
                options={resolvedAccountOptions}
                required
              />
              <SelectField
                defaultValue={editingRecurringExpense.cadence}
                label="Cadence"
                name="cadence"
                options={[...BUDGET_PERIOD_OPTIONS]}
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground/90">
              <input
                className="size-4 rounded border border-line bg-surface accent-accent"
                defaultChecked={editingRecurringExpense.autoPay}
                name="autoPay"
                type="checkbox"
              />
              <span>Auto Pay</span>
            </label>
            <TextareaField defaultValue={editingRecurringExpense.notes || ""} label="Notes" name="notes" rows={2} />
            {!canSubmitEdit ? (
              <p className="text-sm text-red-500">Add at least one account and expense category before saving changes.</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                ariaLabel="Save recurring expense changes"
                disabled={!canSubmitEdit}
                startIcon={<Save className="size-4" />}
                type="submit"
              >
                Save changes
              </Button>
              <Button
                ariaLabel="Cancel recurring expense edit"
                onClick={closeEditModal}
                startIcon={<X className="size-4" />}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <ConfirmationModal
        confirmFormAction={pendingDeleteExpense ? removeRecurringExpenseAction.bind(null, pendingDeleteExpense.id) : undefined}
        confirmIcon={<Trash2 className="size-4" />}
        confirmLabel="Delete recurring expense"
        description={
          pendingDeleteExpense
            ? `This permanently removes "${pendingDeleteExpense.name}" from this budget.`
            : "This permanently removes this recurring expense from this budget."
        }
        onClose={() => setPendingDeleteExpense(null)}
        open={Boolean(pendingDeleteExpense)}
        title="Delete recurring expense?"
      />
    </>
  );
}
