import { describe, expect, it } from "bun:test";
import { getToastMessage, withToast } from "@/lib/navigation/toast";

describe("navigation toast helpers", () => {
  it("maps known toast keys to user-facing copy", () => {
    expect(getToastMessage("entity-created")).toBe("Entity created.");
    expect(getToastMessage("transaction-created")).toBe("Transaction saved.");
    expect(getToastMessage("unplanned-income-added")).toBe("Unplanned income source added.");
    expect(getToastMessage("one-off-expense-added")).toBe("One-off expense entry added.");
    expect(getToastMessage("account-balance-saved")).toBe("Account balance saved.");
    expect(getToastMessage("credit-reconciliation-saved")).toBe("Credit card reconciliation saved.");
    expect(getToastMessage("storage-configured")).toBe("Storage configuration validated.");
  });

  it("returns null for unknown toast keys", () => {
    expect(getToastMessage("unknown-event")).toBeNull();
    expect(getToastMessage(null)).toBeNull();
  });

  it("appends toast query params while preserving existing URL parts", () => {
    expect(withToast("/entity/abc", "entity-created")).toBe("/entity/abc?toast=entity-created");
    expect(withToast("/entity/abc/budget?period=monthly", "budget-created")).toBe(
      "/entity/abc/budget?period=monthly&toast=budget-created",
    );
    expect(withToast("/entity/abc#details", "entity-updated")).toBe("/entity/abc?toast=entity-updated#details");
  });
});
