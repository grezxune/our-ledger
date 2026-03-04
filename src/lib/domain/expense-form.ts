export const ADD_ACCOUNT_OPTION = "__add_account__";
export const ADD_INSTITUTION_OPTION = "__add_institution__";
export const ADD_EXPENSE_CATEGORY_OPTION = "__add_expense_category__";

export interface NamedEntityOptionInput {
  id: string;
  name: string;
}

/**
 * Builds select options with an empty-state fallback and optional add-new sentinel.
 */
export function buildNamedEntityOptions(
  items: NamedEntityOptionInput[],
  emptyLabel: string,
  emptyValue: string,
  addLabel: string = emptyLabel,
): Array<{ label: string; value: string }> {
  if (items.length === 0) {
    return [{ label: emptyLabel, value: emptyValue }];
  }

  return [
    ...items.map((item) => ({ label: item.name, value: item.id })),
    { label: addLabel, value: emptyValue },
  ];
}

/**
 * Returns true when a non-sentinel value has been selected.
 */
export function hasRealSelection(total: number, selectedValue: string, sentinelValue: string): boolean {
  return total > 0 && selectedValue !== sentinelValue;
}

/**
 * Parses a checkbox form field into a boolean value.
 */
export function parseCheckboxValue(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}
