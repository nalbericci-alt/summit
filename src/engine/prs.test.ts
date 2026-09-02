import { describe, expect, it } from "vitest";
import { detectPrs } from "./prs";
import type { SetRecord } from "../storage/schema";

let counter = 0;

function set(overrides: Partial<SetRecord> & Pick<SetRecord, "exerciseId">): SetRecord {
  counter += 1;
  return {
    id: `set-${counter}`,
    workoutId: "w",
    lineId: "line",
    substituteExerciseId: null,
    setIndex: 1,
    role: "work",
    setType: "working",
    plannedLb: null,
    plannedReps: "5",
    perHand: false,
    actualLb: null,
    actualReps: null,
    rpe: null,
    rir: null,
    completed: true,
    completedAt: "2026-09-02T12:00:00.000Z",
    note: "",
    updatedAt: "2026-09-02T12:00:00.000Z",
    ...overrides,
  };
}

describe("detectPrs", () => {
  it("flags a weight PR when the top completed weight beats every prior weight", () => {
    const current = [set({ exerciseId: "back_squat", actualLb: 260, actualReps: 3 })];
    const history = { back_squat: [set({ exerciseId: "back_squat", actualLb: 255, actualReps: 3 })] };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(true);
    expect(result.repPr).toBe(false);
  });

  it("flags a rep PR when reps at the same top weight beat every prior rep count at that weight", () => {
    const current = [set({ exerciseId: "back_squat", actualLb: 255, actualReps: 5 })];
    const history = {
      back_squat: [
        set({ exerciseId: "back_squat", actualLb: 255, actualReps: 3 }),
        set({ exerciseId: "back_squat", actualLb: 230, actualReps: 8 }),
      ],
    };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(false);
    expect(result.repPr).toBe(true);
  });

  it("does not flag a rep PR when history never trained at exactly the new top weight", () => {
    // Weight PR (260 beats 255), but no prior set was ever logged at exactly 260 to compare reps against.
    const current = [set({ exerciseId: "back_squat", actualLb: 260, actualReps: 3 })];
    const history = { back_squat: [set({ exerciseId: "back_squat", actualLb: 255, actualReps: 5 })] };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(true);
    expect(result.repPr).toBe(false);
  });

  it("flags an e1RM PR from a higher-rep set even when the weight itself is not a PR", () => {
    // e1RM(230,8) = 230*(1+8/30) = 291.3, beats every prior e1RM even though 230 < prior max weight 255.
    const current = [set({ exerciseId: "back_squat", actualLb: 230, actualReps: 8 })];
    const history = {
      back_squat: [
        set({ exerciseId: "back_squat", actualLb: 255, actualReps: 3 }), // e1RM = 280.5
      ],
    };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(false);
    expect(result.e1rmPr).toBe(true);
  });

  it("shows no PRs on a first-ever workout for an exercise: nothing to beat", () => {
    const current = [set({ exerciseId: "back_squat", actualLb: 255, actualReps: 5 })];
    const [result] = detectPrs(current, {});
    expect(result).toEqual({ exerciseId: "back_squat", weightPr: false, repPr: false, e1rmPr: false });
  });

  it("compares per-hand loads as written, never doubled", () => {
    const current = [set({ exerciseId: "incline_dumbbell_press", actualLb: 30, actualReps: 10, perHand: true })];
    const history = {
      incline_dumbbell_press: [set({ exerciseId: "incline_dumbbell_press", actualLb: 27.5, actualReps: 10, perHand: true })],
    };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(true);
  });

  it("ignores incomplete sets, warm-up/AMRAP/failure/drop set types, and sets missing a logged weight or reps", () => {
    const current = [
      set({ exerciseId: "back_squat", actualLb: 999, actualReps: 1, completed: false }),
      set({ exerciseId: "back_squat", actualLb: 999, actualReps: 1, setType: "warmup" }),
      set({ exerciseId: "back_squat", actualLb: 999, actualReps: null }),
      set({ exerciseId: "back_squat", actualLb: 255, actualReps: 3 }),
    ];
    const history = { back_squat: [set({ exerciseId: "back_squat", actualLb: 250, actualReps: 3 })] };
    const [result] = detectPrs(current, history);
    expect(result.weightPr).toBe(true);
  });

  it("skips an exercise entirely when it has no qualifying current sets", () => {
    const current = [set({ exerciseId: "back_squat", completed: false, actualLb: 255, actualReps: 3 })];
    expect(detectPrs(current, {})).toEqual([]);
  });
});
