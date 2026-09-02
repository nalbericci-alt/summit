import { describe, expect, it } from "vitest";
import { formatRemaining, restDurationFor } from "./restTimer";

const restDefaults = { mainLift: 180, accessory: 90 };

describe("restDurationFor", () => {
  it("uses the plan's rest range floor when the plan has one, even for a main lift", () => {
    expect(restDurationFor("back_squat", [180, 300], restDefaults)).toBe(180);
  });

  it("falls back to the main-lift default when the plan lacks a rest range and the exercise is a main lift", () => {
    expect(restDurationFor("back_squat", undefined, restDefaults)).toBe(180);
  });

  it("falls back to the accessory default when the plan lacks a rest range and the exercise is not a main lift", () => {
    expect(restDurationFor("dumbbell_lateral_raise", undefined, restDefaults)).toBe(90);
  });

  it("falls back correctly for an unknown exercise id (treated as not a main lift)", () => {
    expect(restDurationFor("nonexistent", undefined, restDefaults)).toBe(90);
  });
});

describe("formatRemaining", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatRemaining(90000)).toBe("1:30");
  });

  it("pads single-digit seconds", () => {
    expect(formatRemaining(65000)).toBe("1:05");
  });

  it("rounds up a partial second so the display never reads 0:00 early", () => {
    expect(formatRemaining(65500)).toBe("1:06");
  });

  it("clamps zero and negative remaining time to 0:00", () => {
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(-500)).toBe("0:00");
  });
});
