import { describe, expect, it } from "vitest";
import { formatMonthDay, isMonday, localIsoDate } from "./dates";

describe("localIsoDate", () => {
  it("pads month and day and does not shift the local calendar date", () => {
    expect(localIsoDate(new Date(2026, 8, 2))).toBe("2026-09-02"); // Sept 2, month index 8
    expect(localIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(localIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("isMonday", () => {
  it("accepts the program's default cycle start, a Monday", () => {
    expect(isMonday("2026-07-06")).toBe(true);
  });

  it("rejects the days on either side", () => {
    expect(isMonday("2026-07-05")).toBe(false); // Sunday
    expect(isMonday("2026-07-07")).toBe(false); // Tuesday
  });

  it("accepts every known program week's Monday", () => {
    expect(isMonday("2026-08-24")).toBe(true); // Week 8 start
    expect(isMonday("2026-09-21")).toBe(true); // Week 12 start
  });
});

describe("formatMonthDay", () => {
  it("renders a readable month and day with no leading zero", () => {
    expect(formatMonthDay("2026-07-06")).toBe("July 6");
    expect(formatMonthDay("2026-01-05")).toBe("January 5");
    expect(formatMonthDay("2026-12-31")).toBe("December 31");
  });
});
