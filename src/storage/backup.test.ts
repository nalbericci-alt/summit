import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { exportBackup, importBackup, previewBackup } from "./backup";
import { openSummitDb, resetSummitDbForTests } from "./db";
import { getSetting, setSetting } from "./settings";
import { completeSet, createWorkout, upsertSet } from "./workouts";

beforeEach(async () => {
  await resetSummitDbForTests();
});

async function seedData() {
  await setSetting("units", "kg");
  await setSetting("theme", "light");
  await setSetting("lastBackupAt", "2026-09-01T00:00:00.000Z");

  const workout = await createWorkout({ date: "2026-09-02", week: 9, dayId: "wednesday", status: "complete" });
  await upsertSet({
    id: "s1",
    workoutId: workout.id,
    lineId: "wednesday_squat",
    exerciseId: "back_squat",
    substituteExerciseId: null,
    setIndex: 1,
    role: "top",
    setType: "working",
    plannedLb: 255,
    plannedReps: "3",
    perHand: false,
    actualLb: null,
    actualReps: null,
    rpe: null,
    rir: null,
    completed: false,
    completedAt: null,
    note: "",
  });
  await completeSet("s1", { actualLb: 255, actualReps: 3, rpe: 8, rir: null });

  const db = await openSummitDb();
  await db.put("checkins", {
    date: "2026-09-02",
    sleep: 2,
    soreness: 2,
    energy: 3,
    symptoms: false,
    note: "felt good",
    createdAt: "2026-09-02T07:00:00.000Z",
  });

  return workout;
}

describe("exportBackup / importBackup round trip", () => {
  it("round-trips workouts, sets, checkins, and non-lastBackupAt settings exactly into a reset DB", async () => {
    await seedData();
    const snapshot = await exportBackup();

    expect(previewBackup(snapshot)).toEqual({
      ok: true,
      exportedAt: snapshot.exportedAt,
      workoutCount: 1,
      setCount: 1,
      checkinCount: 1,
    });

    await resetSummitDbForTests();
    // lastBackupAt on the fresh DB is the default (null) before import.
    expect(await getSetting("lastBackupAt")).toBeNull();

    await importBackup(snapshot);

    const db = await openSummitDb();
    expect(await db.getAll("workouts")).toEqual(snapshot.workouts);
    expect(await db.getAll("sets")).toEqual(snapshot.sets);
    expect(await db.getAll("checkins")).toEqual(snapshot.checkins);

    expect(await getSetting("units")).toBe("kg");
    expect(await getSetting("theme")).toBe("light");
    // lastBackupAt is left untouched by import: still the fresh DB's pre-import value, not the snapshot's.
    expect(await getSetting("lastBackupAt")).toBeNull();
  });
});

describe("previewBackup", () => {
  it("rejects a wrong app field", () => {
    const result = previewBackup({ app: "other", version: 1, exportedAt: "x", settings: {}, workouts: [], sets: [], checkins: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing array", () => {
    const result = previewBackup({ app: "summit", version: 1, exportedAt: "x", settings: {}, workouts: [], checkins: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a set without a workoutId", () => {
    const badSet = {
      id: "s1",
      lineId: "a",
      exerciseId: "b",
      setIndex: 1,
      role: "work",
      setType: "working",
      plannedReps: "8",
      perHand: false,
      completed: false,
      updatedAt: "x",
    };
    const result = previewBackup({ app: "summit", version: 1, exportedAt: "x", settings: {}, workouts: [], sets: [badSet], checkins: [] });
    expect(result.ok).toBe(false);
  });

  it("accepts a well-formed empty backup", () => {
    const result = previewBackup({
      app: "summit",
      version: 1,
      exportedAt: "2026-09-02T00:00:00.000Z",
      settings: {},
      workouts: [],
      sets: [],
      checkins: [],
    });
    expect(result).toEqual({ ok: true, exportedAt: "2026-09-02T00:00:00.000Z", workoutCount: 0, setCount: 0, checkinCount: 0 });
  });
});

describe("importBackup", () => {
  it("throws and writes nothing when the backup does not preview ok", async () => {
    await expect(importBackup({ app: "not-summit" })).rejects.toThrow();
    const db = await openSummitDb();
    expect(await db.getAll("workouts")).toEqual([]);
  });
});
