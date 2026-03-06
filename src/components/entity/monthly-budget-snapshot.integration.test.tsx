import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MonthlyBudgetSnapshot } from "@/components/entity/monthly-budget-snapshot";

describe("monthly budget snapshot", () => {
  it("renders monthly expected-vs-actual totals and reconciliation details", () => {
    const html = renderToStaticMarkup(
      <MonthlyBudgetSnapshot
        accounts={[
          {
            id: "account_1",
            entityId: "entity_1",
            name: "Visa",
            currency: "USD",
            source: "manual",
            createdAt: "2026-03-01T00:00:00.000Z",
            updatedAt: "2026-03-01T00:00:00.000Z",
          },
        ]}
        addOneOffExpenseEntryAction={async () => {}}
        addUnplannedIncomeSourceAction={async () => {}}
        currency="USD"
        month="2026-03"
        removeCreditCardReconciliationAction={async () => {}}
        removeMonthlyAccountBalanceAction={async () => {}}
        removeOneOffExpenseEntryAction={async () => {}}
        removeUnplannedIncomeSourceAction={async () => {}}
        setSnapshotMonthAction={() => {}}
        snapshot={{
          month: "2026-03",
          expectedIncomeCents: 500000,
          expectedExpenseCents: 300000,
          expectedRemainingCents: 200000,
          actualIncomeCents: 540000,
          actualExpenseCents: 320000,
          actualRemainingCents: 220000,
          incomeVarianceCents: 40000,
          expenseVarianceCents: 20000,
          remainingVarianceCents: 20000,
          unplannedIncomeCents: 50000,
          oneOffExpenseCents: 15000,
          unplannedIncomeSources: [
            {
              id: "unplanned_1",
              budgetId: "budget_1",
              entityId: "entity_1",
              month: "2026-03",
              accountId: "account_1",
              accountName: "Visa",
              name: "Tax refund",
              amountCents: 50000,
              createdAt: "2026-03-01T00:00:00.000Z",
              updatedAt: "2026-03-01T00:00:00.000Z",
            },
          ],
          oneOffExpenseEntries: [
            {
              id: "oneoff_1",
              budgetId: "budget_1",
              entityId: "entity_1",
              month: "2026-03",
              accountId: "account_1",
              accountName: "Visa",
              name: "Car repair",
              amountCents: 15000,
              createdAt: "2026-03-01T00:00:00.000Z",
              updatedAt: "2026-03-01T00:00:00.000Z",
            },
          ],
          accountBalances: [
            {
              id: "balance_1",
              budgetId: "budget_1",
              entityId: "entity_1",
              month: "2026-03",
              accountId: "account_1",
              accountName: "Visa",
              balanceCents: 120000,
              createdAt: "2026-03-01T00:00:00.000Z",
              updatedAt: "2026-03-01T00:00:00.000Z",
            },
          ],
          creditCardReconciliations: [
            {
              id: "recon_1",
              budgetId: "budget_1",
              entityId: "entity_1",
              month: "2026-03",
              accountId: "account_1",
              accountName: "Visa",
              statementBalanceCents: 120000,
              ledgerBalanceCents: 110000,
              reconciliationGapCents: 10000,
              createdAt: "2026-03-01T00:00:00.000Z",
              updatedAt: "2026-03-01T00:00:00.000Z",
            },
          ],
          reconciledCardCount: 1,
          totalReconciliationGapCents: 10000,
          totalAccountBalanceCents: 120000,
        }}
        upsertCreditCardReconciliationAction={async () => {}}
        upsertMonthlyAccountBalanceAction={async () => {}}
      />,
    );

    expect(html).toContain("Monthly Budget Snapshot");
    expect(html).toContain("Expected Income");
    expect(html).toContain("Actual Expenses");
    expect(html).toContain("Account Balances");
    expect(html).toContain("Unplanned One-Off Income");
    expect(html).toContain("One-Off Expenses by Account");
    expect(html).toContain("Tax refund");
    expect(html).toContain("Car repair");
    expect(html).toContain("Credit Card Reconciliation");
    expect(html).toContain("Gap (statement - ledger)");
  });
});
