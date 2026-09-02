import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSummitDbForTests } from "./db";
import {
  completeSet,
  createWorkout,
  findDraftForDate,
  getWorkout,
  lastEarnedForLine,
  lastPerformance,
  listWorkouts,
  setsForWorkout,
  updateWorkout,
  upsertSet,
  workoutSummary,
} from "./workouts";
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
    plannedReps: "8",
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

describe("createWorkout / getWorkout / updateWorkout", () => {
  it("creates a draft with timestamps and reads it back", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    expect(workout.status).toBe("draft");
    expect(workout.id).toBeTruthy();
    expect(await getWorkout(workout.id)).toEqual(workout);
  });

  it("updates fields and stamps updatedAt without touching createdAt", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    const updated = await updateWorkout(workout.id, { status: "complete", finishedAt: "2026-09-02T12:00:00.000Z" });
    expect(updated.status).toBe("complete");
    expect(updated.finishedAt).toBe("2026-09-02T12:00:00.000Z");
    expect(updated.createdAt).toBe(workout.createdAt);
  });

  it("finds the draft for a date, ignoring complete workouts on other dates", async () => {
    const draft = await createWorkout({ date: "2026-09-03", week: 9, dayId: "thursday" });
    await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "complete" });
    expect((await findDraftForDate("2026-09-03"))?.id).toBe(draft.id);
    expect(await findDraftForDate("2026-09-02")).toBeUndefined();
  });

  it("lists workouts newest first and can filter by status or limit", async () => {
    const w1 = await createWorkout({ date: "2026-08-31", week: 9, dayId: "monday", status: "complete" });
    const w2 = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "complete" });
    const w3 = await createWorkout({ date: "2026-09-01", week: 9, dayId: "tuesday", status: "skipped" });

    expect((await listWorkouts()).map((w) => w.id)).toEqual([w2.id, w3.id, w1.id]);
    expect((await listWorkouts({ status: "complete" })).map((w) => w.id)).toEqual([w2.id, w1.id]);
    expect((await listWorkouts({ limit: 1 }))[0].id).toBe(w2.id);
  });
});

describe("sets", () => {
  it("upserts idempotently by id and orders setsForWorkout by lineId then setIndex", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    await upsertSet(set({ id: "s2", workoutId: workout.id, lineId: "b", exerciseId: "ex_b", setIndex: 1 }));
    await upsertSet(set({ id: "s1", workoutId: workout.id, lineId: "a", exerciseId: "ex_a", setIndex: 2 }));
    await upsertSet(set({ id: "s0", workoutId: workout.id, lineId: "a", exerciseId: "ex_a", setIndex: 1 }));
    // Idempotent overwrite: same id, changed note.
    await upsertSet(set({ id: "s0", workoutId: workout.id, lineId: "a", exerciseId: "ex_a", setIndex: 1, note: "updated" }));

    const sets = await setsForWorkout(workout.id);
    expect(sets.map((s) => s.id)).toEqual(["s0", "s1", "s2"]);
    expect(sets[0].note).toBe("updated");
  });

  it("completes a set and stamps completedAt", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    await upsertSet(set({ id: "s1", workoutId: workout.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1, plannedLb: 255 }));
    const completed = await completeSet("s1", { actualLb: 255, actualReps: 3, rpe: 8, rir: null });
    expect(completed.completed).toBe(true);
    expect(completed.completedAt).toBeTruthy();
    expect(completed.actualLb).toBe(255);
  });
});

