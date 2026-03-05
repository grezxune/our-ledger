const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validates and normalizes a monthly key formatted as YYYY-MM.
 */
export function requireMonthKey(month: string): string {
  const normalized = month.trim();
  if (!MONTH_KEY_PATTERN.test(normalized)) {
    throw new Error("Month must use YYYY-MM format.");
  }
  return normalized;
}

/**
 * Returns inclusive month start and exclusive next-month boundary for date range queries.
 */
export function toMonthDateRange(month: string): { start: string; endExclusive: string } {
  const normalized = requireMonthKey(month);
  const [yearRaw, monthRaw] = normalized.split("-");
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;

  return {
    start: `${normalized}-01`,
    endExclusive: `${String(nextYear)}-${String(nextMonth).padStart(2, "0")}-01`,
  };
}

/**
 * Ensures a currency amount is finite before persistence.
 */
export function requireFiniteAmount(amountCents: number, fieldName: string) {
  if (!Number.isFinite(amountCents)) {
    throw new Error(`${fieldName} must be a valid amount.`);
  }
}
