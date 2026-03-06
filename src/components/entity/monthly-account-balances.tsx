"use client";

import { useMemo, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { InputField, SelectField } from "@/components/ui/field";
import type { BudgetMonthlyAccountBalance, EntityAccount } from "@/lib/domain/types";

interface MonthlyAccountBalancesProps {
  month: string;
  currency: string;
  accounts: EntityAccount[];
  accountBalances: BudgetMonthlyAccountBalance[];
  upsertMonthlyAccountBalanceAction: (formData: FormData) => Promise<void>;
  removeMonthlyAccountBalanceAction: (accountBalanceId: string) => Promise<void>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Monthly account balance capture for finance meeting snapshots.
 */
export function MonthlyAccountBalances({
  month,
  currency,
  accounts,
  accountBalances,
  upsertMonthlyAccountBalanceAction,
  removeMonthlyAccountBalanceAction,
}: MonthlyAccountBalancesProps) {
  const [pendingDeleteBalance, setPendingDeleteBalance] = useState<BudgetMonthlyAccountBalance | null>(null);
  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: `${account.name} (${account.source === "plaid" ? "Plaid" : "Manual"})`,
        value: account.id,
      })),
    [accounts],
  );
  const totalBalanceCents = useMemo(
    () => accountBalances.reduce((sum, item) => sum + item.balanceCents, 0),
    [accountBalances],
  );

  return (
    <section className="rounded-xl border border-line bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-serif text-lg">Account Balances</h4>
          <p className="text-xs text-foreground/70">Capture how much is in each account for {month}.</p>
        </div>
        <p className="text-sm font-medium">{formatCurrency(totalBalanceCents, currency)}</p>
      </div>

      {accountBalances.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/70">No account balances recorded for this month.</p>
      ) : null}

      {accountBalances.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {accountBalances.map((item) => (
            <li className="rounded-xl border border-line/70 p-3" key={item.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.accountName}</p>
                  <p className="text-xs text-foreground/75">{formatCurrency(item.balanceCents, currency)}</p>
                  {item.notes ? <p className="mt-1 text-xs text-foreground/70">{item.notes}</p> : null}
                </div>
                <ActionMenu
                  items={
                    [
                      {
                        id: `delete-balance-${item.id}`,
                        label: "Delete",
                        icon: <Trash2 className="size-4" />,
                        onSelect: () => setPendingDeleteBalance(item),
                        tone: "danger",
                      },
                    ] satisfies ActionMenuItem[]
                  }
                  menuAriaLabel={`Account balance actions for ${item.accountName}`}
                  triggerAriaLabel={`Open actions for account balance ${item.accountName}`}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        action={upsertMonthlyAccountBalanceAction}
        className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_12rem_minmax(0,1fr)_auto]"
      >
        <input name="month" type="hidden" value={month} />
        <SelectField label="Account" name="accountId" options={accountOptions} required />
        <InputField
          label="Balance"
          name="balance"
          placeholder="0.00"
          required
          step="0.01"
          type="number"
        />
        <InputField autoComplete="off" label="Notes" name="notes" placeholder="Optional" />
        <div className="flex items-end lg:justify-end">
          <Button
            ariaLabel="Save monthly account balance"
            disabled={accountOptions.length === 0}
            startIcon={<Save className="size-4" />}
            type="submit"
          >
            Save balance
          </Button>
        </div>
      </form>

      {accountOptions.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/70">Create an account before capturing balances.</p>
      ) : null}

      <ConfirmationModal
        confirmFormAction={pendingDeleteBalance ? removeMonthlyAccountBalanceAction.bind(null, pendingDeleteBalance.id) : undefined}
        confirmIcon={<Trash2 className="size-4" />}
        confirmLabel="Delete account balance"
        description={
          pendingDeleteBalance
            ? `This removes ${pendingDeleteBalance.accountName} from this month.`
            : "This removes this account balance entry."
        }
        onClose={() => setPendingDeleteBalance(null)}
        open={Boolean(pendingDeleteBalance)}
        title="Delete account balance?"
      />
    </section>
  );
}