describe("lastEarnedForLine", () => {
  it("returns the newest completed working set's load and perHand flag, only from complete workouts", async () => {
    const older = await createWorkout({ date: "2026-08-26", week: 8, dayId: "wednesday", status: "complete" });
    const newer = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "complete" });
    const draftWorkout = await createWorkout({ date: "2026-09-09", week: 10, dayId: "wednesday", status: "draft" });

    await upsertSet(set({ id: "old1", workoutId: older.id, lineId: "wednesday_leg_curl", exerciseId: "seated_or_lying_leg_curl", setIndex: 1 }));
    await completeSet("old1", { actualLb: 60, actualReps: 10, rpe: 7, rir: null });

    await upsertSet(set({ id: "new1", workoutId: newer.id, lineId: "wednesday_leg_curl", exerciseId: "seated_or_lying_leg_curl", setIndex: 1, perHand: true }));
    await completeSet("new1", { actualLb: 65, actualReps: 10, rpe: 7, rir: null });

    // A draft workout's completed set must not count, even though it is the most recently completed.
    await upsertSet(set({ id: "draft1", workoutId: draftWorkout.id, lineId: "wednesday_leg_curl", exerciseId: "seated_or_lying_leg_curl", setIndex: 1 }));
    await completeSet("draft1", { actualLb: 999, actualReps: 10, rpe: 7, rir: null });

    // A warm-up row must not count even if completed with a load.
    await upsertSet(set({ id: "new0", workoutId: newer.id, lineId: "wednesday_leg_curl", exerciseId: "seated_or_lying_leg_curl", setIndex: 0, role: "warmup" }));
    await completeSet("new0", { actualLb: 500, actualReps: 10, rpe: 5, rir: null });

    expect(await lastEarnedForLine("wednesday_leg_curl")).toEqual({ lb: 65, perHand: true });
  });

  it("returns undefined when no completed set exists on the line", async () => {
    expect(await lastEarnedForLine("nonexistent_line")).toBeUndefined();
  });
});

describe("lastPerformance", () => {
  it("returns the prior complete workout's sets for an exercise, not the current one", async () => {
    const prior = await createWorkout({ date: "2026-08-26", week: 8, dayId: "wednesday", status: "complete" });
    const current = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "draft" });

    await upsertSet(set({ id: "p1", workoutId: prior.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await completeSet("p1", { actualLb: 230, actualReps: 4, rpe: 7, rir: null });
    await upsertSet(set({ id: "p2", workoutId: prior.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 2 }));
    await completeSet("p2", { actualLb: 210, actualReps: 4, rpe: 6, rir: null });

    await upsertSet(set({ id: "c1", workoutId: current.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));

    const last = await lastPerformance("back_squat", current.id);
    expect(last.map((s) => s.id)).toEqual(["p1", "p2"]);
    expect(last.every((s) => s.workoutId === prior.id)).toBe(true);
  });

  it("returns an empty array when no complete workout trained the exercise", async () => {
    expect(await lastPerformance("nonexistent_exercise")).toEqual([]);
  });
});

describe("workoutSummary", () => {
  it("computes duration, tonnage (doubling per-hand loads), and set counts", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    await updateWorkout(workout.id, {
      finishedAt: new Date(new Date(workout.startedAt).getTime() + 45 * 60000).toISOString(),
    });

    await upsertSet(set({ id: "s1", workoutId: workout.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 1 }));
    await completeSet("s1", { actualLb: 255, actualReps: 3, rpe: 8, rir: null });

    await upsertSet(set({ id: "s2", workoutId: workout.id, lineId: "monday_incline", exerciseId: "incline_dumbbell_press", setIndex: 1, perHand: true }));
    await completeSet("s2", { actualLb: 55, actualReps: 8, rpe: 7, rir: null });

    // Warm-up: excluded from tonnage even though completed.
    await upsertSet(set({ id: "s3", workoutId: workout.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 0, role: "warmup" }));
    await completeSet("s3", { actualLb: 135, actualReps: 5, rpe: 3, rir: null });

    // Uncompleted planned set: counts toward plannedSets but not completedSets or tonnage.
    await upsertSet(set({ id: "s4", workoutId: workout.id, lineId: "wednesday_squat", exerciseId: "back_squat", setIndex: 2, plannedLb: 230 }));

    const summary = await workoutSummary(workout.id);
    expect(summary.durationMin).toBe(45);
    expect(summary.plannedSets).toBe(4);
    expect(summary.completedSets).toBe(3);
    // 255*3 + 55*8*2 (per-hand doubled) = 765 + 880 = 1645
    expect(summary.tonnageLb).toBe(1645);
  });

  it("returns a null duration when the workout has not finished", async () => {
    const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday" });
    expect((await workoutSummary(workout.id)).durationMin).toBeNull();
  });
});
