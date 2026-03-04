import { describe, expect, it } from "bun:test";
import { buildNamedEntityOptions, hasRealSelection, parseCheckboxValue } from "@/lib/domain/expense-form";

describe("expense form helpers", () => {
  it("builds fallback option when collection is empty", () => {
    expect(buildNamedEntityOptions([], "Add category to continue", "__add__")).toEqual([
      { label: "Add category to continue", value: "__add__" },
    ]);
  });

  it("maps collection options by name/id and keeps add option available", () => {
    expect(
      buildNamedEntityOptions(
        [
          { id: "cat_1", name: "Housing" },
          { id: "cat_2", name: "Utilities" },
        ],
        "Add category to continue",
        "__add__",
        "Add Category",
      ),
    ).toEqual([
      { label: "Housing", value: "cat_1" },
      { label: "Utilities", value: "cat_2" },
      { label: "Add Category", value: "__add__" },
    ]);
  });

  it("reports real selection only for non-sentinel values with available options", () => {
    expect(hasRealSelection(0, "__add__", "__add__")).toBe(false);
    expect(hasRealSelection(2, "__add__", "__add__")).toBe(false);
    expect(hasRealSelection(2, "cat_1", "__add__")).toBe(true);
  });

  it("parses checkbox values to booleans", () => {
    const formData = new FormData();
    expect(parseCheckboxValue(formData, "autoPay")).toBe(false);

    formData.set("autoPay", "on");
    expect(parseCheckboxValue(formData, "autoPay")).toBe(true);

    formData.set("autoPay", "false");
    expect(parseCheckboxValue(formData, "autoPay")).toBe(false);

    formData.set("autoPay", "1");
    expect(parseCheckboxValue(formData, "autoPay")).toBe(true);
  });
});
