"use client";

import { useMemo, useState } from "react";
import { CirclePlus, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InputField, SelectField } from "@/components/ui/field";
import type { BudgetOneOffExpenseEntry, EntityAccount } from "@/lib/domain/types";

interface MonthlyOneOffExpenseEntriesProps {
  month: string;
  currency: string;
  accounts: EntityAccount[];
  expenseEntries: BudgetOneOffExpenseEntry[];
  addOneOffExpenseEntryAction: (formData: FormData) => Promise<void>;
  removeOneOffExpenseEntryAction: (oneOffExpenseEntryId: string) => Promise<void>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Month-scoped one-off expense entries with account attribution.
 */
export function MonthlyOneOffExpenseEntries({
  month,
  currency,
  accounts,
  expenseEntries,
  addOneOffExpenseEntryAction,
  removeOneOffExpenseEntryAction,
}: MonthlyOneOffExpenseEntriesProps) {
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState<BudgetOneOffExpenseEntry | null>(null);
  const totalOneOffExpenseCents = useMemo(
    () => expenseEntries.reduce((sum, item) => sum + item.amountCents, 0),
    [expenseEntries],
  );
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: `${account.name} (${account.source === "plaid" ? "Plaid" : "Manual"})`,
        value: account.id,
      })),
    [accounts],
  );

  return (
    <section className="rounded-xl border border-line bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-lg">One-Off Expenses by Account</h4>
          <p className="text-xs text-foreground/70">{expenseEntries.length} entry(s) applied to {month}</p>
        </div>
        <p className="text-sm font-medium">{formatCurrency(totalOneOffExpenseCents, currency)}</p>
      </div>

      {expenseEntries.length === 0 ? <p className="mt-3 text-sm text-foreground/70">No one-off expenses yet.</p> : null}

      {expenseEntries.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {expenseEntries.map((item) => (
            <li className="rounded-xl border border-line/70 p-3" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-foreground/75">{item.accountName}</p>
                  <p className="text-xs text-foreground/75">{formatCurrency(item.amountCents, currency)}</p>
                  {item.notes ? <p className="mt-1 text-xs text-foreground/70">{item.notes}</p> : null}
                </div>
                <ActionMenu
                  items={
                    [
                      {
                        id: `delete-oneoff-${item.id}`,
                        label: "Delete",
                        icon: <Trash2 className="size-4" />,
                        onSelect: () => setPendingDeleteEntry(item),
                        tone: "danger",
                      },
                    ] satisfies ActionMenuItem[]
                  }
                  menuAriaLabel={`One-off expense actions for ${item.name}`}
                  triggerAriaLabel={`Open actions for one-off expense ${item.name}`}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form action={addOneOffExpenseEntryAction} className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem_minmax(0,1fr)_auto]">
        <input name="month" type="hidden" value={month} />
        <SelectField label="Account" name="accountId" options={accountOptions} required />
        <InputField autoComplete="off" label="Expense" name="name" placeholder="Unexpected repair" required />
        <InputField label="Amount" min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" />
        <InputField autoComplete="off" label="Notes" name="notes" placeholder="Optional" />
        <div className="flex items-end lg:justify-end">
          <Button
            ariaLabel="Add one-off expense"
            disabled={accountOptions.length === 0}
            startIcon={<CirclePlus className="size-4" />}
            type="submit"
          >
            Add expense
          </Button>
        </div>
      </form>

      {accountOptions.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/70">Create an account before adding one-off expense entries.</p>
      ) : null}

      <ConfirmationModal
        confirmFormAction={pendingDeleteEntry ? removeOneOffExpenseEntryAction.bind(null, pendingDeleteEntry.id) : undefined}
        confirmIcon={<Trash2 className="size-4" />}
        confirmLabel="Delete one-off expense"
        description={
          pendingDeleteEntry
            ? `This removes "${pendingDeleteEntry.name}" from this month.`
            : "This removes this one-off expense entry from this month."
        }
        onClose={() => setPendingDeleteEntry(null)}
        open={Boolean(pendingDeleteEntry)}
        title="Delete one-off expense?"
      />
    </section>
  );
}
