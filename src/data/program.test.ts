import { describe, expect, it } from "vitest";
import { e1rm, resolveWeek, roundTo5 } from "../engine/loads";
import { BASE_CARDIO, DAYS, EXERCISES, PROGRAM_META, RUN_WALK, SATURDAY, VIDEOS, WEEKS, liftingDays } from "./program";

const baselines = { S: PROGRAM_META.baselines.S.lb, D: PROGRAM_META.baselines.D.lb };

function line(dayId: string, lineId: string) {
  const day = liftingDays().find((item) => item.id === dayId);
  const found = day?.lines.find((item) => item.lineId === lineId);
  if (!found) throw new Error(`missing ${dayId}/${lineId}`);
  return found;
}

function resolved(dayId: string, lineId: string, week: number) {
  return resolveWeek(line(dayId, lineId).weeks[week - 1], baselines);
}

describe("program transcription", () => {
  it("covers seven days and twelve weeks with every line complete", () => {
    expect(DAYS.map((day) => day.id)).toEqual(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);
    expect(WEEKS).toHaveLength(12);
    expect(RUN_WALK).toHaveLength(12);
    expect(BASE_CARDIO).toHaveLength(12);
    expect(SATURDAY).toHaveLength(12);
    for (const day of liftingDays()) {
      expect(day.lines.length).toBeGreaterThan(0);
      for (const item of day.lines) {
        expect(item.weeks, `${item.lineId} weeks`).toHaveLength(12);
        expect(EXERCISES[item.exerciseId], `${item.lineId} exercise`).toBeDefined();
        expect(day.sequence).toContain(item.exerciseId);
        if (item.supersetWith) expect(day.lines.some((other) => other.lineId === item.supersetWith)).toBe(true);
        if (item.backup) expect(EXERCISES[item.backup.substituteId], `${item.lineId} backup`).toBeDefined();
      }
    }
    for (const video of Object.keys(VIDEOS)) expect(EXERCISES[video]).toBeDefined();
  });

  it("matches the PDF's worked examples for S=225 and D=255", () => {
    // Wednesday squat: W2 230/205, W5 240/215, W9 255/230, W11 265/240, W4 170, W8 180.
    expect(resolved("wednesday", "wednesday_squat", 2)?.map((s) => s.lb)).toEqual([230, 205]);
    expect(resolved("wednesday", "wednesday_squat", 5)?.map((s) => s.lb)).toEqual([240, 215]);
    expect(resolved("wednesday", "wednesday_squat", 9)?.map((s) => s.lb)).toEqual([255, 230]);
    expect(resolved("wednesday", "wednesday_squat", 11)?.map((s) => s.lb)).toEqual([265, 240]);
    expect(resolved("wednesday", "wednesday_squat", 4)?.map((s) => s.lb)).toEqual([170]);
    expect(resolved("wednesday", "wednesday_squat", 8)?.map((s) => [s.lb, s.sets, s.reps])).toEqual([[180, 3, "4"]]);
    // Sunday deadlift: W2 265/240, W5 280/250, W7 300/270, W9 305/275, W10 315/285, W11 320/290, W4 190, W8 205.
    expect(resolved("sunday", "sunday_deadlift", 2)?.map((s) => s.lb)).toEqual([265, 240]);
    expect(resolved("sunday", "sunday_deadlift", 5)?.map((s) => s.lb)).toEqual([280, 250]);
    expect(resolved("sunday", "sunday_deadlift", 7)?.map((s) => s.lb)).toEqual([300, 270]);
    expect(resolved("sunday", "sunday_deadlift", 9)?.map((s) => s.lb)).toEqual([305, 275]);
    expect(resolved("sunday", "sunday_deadlift", 10)?.map((s) => s.lb)).toEqual([315, 285]);
    expect(resolved("sunday", "sunday_deadlift", 11)?.map((s) => s.lb)).toEqual([320, 290]);
    expect(resolved("sunday", "sunday_deadlift", 4)?.map((s) => s.lb)).toEqual([190]);
    expect(resolved("sunday", "sunday_deadlift", 8)?.map((s) => [s.lb, s.sets, s.reps])).toEqual([[205, 2, "4"]]);
    // Friday paused squat: 160, 160, 165, 135, 170, 170, 175, 145, 180, 180, 180, omit.
    const paused = Array.from({ length: 12 }, (_, i) => resolved("friday", "friday_paused_squat", i + 1)?.[0]?.lb ?? null);
    expect(paused).toEqual([160, 160, 165, 135, 170, 170, 175, 145, 180, 180, 180, null]);
    // Week 12 checks.
    expect(resolved("monday", "monday_bench", 12)?.map((s) => [s.lb, s.optional])).toEqual([[205, false], [220, true]]);
    expect(resolved("wednesday", "wednesday_squat", 12)?.map((s) => [s.lb, s.optional])).toEqual([[255, false], [275, true]]);
    expect(resolved("sunday", "sunday_deadlift", 12)?.map((s) => [s.lb, s.optional])).toEqual([[305, false], [335, true]]);
  });

  it("matches the archived Week 8 prescription Nick trained from", () => {
    const week8 = (dayId: string, lineId: string) => resolved(dayId, lineId, 8)?.map((s) => `${s.label}, ${s.sets}x${s.reps}`);
    expect(week8("monday", "monday_bench")).toEqual(["155, 3x4"]);
    expect(week8("monday", "monday_ohp")).toEqual(["85, 2x6"]);
    expect(week8("monday", "monday_row")).toEqual(["105, 2x8"]);
    expect(week8("monday", "monday_incline")).toEqual(["50s, 1x8"]);
    expect(week8("monday", "monday_skull_crusher")).toEqual(["50, 1x8"]);
    expect(week8("wednesday", "wednesday_squat")).toEqual(["180, 3x4"]);
    expect(week8("wednesday", "wednesday_rdl")).toEqual(["155, 1x8"]);
    expect(week8("friday", "friday_paused_squat")).toEqual(["145, 2x4"]);
    expect(week8("friday", "friday_bench")).toEqual(["135, 2x7"]);
    expect(week8("friday", "friday_db_press")).toEqual(["35s, 1x8"]);
    expect(week8("friday", "friday_cs_row")).toEqual(["45s, 1x8"]);
    expect(week8("friday", "friday_barbell_curl")).toEqual(["50, 1x8"]);
    expect(week8("friday", "friday_hammer_curl")).toEqual(["25s, 1x10"]);
    expect(week8("sunday", "sunday_deadlift")).toEqual(["205, 2x4"]);
  });

  it("resolves earned loads from the last log entry and leaves owner choices open", () => {
    const pulldown = line("monday", "monday_pulldown");
    const week6 = resolveWeek(pulldown.weeks[5], baselines, { lb: 120 })!;
    expect(week6[0].label).toBe("+1 pin");
    expect(week6[0].ownerChoice).toBe(true);
    const week7 = resolveWeek(pulldown.weeks[6], baselines, { lb: 130 })!;
    expect(week7[0].lb).toBe(130);
    const week4 = resolveWeek(pulldown.weeks[3], baselines, { lb: 120 })!;
    expect(week4[0].lb).toBe(95);
    const raise = line("monday", "monday_lateral_raise");
    const raiseDeload = resolveWeek(raise.weeks[7], baselines, { lb: 17.5, perHand: true })!;
    expect(raiseDeload[0].label).toBe("15s");
    expect(resolveWeek(raise.weeks[4], baselines)![0].label).toBe("+2.5s if earned");
  });

  it("rounds like the PDF and estimates 1RM with Epley", () => {
    expect(roundTo5(146.25)).toBe(145);
    expect(roundTo5(168.75)).toBe(170);
    expect(roundTo5(252)).toBe(250);
    expect(e1rm(205, 3)).toBeCloseTo(225.5);
  });
});
