import { describe, expect, it } from "vitest";
import { cycleWeekForDate, dayIdForDate, todayPlan, weekDates } from "./calendar";

const CYCLE_START = "2026-07-06"; // Monday

describe("dayIdForDate", () => {
  it("maps local weekdays Monday-first", () => {
    expect(dayIdForDate(new Date(2026, 8, 2))).toBe("wednesday"); // Sept 2 2026
    expect(dayIdForDate(new Date(2026, 7, 24))).toBe("monday"); // Aug 24 2026
    expect(dayIdForDate(new Date(2026, 7, 30))).toBe("sunday"); // Aug 30 2026
    expect(dayIdForDate(new Date(2026, 8, 27))).toBe("sunday"); // Sept 27 2026
  });
});

describe("cycleWeekForDate", () => {
  it("resolves 2026-09-02 to week 9", () => {
    expect(cycleWeekForDate(new Date(2026, 8, 2), CYCLE_START)).toBe(9);
  });

  it("resolves 2026-08-24 (week 8 Monday) to week 8", () => {
    expect(cycleWeekForDate(new Date(2026, 7, 24), CYCLE_START)).toBe(8);
  });

  it("resolves 2026-08-30 (week 8 Sunday) to week 8", () => {
    expect(cycleWeekForDate(new Date(2026, 7, 30), CYCLE_START)).toBe(8);
  });

  it("resolves 2026-09-27 (week 12 Sunday) to week 12", () => {
    expect(cycleWeekForDate(new Date(2026, 8, 27), CYCLE_START)).toBe(12);
  });

  it("returns null the day after week 12 ends", () => {
    expect(cycleWeekForDate(new Date(2026, 8, 28), CYCLE_START)).toBeNull();
  });

  it("returns null before the cycle starts", () => {
    expect(cycleWeekForDate(new Date(2026, 6, 5), CYCLE_START)).toBeNull();
  });

  it("is stable across a DST boundary (spring forward, US Eastern-style)", () => {
    // 2026-03-08 is the US DST spring-forward date; use a cycle that spans it.
    const start = "2026-02-02"; // Monday
    // Week 6 runs 2026-03-09 to 2026-03-15, straddling the transition.
    expect(cycleWeekForDate(new Date(2026, 2, 9), start)).toBe(6);
    expect(cycleWeekForDate(new Date(2026, 2, 15), start)).toBe(6);
    expect(cycleWeekForDate(new Date(2026, 2, 16), start)).toBe(7);
  });
});

describe("weekDates", () => {
  it("returns the Monday-Sunday ISO span for a week", () => {
    expect(weekDates(1, CYCLE_START)).toEqual({ start: "2026-07-06", end: "2026-07-12" });
    expect(weekDates(8, CYCLE_START)).toEqual({ start: "2026-08-24", end: "2026-08-30" });
    expect(weekDates(9, CYCLE_START)).toEqual({ start: "2026-08-31", end: "2026-09-06" });
    expect(weekDates(12, CYCLE_START)).toEqual({ start: "2026-09-21", end: "2026-09-27" });
  });
});

describe("todayPlan", () => {
  it("bundles week, dayId, day, and weekMeta for an in-cycle date", () => {
    const result = todayPlan(new Date(2026, 8, 2), CYCLE_START);
    expect(result.week).toBe(9);
    expect(result.dayId).toBe("wednesday");
    expect(result.day.id).toBe("wednesday");
    expect(result.weekMeta?.week).toBe(9);
    expect(result.weekMeta?.purpose).toBe("Intensify");
  });

  it("returns a null week and weekMeta outside the cycle, but still resolves the day", () => {
    const result = todayPlan(new Date(2026, 8, 28), CYCLE_START); // Monday, one day past week 12
    expect(result.week).toBeNull();
    expect(result.weekMeta).toBeNull();
    expect(result.dayId).toBe("monday");
    expect(result.day.id).toBe("monday");
  });
});
