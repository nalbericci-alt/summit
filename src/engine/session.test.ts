import { describe, expect, it } from "vitest";
import { PROGRAM_META } from "../data/program";
import { buildSession, warmupRamp } from "./session";

const baselines = { S: PROGRAM_META.baselines.S.lb, D: PROGRAM_META.baselines.D.lb };

describe("warmupRamp", () => {
  it("computes the bench ramp for work 205 (conditional top step included)", () => {
    const steps = ["Empty bar x15", "45% of heaviest work x8", "65% x5", "80% x3", "Add 90% x1 when top is 200+"];
    expect(warmupRamp(steps, 205)).toEqual([
      { label: "45x15", lb: 45, reps: "15" },
      { label: "90x8", lb: 90, reps: "8" },
      { label: "135x5", lb: 135, reps: "5" },
      { label: "165x3", lb: 165, reps: "3" },
      { label: "185x1", lb: 185, reps: "1" },
    ]);
  });

  it("computes the squat ramp for work 255, dropping the pure instruction line", () => {
    const steps = ["Bar x10", "95x8", "60% x5", "75% x3", "90% x1", "Round to 5 and omit steps at or above work"];
    expect(warmupRamp(steps, 255)).toEqual([
      { label: "45x10", lb: 45, reps: "10" },
      { label: "95x8", lb: 95, reps: "8" },
      { label: "155x5", lb: 155, reps: "5" },
      { label: "190x3", lb: 190, reps: "3" },
      { label: "230x1", lb: 230, reps: "1" },
    ]);
  });

  it("computes the deadlift ramp for work 205 (no step at or above work)", () => {
    const steps = ["135x5", "60% x3", "75% x2", "85% x1", "Round to 5 and omit steps at or above work"];
    expect(warmupRamp(steps, 205)).toEqual([
      { label: "135x5", lb: 135, reps: "5" },
      { label: "125x3", lb: 125, reps: "3" },
      { label: "155x2", lb: 155, reps: "2" },
      { label: "175x1", lb: 175, reps: "1" },
    ]);
  });

  it("omits the deadlift 135x5 rung for work 135 because it is at the work load", () => {
    const steps = ["135x5", "60% x3", "75% x2", "85% x1", "Round to 5 and omit steps at or above work"];
    expect(warmupRamp(steps, 135)).toEqual([
      { label: "80x3", lb: 80, reps: "3" },
      { label: "100x2", lb: 100, reps: "2" },
      { label: "115x1", lb: 115, reps: "1" },
    ]);
  });

  it("keeps a per-hand step literal and unresolved conditionals/percents when workLb is null", () => {
    expect(warmupRamp(["25s x8", "40s x5"], null)).toEqual([
      { label: "25s x8", lb: 25, reps: "8" },
      { label: "40s x5", lb: 40, reps: "5" },
    ]);
    expect(warmupRamp(["65% x5"], null)).toEqual([{ label: "65% x5", lb: null, reps: "5" }]);
    expect(warmupRamp(["Add 90% x1 when top is 200+"], null)).toEqual([]);
  });

  it("passes through an unrecognized bodyweight cue as-is", () => {
    expect(warmupRamp(["5 scapular pulls", "Easy x3"], null)).toEqual([
      { label: "5 scapular pulls", lb: null, reps: null },
      { label: "Easy x3", lb: null, reps: "3" },
    ]);
  });
});

describe("buildSession", () => {
  it("returns null for a non-lifting day", () => {
    expect(buildSession(9, "tuesday", baselines, {})).toBeNull();
  });

  it("builds week 9 Wednesday: squat top/backoff rows in order, RDL note, leg extension included", () => {
    const session = buildSession(9, "wednesday", baselines, {});
    expect(session).not.toBeNull();

    const squat = session!.exercises.find((e) => e.lineId === "wednesday_squat")!;
    expect(squat.rows.map((r) => [r.role, r.load.lb, r.reps])).toEqual([
      ["top", 255, "3"],
      ["backoff", 230, "3"],
      ["backoff", 230, "3"],
      ["backoff", 230, "3"],
    ]);
    // setIndex is 1-based across the whole exercise, not reset per set group: top = 1, back-offs 2, 3, 4.
    expect(squat.rows.map((r) => r.setIndex)).toEqual([1, 2, 3, 4]);

    const rdl = session!.exercises.find((e) => e.lineId === "wednesday_rdl")!;
    expect(rdl.rows.map((r) => [r.load.lb, r.reps, r.note])).toEqual([
      [205, "8", "If earned."],
      [205, "8", "If earned."],
    ]);

    expect(session!.exercises.some((e) => e.lineId === "wednesday_leg_extension")).toBe(true);
    expect(session!.omittedLineIds).not.toContain("wednesday_leg_extension");
  });

  it("omits leg extension and calf raise at week 12 Wednesday", () => {
    const session = buildSession(12, "wednesday", baselines, {});
    expect(session!.omittedLineIds).toEqual(expect.arrayContaining(["wednesday_leg_extension", "wednesday_calf"]));
    expect(session!.exercises.some((e) => e.lineId === "wednesday_leg_extension")).toBe(false);
    expect(session!.exercises.some((e) => e.lineId === "wednesday_calf")).toBe(false);
  });

  it("includes the week 9 Monday plank rows with an empty load label", () => {
    const session = buildSession(9, "monday", baselines, {});
    const plank = session!.exercises.find((e) => e.lineId === "monday_plank")!;
    expect(plank.rows).toHaveLength(2);
    for (const row of plank.rows) expect(row.load.label).toBe("");
  });

  it("wires the resolved working weight into the warm-up ramp", () => {
    const session = buildSession(9, "monday", baselines, {});
    const bench = session!.exercises.find((e) => e.lineId === "monday_bench")!;
    expect(bench.warmup).toEqual([
      { label: "45x15", lb: 45, reps: "15" },
      { label: "90x8", lb: 90, reps: "8" },
      { label: "135x5", lb: 135, reps: "5" },
      { label: "165x3", lb: 165, reps: "3" },
      { label: "185x1", lb: 185, reps: "1" },
    ]);
  });

  it("gives unique row ids when two set groups share a role, and carries the week note", () => {
    const session = buildSession(12, "monday", baselines, {});
    const bench = session!.exercises.find((e) => e.lineId === "monday_bench")!;
    expect(bench.rows.map((r) => [r.rowId, r.load.lb, r.optional])).toEqual([
      ["monday_bench:work:0:1", 205, false],
      ["monday_bench:work:1:1", 220, true],
    ]);
    expect(new Set(bench.rows.map((r) => r.rowId)).size).toBe(bench.rows.length);
    expect(bench.weekNote).toBe("Week 12 check. Continue to 5 only while clean. Stop at 5 reps or RPE 8.");
  });

  it("leaves weekNote undefined for a week without one", () => {
    const session = buildSession(9, "monday", baselines, {});
    const bench = session!.exercises.find((e) => e.lineId === "monday_bench")!;
    expect(bench.weekNote).toBeUndefined();
  });

  it("carries the exercise name, cues, notes, and rest seconds through", () => {
    const session = buildSession(2, "wednesday", baselines, {});
    const squat = session!.exercises.find((e) => e.lineId === "wednesday_squat")!;
    expect(squat.name).toBe("Back squat");
    expect(squat.restSeconds).toEqual([180, 300]);
    expect(squat.cues).toEqual(["Consistent depth, controlled descent", "Stable bar path, full standing lockout"]);
    expect(squat.notes.length).toBeGreaterThan(0);
  });
});
