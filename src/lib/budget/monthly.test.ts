import { describe, expect, it } from "bun:test";
import { formatMonthLabel, getCurrentMonthKey, isMonthKey } from "@/lib/budget/monthly";

describe("budget monthly helpers", () => {
  it("builds the current month key from a provided date", () => {
    expect(getCurrentMonthKey(new Date("2026-03-05T12:00:00.000Z"))).toBe("2026-03");
  });

  it("validates YYYY-MM month keys", () => {
    expect(isMonthKey("2026-03")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isMonthKey("03-2026")).toBe(false);
  });

  it("formats a month key into a readable label", () => {
    expect(formatMonthLabel("2026-03")).toBe("March 2026");
  });
});
