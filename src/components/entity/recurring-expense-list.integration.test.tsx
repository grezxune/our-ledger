import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RecurringExpenseList } from "@/components/entity/recurring-expense-list";

describe("recurring expense list", () => {
  it("renders recurring rows with edit and delete action triggers", () => {
    const html = renderToStaticMarkup(
      <RecurringExpenseList
        accounts={[
          {
            id: "account_1",
            entityId: "entity_1",
            name: "Main Checking",
            currency: "USD",
            source: "manual",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        currency="USD"
        expenseCategories={[{ id: "category_1", name: "Housing" }]}
        recurringExpenses={[
          {
            id: "expense_1",
            budgetId: "budget_1",
            entityId: "entity_1",
            name: "Rent",
            accountId: "account_1",
            categoryId: "category_1",
            amountCents: 240000,
            cadence: "monthly",
            autoPay: true,
            category: "Housing",
            paidFromAccount: {
              id: "account_1",
              name: "Main Checking",
              source: "manual",
            },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        updateRecurringExpenseAction={async () => {}}
        removeRecurringExpenseAction={async () => {}}
      />,
    );

    expect(html).toContain("Rent");
    expect(html).toContain("Housing");
    expect(html).toContain("Main Checking");
    expect(html).toContain("Auto Pay: Enabled");
    expect(html).toContain("Open actions for recurring expense Rent");
    expect(html).toContain("$2,400.00");
  });
});
