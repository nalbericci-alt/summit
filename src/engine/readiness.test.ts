import { describe, expect, it } from "vitest";
import { DELOAD_AND_READINESS } from "../data/program";
import { readinessRecommendation } from "./readiness";

describe("readinessRecommendation", () => {
  it("routes to Recovery whenever symptoms are reported, regardless of other inputs", () => {
    const result = readinessRecommendation({ sleep: 3, soreness: 3, energy: 3, symptoms: true });
    expect(result.status).toBe("Recovery");
    expect(result.adjustments).toEqual([DELOAD_AND_READINESS.recoverySession]);
  });

  it("returns Full with no warning signs when every measure is normal or better", () => {
    const result = readinessRecommendation({ sleep: 2, soreness: 3, energy: 2, symptoms: false });
    expect(result.status).toBe("Full");
    expect(result.reasons).toEqual(["No warning signs"]);
    expect(result.adjustments).toEqual([]);
  });

  it("stays Full on exactly one flag, but names it and cites the single-number rule", () => {
    const result = readinessRecommendation({ sleep: 1, soreness: 2, energy: 2, symptoms: false });
    expect(result.status).toBe("Full");
    expect(result.reasons).toEqual(["Poor sleep", DELOAD_AND_READINESS.singleNumberRule]);
  });

  it("routes to Reduced with the four reduced-session adjustments on two flags", () => {
    const result = readinessRecommendation({ sleep: 1, soreness: 1, energy: 2, symptoms: false });
    expect(result.status).toBe("Reduced");
    expect(result.reasons).toEqual(["Poor sleep", "High soreness"]);
    expect(result.adjustments).toEqual(DELOAD_AND_READINESS.reducedSession);
    expect(result.adjustments).toHaveLength(4);
  });

  it("routes to Reduced on all three flags and lists each in plain words", () => {
    const result = readinessRecommendation({ sleep: 1, soreness: 1, energy: 1, symptoms: false });
    expect(result.status).toBe("Reduced");
    expect(result.reasons).toEqual(["Poor sleep", "High soreness", "Low energy"]);
  });

  it("does not include the single-number sentence when zero or two-plus flags are present", () => {
    const zero = readinessRecommendation({ sleep: 2, soreness: 2, energy: 2, symptoms: false });
    expect(zero.reasons).not.toContain(DELOAD_AND_READINESS.singleNumberRule);
    const two = readinessRecommendation({ sleep: 1, soreness: 1, energy: 2, symptoms: false });
    expect(two.reasons).not.toContain(DELOAD_AND_READINESS.singleNumberRule);
  });
});
