"use client";

import { useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InputField, SelectField } from "@/components/ui/field";
import type { BudgetCreditCardReconciliation, EntityAccount } from "@/lib/domain/types";

interface CreditCardReconciliationListProps {
  month: string;
  currency: string;
  accounts: EntityAccount[];
  reconciliations: BudgetCreditCardReconciliation[];
  upsertCreditCardReconciliationAction: (formData: FormData) => Promise<void>;
  removeCreditCardReconciliationAction: (creditCardReconciliationId: string) => Promise<void>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Monthly credit card reconciliation list with upsert and remove controls.
 */
export function CreditCardReconciliationList({
  month,
  currency,
  accounts,
  reconciliations,
  upsertCreditCardReconciliationAction,
  removeCreditCardReconciliationAction,
}: CreditCardReconciliationListProps) {
  const [pendingDeleteReconciliation, setPendingDeleteReconciliation] = useState<BudgetCreditCardReconciliation | null>(
    null,
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
          <h4 className="font-serif text-lg">Credit Card Reconciliation</h4>
          <p className="text-xs text-foreground/70">Save one reconciliation entry per account for {month}.</p>
        </div>
        <p className="text-xs text-foreground/70">Entries: {reconciliations.length}</p>
      </div>

      {reconciliations.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/70">No reconciliations saved for this month.</p>
      ) : null}

      {reconciliations.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {reconciliations.map((item) => (
            <li className="rounded-xl border border-line/70 p-3" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.accountName}</p>
                  <p className="text-xs text-foreground/75">
                    Statement {formatCurrency(item.statementBalanceCents, currency)} / Ledger{" "}
                    {formatCurrency(item.ledgerBalanceCents, currency)}
                  </p>
                  <p
                    className={`text-xs ${item.reconciliationGapCents === 0 ? "text-foreground/75" : item.reconciliationGapCents > 0 ? "text-amber-600 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}
                  >
                    Gap (statement - ledger): {formatCurrency(item.reconciliationGapCents, currency)}
                  </p>
                  {item.notes ? <p className="mt-1 text-xs text-foreground/70">{item.notes}</p> : null}
                </div>
                <ActionMenu
                  items={
                    [
                      {
                        id: `delete-reconciliation-${item.id}`,
                        label: "Delete",
                        icon: <Trash2 className="size-4" />,
                        onSelect: () => setPendingDeleteReconciliation(item),
                        tone: "danger",
                      },
                    ] satisfies ActionMenuItem[]
                  }
                  menuAriaLabel={`Reconciliation actions for ${item.accountName}`}
                  triggerAriaLabel={`Open actions for reconciliation ${item.accountName}`}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        action={upsertCreditCardReconciliationAction}
        className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_minmax(0,1fr)_auto]"
      >
        <input name="month" type="hidden" value={month} />
        <SelectField label="Account" name="accountId" options={accountOptions} required />
        <InputField
          label="Statement balance"
          min="0"
          name="statementBalance"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <InputField
          label="Ledger balance"
          min="0"
          name="ledgerBalance"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <InputField autoComplete="off" label="Notes" name="notes" placeholder="Optional" />
        <div className="flex items-end lg:justify-end">
          <Button
            ariaLabel="Save credit card reconciliation"
            disabled={accountOptions.length === 0}
            startIcon={<Save className="size-4" />}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>

      {accountOptions.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/70">Create an account before saving reconciliation entries.</p>
      ) : null}

      <ConfirmationModal
        confirmFormAction={
          pendingDeleteReconciliation
            ? removeCreditCardReconciliationAction.bind(null, pendingDeleteReconciliation.id)
            : undefined
        }
        confirmIcon={<Trash2 className="size-4" />}
        confirmLabel="Delete reconciliation"
        description={
          pendingDeleteReconciliation
            ? `This removes ${pendingDeleteReconciliation.accountName} for ${month}.`
            : "This removes this reconciliation entry."
        }
        onClose={() => setPendingDeleteReconciliation(null)}
        open={Boolean(pendingDeleteReconciliation)}
        title="Delete reconciliation?"
      />
    </section>
  );
}
