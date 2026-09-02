import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSummitDbForTests } from "./db";
import { recentPerformances } from "./history";
import { completeSet, createWorkout, upsertSet } from "./workouts";
import type { SetInput } from "./workouts";

beforeEach(async () => {
  await resetSummitDbForTests();
});

function set(
  overrides: Partial<SetInput> & Pick<SetInput, "id" | "workoutId" | "lineId" | "exerciseId" | "setIndex">,
): SetInput {
  return {
    substituteExerciseId: null,
    role: "work",
    setType: "working",
    plannedLb: null,
    plannedReps: "5",
    perHand: false,
    actualLb: null,
    actualReps: null,
    rpe: null,
    rir: null,
    completed: false,
    completedAt: null,
    note: "",
    ...overrides,
  };
}

describe("recentPerformances", () => {
  it("returns complete workouts newest first, each with its sets sorted by setIndex", async () => {
    const older = await createWorkout({ date: "2026-08-19", week: 7, dayId: "wednesday", status: "complete" });
    const newer = await createWorkout({ date: "2026-08-26", week: 8, dayId: "wednesday", status: "complete" });

    await upsertSet(set({ id: "o2", workoutId: older.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 2 }));
    await completeSet("o2", { actualLb: 210, actualReps: 5, rpe: 7, rir: null });
    await upsertSet(set({ id: "o1", workoutId: older.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await completeSet("o1", { actualLb: 235, actualReps: 5, rpe: 8, rir: null });

    await upsertSet(set({ id: "n1", workoutId: newer.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await completeSet("n1", { actualLb: 245, actualReps: 5, rpe: 8, rir: null });

    const result = await recentPerformances("back_squat", 5);
    expect(result.map((r) => r.workout.id)).toEqual([newer.id, older.id]);
    expect(result[1].sets.map((s) => s.id)).toEqual(["o1", "o2"]);
  });

  it("excludes draft and skipped workouts", async () => {
    const complete = await createWorkout({ date: "2026-08-26", week: 8, dayId: "wednesday", status: "complete" });
    const draft = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "draft" });
    const skipped = await createWorkout({ date: "2026-08-12", week: 6, dayId: "wednesday", status: "skipped" });

    await upsertSet(set({ id: "c1", workoutId: complete.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await upsertSet(set({ id: "d1", workoutId: draft.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await upsertSet(set({ id: "s1", workoutId: skipped.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));

    const result = await recentPerformances("back_squat", 5);
    expect(result.map((r) => r.workout.id)).toEqual([complete.id]);
  });

  it("excludes the given excludeWorkoutId even when it is complete", async () => {
    const a = await createWorkout({ date: "2026-08-26", week: 8, dayId: "wednesday", status: "complete" });
    const b = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "complete" });
    await upsertSet(set({ id: "a1", workoutId: a.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await upsertSet(set({ id: "b1", workoutId: b.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));

    const result = await recentPerformances("back_squat", 5, b.id);
    expect(result.map((r) => r.workout.id)).toEqual([a.id]);
  });

  it("caps at limit", async () => {
    for (let i = 0; i < 3; i++) {
      const w = await createWorkout({ date: `2026-08-0${i + 1}`, week: 1, dayId: "wednesday", status: "complete" });
      await upsertSet(set({ id: `w${i}`, workoutId: w.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    }
    const result = await recentPerformances("back_squat", 2);
    expect(result).toHaveLength(2);
  });

  it("returns an empty array when nothing trained the exercise", async () => {
    expect(await recentPerformances("nonexistent_exercise", 5)).toEqual([]);
  });
});
