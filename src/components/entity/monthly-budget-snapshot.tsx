"use client";

import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/field";
import { CreditCardReconciliationList } from "@/components/entity/credit-card-reconciliation-list";
import { MonthlyAccountBalances } from "@/components/entity/monthly-account-balances";
import { MonthlyOneOffExpenseEntries } from "@/components/entity/monthly-one-off-expense-entries";
import { MonthlyUnplannedIncomeSources } from "@/components/entity/monthly-unplanned-income-sources";
import { formatMonthLabel } from "@/lib/budget/monthly";
import type { BudgetMonthlySnapshot, EntityAccount } from "@/lib/domain/types";

interface MonthlyBudgetSnapshotProps {
  month: string;
  currency: string;
  accounts: EntityAccount[];
  snapshot: BudgetMonthlySnapshot | undefined;
  setSnapshotMonthAction: (month: string) => void;
  addUnplannedIncomeSourceAction: (formData: FormData) => Promise<void>;
  removeUnplannedIncomeSourceAction: (unplannedIncomeSourceId: string) => Promise<void>;
  addOneOffExpenseEntryAction: (formData: FormData) => Promise<void>;
  removeOneOffExpenseEntryAction: (oneOffExpenseEntryId: string) => Promise<void>;
  upsertMonthlyAccountBalanceAction: (formData: FormData) => Promise<void>;
  removeMonthlyAccountBalanceAction: (accountBalanceId: string) => Promise<void>;
  upsertCreditCardReconciliationAction: (formData: FormData) => Promise<void>;
  removeCreditCardReconciliationAction: (creditCardReconciliationId: string) => Promise<void>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Month-focused budget snapshot with plan-vs-actual totals and reconciliation tools.
 */
export function MonthlyBudgetSnapshot({
  month,
  currency,
  accounts,
  snapshot,
  setSnapshotMonthAction,
  addUnplannedIncomeSourceAction,
  removeUnplannedIncomeSourceAction,
  addOneOffExpenseEntryAction,
  removeOneOffExpenseEntryAction,
  upsertMonthlyAccountBalanceAction,
  removeMonthlyAccountBalanceAction,
  upsertCreditCardReconciliationAction,
  removeCreditCardReconciliationAction,
}: MonthlyBudgetSnapshotProps) {
  if (!snapshot) {
    return (
      <Card title="Monthly Budget Snapshot">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
          <p className="text-sm text-foreground/75">Loading month snapshot details...</p>
          <InputField
            label="Month"
            name="snapshotMonth"
            onChange={(event) => setSnapshotMonthAction(event.target.value)}
            type="month"
            value={month}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Monthly Budget Snapshot">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
        <div>
          <p className="text-sm text-foreground/75">
            {formatMonthLabel(month)} snapshot across expected budget totals and actual posted transactions.
          </p>
        </div>
        <InputField
          label="Month"
          name="snapshotMonth"
          onChange={(event) => setSnapshotMonthAction(event.target.value)}
          type="month"
          value={month}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Expected Income</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.expectedIncomeCents, currency)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Expected Expenses</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.expectedExpenseCents, currency)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Expected Remaining</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.expectedRemainingCents, currency)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Actual Income</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.actualIncomeCents, currency)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Actual Expenses</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.actualExpenseCents, currency)}</p>
          <p className="mt-1 text-xs text-foreground/70">
            Includes one-off expenses: {formatCurrency(snapshot.oneOffExpenseCents, currency)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs uppercase tracking-[0.08em] text-foreground/70">Actual Remaining</p>
          <p className="mt-1 text-base font-semibold">{formatCurrency(snapshot.actualRemainingCents, currency)}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-foreground/75 md:grid-cols-2">
        <p>Income variance: {formatCurrency(snapshot.incomeVarianceCents, currency)}</p>
        <p>Expense variance: {formatCurrency(snapshot.expenseVarianceCents, currency)}</p>
        <p>Remaining variance: {formatCurrency(snapshot.remainingVarianceCents, currency)}</p>
        <p>
          Total reconciliation gap: {formatCurrency(snapshot.totalReconciliationGapCents, currency)} ({snapshot.reconciledCardCount} account(s))
        </p>
        <p>Total account balance: {formatCurrency(snapshot.totalAccountBalanceCents, currency)}</p>
      </div>

      <div className="mt-4 grid gap-4">
        <MonthlyAccountBalances
          accountBalances={snapshot.accountBalances}
          accounts={accounts}
          currency={currency}
          month={month}
          removeMonthlyAccountBalanceAction={removeMonthlyAccountBalanceAction}
          upsertMonthlyAccountBalanceAction={upsertMonthlyAccountBalanceAction}
        />

        <MonthlyUnplannedIncomeSources
          accounts={accounts}
          addUnplannedIncomeSourceAction={addUnplannedIncomeSourceAction}
          currency={currency}
          incomeSources={snapshot.unplannedIncomeSources}
          month={month}
          removeUnplannedIncomeSourceAction={removeUnplannedIncomeSourceAction}
        />

        <MonthlyOneOffExpenseEntries
          accounts={accounts}
          addOneOffExpenseEntryAction={addOneOffExpenseEntryAction}
          currency={currency}
          expenseEntries={snapshot.oneOffExpenseEntries}
          month={month}
          removeOneOffExpenseEntryAction={removeOneOffExpenseEntryAction}
        />

        <CreditCardReconciliationList
          accounts={accounts}
          currency={currency}
          month={month}
          reconciliations={snapshot.creditCardReconciliations}
          removeCreditCardReconciliationAction={removeCreditCardReconciliationAction}
          upsertCreditCardReconciliationAction={upsertCreditCardReconciliationAction}
        />
      </div>
    </Card>
  );
}
