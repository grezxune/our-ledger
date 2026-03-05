"use client";

import { CirclePlus, Wallet } from "lucide-react";
import { MonthlyBudgetSnapshot } from "@/components/entity/monthly-budget-snapshot";
import { PlannedIncomeSources } from "@/components/entity/planned-income-sources";
import { RecurringExpenseList } from "@/components/entity/recurring-expense-list";
import { RecurringExpensePlanner } from "@/components/entity/recurring-expense-planner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField, SelectField } from "@/components/ui/field";
import { BUDGET_PERIOD_OPTIONS } from "@/lib/domain/options";
import type { BudgetMonthlySnapshot, EntityAccount, EntityBudget } from "@/lib/domain/types";

interface NamedEntityOption {
  id: string;
  name: string;
}

interface AccountOption {
  id: string;
  name: string;
  source: "manual" | "plaid";
}

interface EntityBudgetLiveViewProps {
  currency: string;
  snapshotMonth: string;
  budgets: EntityBudget[];
  accounts: EntityAccount[];
  monthlySnapshot: BudgetMonthlySnapshot | undefined;
  institutions: NamedEntityOption[];
  expenseCategories: NamedEntityOption[];
  setSnapshotMonthAction: (month: string) => void;
  createBudgetAction: (formData: FormData) => Promise<void>;
  addIncomeSourceAction: (formData: FormData) => Promise<void>;
  updateIncomeSourceAction: (incomeSourceId: string, formData: FormData) => Promise<void>;
  removeIncomeSourceAction: (incomeSourceId: string) => Promise<void>;
  addRecurringExpenseAction: (formData: FormData) => Promise<void>;
  updateRecurringExpenseAction: (recurringExpenseId: string, formData: FormData) => Promise<void>;
  removeRecurringExpenseAction: (recurringExpenseId: string) => Promise<void>;
  addUnplannedIncomeSourceAction: (formData: FormData) => Promise<void>;
  removeUnplannedIncomeSourceAction: (unplannedIncomeSourceId: string) => Promise<void>;
  upsertCreditCardReconciliationAction: (formData: FormData) => Promise<void>;
  removeCreditCardReconciliationAction: (creditCardReconciliationId: string) => Promise<void>;
  createAccountAction: (formData: FormData) => Promise<AccountOption>;
  createInstitutionAction: (formData: FormData) => Promise<NamedEntityOption>;
  createExpenseCategoryAction: (formData: FormData) => Promise<NamedEntityOption>;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 100);
}

/**
 * Presentation layer for budget planning backed by live reactive data.
 */
export function EntityBudgetLiveView({
  currency,
  snapshotMonth,
  budgets,
  accounts,
  monthlySnapshot,
  institutions,
  expenseCategories,
  setSnapshotMonthAction,
  createBudgetAction,
  addIncomeSourceAction,
  updateIncomeSourceAction,
  removeIncomeSourceAction,
  addRecurringExpenseAction,
  updateRecurringExpenseAction,
  removeRecurringExpenseAction,
  addUnplannedIncomeSourceAction,
  removeUnplannedIncomeSourceAction,
  upsertCreditCardReconciliationAction,
  removeCreditCardReconciliationAction,
  createAccountAction,
  createInstitutionAction,
  createExpenseCategoryAction,
}: EntityBudgetLiveViewProps) {
  const activeBudget = budgets.find((budget) => budget.status === "active") || budgets[0] || null;

  if (!activeBudget) {
    return (
      <Card title="Create Budget">
        <form action={createBudgetAction} className="grid gap-3 sm:grid-cols-3">
          <InputField defaultValue="Primary Budget" label="Budget Name" name="name" required />
          <SelectField defaultValue="monthly" label="Budget Period" name="period" options={[...BUDGET_PERIOD_OPTIONS]} />
          <InputField label="Effective Date" name="effectiveDate" required type="date" />
          <div className="sm:col-span-3">
            <Button ariaLabel="Create budget" startIcon={<Wallet className="size-4" />} type="submit">
              Create Budget
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <>
      <Card title={`${activeBudget.name} (${activeBudget.period})`}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-foreground/70">Projected Income</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(activeBudget.summary.projectedIncomeCents, currency)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-foreground/70">Projected Expenses</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(activeBudget.summary.projectedExpenseCents, currency)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-foreground/70">Expected Remaining</p>
            <p className="mt-2 text-lg font-semibold">{formatCurrency(activeBudget.summary.expectedRemainingCents, currency)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-foreground/75">
          Expected remaining money reflects all planned income and recurring expenses for the selected {activeBudget.period} budget period.
        </p>
        <PlannedIncomeSources
          addIncomeSourceAction={addIncomeSourceAction}
          currency={currency}
          incomeSources={activeBudget.incomeSources}
          removeIncomeSourceAction={removeIncomeSourceAction}
          updateIncomeSourceAction={updateIncomeSourceAction}
        />
      </Card>

      <MonthlyBudgetSnapshot
        accounts={accounts}
        addUnplannedIncomeSourceAction={addUnplannedIncomeSourceAction}
        currency={currency}
        month={snapshotMonth}
        snapshot={monthlySnapshot}
        removeCreditCardReconciliationAction={removeCreditCardReconciliationAction}
        removeUnplannedIncomeSourceAction={removeUnplannedIncomeSourceAction}
        setSnapshotMonthAction={setSnapshotMonthAction}
        upsertCreditCardReconciliationAction={upsertCreditCardReconciliationAction}
      />

      <div className="grid gap-5">
        <Card title="Recurring Planned Expenses">
          <RecurringExpenseList
            accounts={accounts}
            currency={currency}
            expenseCategories={expenseCategories}
            recurringExpenses={activeBudget.recurringExpenses}
            removeRecurringExpenseAction={removeRecurringExpenseAction}
            updateRecurringExpenseAction={updateRecurringExpenseAction}
          />
          <RecurringExpensePlanner
            accounts={accounts}
            addRecurringExpenseAction={addRecurringExpenseAction}
            createAccountAction={createAccountAction}
            createExpenseCategoryAction={createExpenseCategoryAction}
            createInstitutionAction={createInstitutionAction}
            entityCurrency={currency}
            expenseCategories={expenseCategories}
            institutions={institutions}
          />
        </Card>
      </div>

      <Card title="Create Another Budget">
        <form action={createBudgetAction} className="grid gap-3 sm:grid-cols-3">
          <InputField defaultValue="Scenario Budget" label="Budget Name" name="name" required />
          <SelectField defaultValue="monthly" label="Budget Period" name="period" options={[...BUDGET_PERIOD_OPTIONS]} />
          <InputField label="Effective Date" name="effectiveDate" required type="date" />
          <div className="sm:col-span-3">
            <Button ariaLabel="Create additional budget" startIcon={<CirclePlus className="size-4" />} type="submit" variant="secondary">
              Create Additional Budget
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
