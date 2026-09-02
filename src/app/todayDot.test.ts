import { describe, expect, it } from "vitest";
import { todayNeedsDot } from "./todayDot";

describe("todayNeedsDot", () => {
  it("is true on a lifting day inside the cycle with no complete workout yet", () => {
    expect(todayNeedsDot({ isLiftingDay: true, hasCompleteWorkoutToday: false, week: 9 })).toBe(true);
  });

  it("is false once today's workout is complete", () => {
    expect(todayNeedsDot({ isLiftingDay: true, hasCompleteWorkoutToday: true, week: 9 })).toBe(false);
  });

  it("is false on a conditioning or recovery day", () => {
    expect(todayNeedsDot({ isLiftingDay: false, hasCompleteWorkoutToday: false, week: 9 })).toBe(false);
  });

  it("is false outside the 12-week cycle, even on what would be a lifting weekday", () => {
    expect(todayNeedsDot({ isLiftingDay: true, hasCompleteWorkoutToday: false, week: null })).toBe(false);
  });

  it("is false when both no-dot conditions hold at once", () => {
    expect(todayNeedsDot({ isLiftingDay: false, hasCompleteWorkoutToday: true, week: null })).toBe(false);
  });
});
