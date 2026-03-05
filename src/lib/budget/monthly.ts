const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Returns the current month key in YYYY-MM format.
 */
export function getCurrentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Validates a month key formatted as YYYY-MM.
 */
export function isMonthKey(value: string): boolean {
  return MONTH_KEY_PATTERN.test(value.trim());
}

/**
 * Formats YYYY-MM into a readable month label.
 */
export function formatMonthLabel(monthKey: string): string {
  if (!isMonthKey(monthKey)) {
    return monthKey;
  }

  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}
