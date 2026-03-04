import { describe, expect, it } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RecurringExpensePlanner } from "@/components/entity/recurring-expense-planner";

describe("recurring expense planner", () => {
  it("renders inline add row with add-account CTA option when no accounts exist", () => {
    const html = renderToStaticMarkup(
      <RecurringExpensePlanner
        accounts={[]}
        addRecurringExpenseAction={async () => {}}
        createAccountAction={async () => ({ id: "acct_1", name: "Checking", source: "manual" })}
        createExpenseCategoryAction={async () => ({ id: "cat_1", name: "Housing" })}
        createInstitutionAction={async () => ({ id: "inst_1", name: "Bank" })}
        expenseCategories={[]}
        entityCurrency="USD"
        institutions={[]}
      />,
    );

    expect(html).toContain("Add account to continue");
    expect(html).toContain("Add category to continue");
    expect(html).toContain("Expense category");
    expect(html).toContain("Paid from account");
    expect(html).toContain("Auto Pay");
    expect(html).toContain("Notes (optional)");
    expect(html).not.toContain('aria-label="Add category"');
    expect(html).not.toContain('aria-label="Add account"');
  });

  it("keeps add-category and add-account select options available with existing entries", () => {
    const html = renderToStaticMarkup(
      <RecurringExpensePlanner
        accounts={[
          {
            id: "acct_1",
            entityId: "entity_1",
            name: "Checking",
            currency: "USD",
            source: "manual",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ]}
        addRecurringExpenseAction={async () => {}}
        createAccountAction={async () => ({ id: "acct_2", name: "Savings", source: "manual" })}
        createExpenseCategoryAction={async () => ({ id: "cat_2", name: "Utilities" })}
        createInstitutionAction={async () => ({ id: "inst_2", name: "Credit Union" })}
        expenseCategories={[{ id: "cat_1", name: "Housing" }]}
        entityCurrency="USD"
        institutions={[{ id: "inst_1", name: "Bank" }]}
      />,
    );

    expect(html).toContain("Add Category");
    expect(html).toContain("Add Account");
  });
});
