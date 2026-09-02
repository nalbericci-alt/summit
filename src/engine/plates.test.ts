import { describe, expect, it } from "vitest";
import { DEFAULT_BAR, DEFAULT_PLATES, platesPerSide } from "./plates";

describe("platesPerSide", () => {
  it("has the expected defaults", () => {
    expect(DEFAULT_PLATES).toEqual([45, 35, 25, 10, 5, 2.5]);
    expect(DEFAULT_BAR).toBe(45);
  });

  it("225 loads 45,45 per side exactly", () => {
    expect(platesPerSide(225)).toEqual({ perSide: [45, 45], loaded: 225, shortBy: 0 });
  });

  it("135 loads a single 45 per side exactly", () => {
    expect(platesPerSide(135)).toEqual({ perSide: [45], loaded: 135, shortBy: 0 });
  });

  it("185 skips the 35 in favor of a 25 (25 remaining after the 45)", () => {
    expect(platesPerSide(185)).toEqual({ perSide: [45, 25], loaded: 185, shortBy: 0 });
  });

  it("147.5 stops at 45+5 per side (2.5 does not fit the 1.25 remainder), short by 2.5", () => {
    expect(platesPerSide(147.5)).toEqual({ perSide: [45, 5], loaded: 145, shortBy: 2.5 });
  });

  it("respects a custom bar weight and plate set", () => {
    // (95 - 15) / 2 = 40 per side -> greedy 20 + 20.
    expect(platesPerSide(95, 15, [20, 10, 5])).toEqual({ perSide: [20, 20], loaded: 95, shortBy: 0 });
  });

  it("clamps to zero plates when the target is at or below the bar", () => {
    expect(platesPerSide(45)).toEqual({ perSide: [], loaded: 45, shortBy: 0 });
    expect(platesPerSide(20)).toEqual({ perSide: [], loaded: 45, shortBy: -25 });
  });
});
