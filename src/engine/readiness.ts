import { DELOAD_AND_READINESS } from "../data/program";

/** 1 = the warning end (bad), 2 = normal, 3 = the good end. */
export type ReadinessLevel = 1 | 2 | 3;

export interface ReadinessInput {
  sleep: ReadinessLevel;
  soreness: ReadinessLevel;
  energy: ReadinessLevel;
  symptoms: boolean;
}

export interface ReadinessResult {
  status: "Full" | "Reduced" | "Recovery";
  reasons: string[];
  adjustments: string[];
}

/**
 * Applies the program's DELOAD_AND_READINESS rules to one day's check-in.
 * Symptoms always win and route to Recovery. Otherwise, two or more warning
 * flags (poor sleep, high soreness, low energy) route to Reduced; fewer than
 * two is Full. The single-number rule is surfaced in reasons whenever exactly
 * one flag is present, since one measure alone should never decide the day.
 */
export function readinessRecommendation(input: ReadinessInput): ReadinessResult {
  const { sleep, soreness, energy, symptoms } = input;

  if (symptoms) {
    return {
      status: "Recovery",
      reasons: ["Symptoms reported"],
      adjustments: [DELOAD_AND_READINESS.recoverySession],
    };
  }

  const flags: string[] = [];
  if (sleep === 1) flags.push("Poor sleep");
  if (soreness === 1) flags.push("High soreness");
  if (energy === 1) flags.push("Low energy");

  const reasons = flags.length > 0 ? [...flags] : ["No warning signs"];
  if (flags.length === 1) reasons.push(DELOAD_AND_READINESS.singleNumberRule);

  if (flags.length >= 2) {
    return { status: "Reduced", reasons, adjustments: [...DELOAD_AND_READINESS.reducedSession] };
  }

  return { status: "Full", reasons, adjustments: [] };
}
