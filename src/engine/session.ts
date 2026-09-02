import { EXERCISES, dayById, exerciseName } from "../data/program";
import type { Backup, DayId } from "../data/program";
import { resolveWeek, roundTo5 } from "./loads";
import type { Baselines, LastEarned, ResolvedLoad, ResolvedSet } from "./loads";

/** One resolved warm-up rung: a literal or computed weight and reps, or an unresolved label when nothing can be computed. */
export interface WarmupStep {
  label: string;
  lb: number | null;
  reps: string | null;
}

/** One completable set row, expanded from a program SetPlan's `sets` count. */
export interface PlannedRow {
  rowId: string;
  lineId: string;
  exerciseId: string;
  setIndex: number;
  role: "top" | "backoff" | "work";
  reps: string;
  load: ResolvedLoad;
  rpeCap?: number;
  optional: boolean;
  note?: string;
}

/** One exercise's resolved prescription for a session: warm-up ramp plus every set row in order. */
export interface PlannedExercise {
  lineId: string;
  exerciseId: string;
  name: string;
  restSeconds: [number, number];
  supersetWith?: string;
  warmup: WarmupStep[];
  backup?: Backup;
  cues: string[];
  notes: string[];
  rows: PlannedRow[];
  weekNote?: string;
}

/** A full day's resolved session: every exercise in program order, plus anything omitted this week. */
export interface SessionPlan {
  week: number;
  dayId: DayId;
  title: string;
  focus: string;
  mission: string;
  normalMinutes: [number, number];
  exercises: PlannedExercise[];
  omittedLineIds: string[];
  rules: string[];
  winCondition: string;
}

const INSTRUCTION_RE = /^round to 5\b/i;
const CONDITIONAL_RE = /^add\s+(\d+(?:\.\d+)?)%\s*x(\S+)\s+when\s+(top|work)\s+is\s+(\d+)\+$/i;
const PERCENT_RE = /^(\d+(?:\.\d+)?)%(?:\s+of\s+[a-z\s]+?)?\s*x(\S+)$/i;
const BAR_RE = /^(empty bar|bar)\s*x(\S+)$/i;
const PERHAND_RE = /^(\d+(?:\.\d+)?)s\s*x(\S+)$/i;
const LITERAL_RE = /^(\d+(?:\.\d+)?)x(\S+)$/i;
const BAR_LB = 45;

/** True when a resolved warm-up load has reached or passed the working weight, so it should be dropped. */
function atOrAboveWork(lb: number, workLb: number | null): boolean {
  return workLb != null && lb >= workLb;
}

/** Parses one program.ts warm-up line into a resolved step, or null when the line contributes nothing. */
function parseWarmupLine(raw: string, workLb: number | null): WarmupStep | null {
  const line = raw.trim();
  if (INSTRUCTION_RE.test(line)) return null;

  const conditional = CONDITIONAL_RE.exec(line);
  if (conditional) {
    const pct = Number(conditional[1]);
    const reps = conditional[2];
    const threshold = Number(conditional[4]);
    if (workLb == null || workLb < threshold) return null;
    const lb = roundTo5((pct / 100) * workLb);
    return atOrAboveWork(lb, workLb) ? null : { label: `${lb}x${reps}`, lb, reps };
  }

  const percent = PERCENT_RE.exec(line);
  if (percent) {
    const pct = Number(percent[1]);
    const reps = percent[2];
    if (workLb == null) return { label: raw, lb: null, reps };
    const lb = roundTo5((pct / 100) * workLb);
    return atOrAboveWork(lb, workLb) ? null : { label: `${lb}x${reps}`, lb, reps };
  }

  const bar = BAR_RE.exec(line);
  if (bar) {
    const reps = bar[2];
    return atOrAboveWork(BAR_LB, workLb) ? null : { label: `${BAR_LB}x${reps}`, lb: BAR_LB, reps };
  }

  const perHand = PERHAND_RE.exec(line);
  if (perHand) {
    const lb = Number(perHand[1]);
    const reps = perHand[2];
    return atOrAboveWork(lb, workLb) ? null : { label: raw, lb, reps };
  }

  const literal = LITERAL_RE.exec(line);
  if (literal) {
    const lb = Number(literal[1]);
    const reps = literal[2];
    return atOrAboveWork(lb, workLb) ? null : { label: `${lb}x${reps}`, lb, reps };
  }

  const lastX = line.lastIndexOf("x");
  const reps = lastX > 0 ? line.slice(lastX + 1).trim() : null;
  return { label: raw, lb: null, reps: reps || null };
}

/** Expands the program's warm-up strings into ordered, resolved rungs for a given working weight. */
export function warmupRamp(steps: string[], workLb: number | null): WarmupStep[] {
  const out: WarmupStep[] = [];
  for (const step of steps) {
    const parsed = parseWarmupLine(step, workLb);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** The heaviest resolved load this week, used as the warm-up ramp's target working weight. */
function workingLoadFor(resolvedSets: ResolvedSet[]): number | null {
  let max: number | null = null;
  for (const set of resolvedSets) {
    if (set.lb != null && (max == null || set.lb > max)) max = set.lb;
  }
  return max;
}

/** Builds every set row for one resolved set group, with deterministic, exercise-unique row ids. */
function rowsForGroup(lineId: string, group: ResolvedSet, groupIndex: number, sharesRole: boolean): PlannedRow[] {
  const rows: PlannedRow[] = [];
  for (let setIndex = 1; setIndex <= group.sets; setIndex++) {
    const rowId = sharesRole ? `${lineId}:${group.role}:${groupIndex}:${setIndex}` : `${lineId}:${group.role}:${setIndex}`;
    rows.push({
      rowId,
      lineId,
      exerciseId: "", // filled in by the caller, which knows the line's exerciseId
      setIndex,
      role: group.role,
      reps: group.reps,
      load: { lb: group.lb, perHand: group.perHand, label: group.label, fromBaseline: group.fromBaseline, ownerChoice: group.ownerChoice },
      rpeCap: group.rpeCap,
      optional: group.optional,
      note: group.note,
    });
  }
  return rows;
}

/** Resolves one day's session for a given week: every line's warm-up and set rows, in program order. */
export function buildSession(
  week: number,
  dayId: DayId,
  baselines: Baselines,
  lastEarnedByLine: Record<string, LastEarned>,
): SessionPlan | null {
  const day = dayById(dayId);
  if (day.kind !== "lifting") return null;

  const omittedLineIds: string[] = [];
  const exercises: PlannedExercise[] = [];

  for (const exerciseId of day.sequence) {
    const line = day.lines.find((item) => item.exerciseId === exerciseId);
    if (!line) continue;

    const weekPlan = line.weeks[week - 1];
    if (!weekPlan || "omit" in weekPlan) {
      omittedLineIds.push(line.lineId);
      continue;
    }

    const resolvedSets = resolveWeek(weekPlan, baselines, lastEarnedByLine[line.lineId]) ?? [];
    const workLb = workingLoadFor(resolvedSets);
    const warmup = warmupRamp(line.warmup ?? [], workLb);

    const roleGroupCounts: Partial<Record<ResolvedSet["role"], number>> = {};
    for (const set of resolvedSets) roleGroupCounts[set.role] = (roleGroupCounts[set.role] ?? 0) + 1;

    const rows: PlannedRow[] = resolvedSets.flatMap((group, groupIndex) => {
      const sharesRole = (roleGroupCounts[group.role] ?? 0) > 1;
      return rowsForGroup(line.lineId, group, groupIndex, sharesRole).map((row) => ({ ...row, exerciseId: line.exerciseId }));
    });

    exercises.push({
      lineId: line.lineId,
      exerciseId: line.exerciseId,
      name: exerciseName(line.exerciseId),
      restSeconds: line.restSeconds,
      supersetWith: line.supersetWith,
      warmup,
      backup: line.backup,
      cues: EXERCISES[line.exerciseId]?.cues ?? [],
      notes: line.notes ?? [],
      rows,
      weekNote: weekPlan.note,
    });
  }

  return {
    week,
    dayId,
    title: day.title,
    focus: day.focus,
    mission: day.mission,
    normalMinutes: day.normalMinutes,
    exercises,
    omittedLineIds,
    rules: day.rules,
    winCondition: day.winCondition,
  };
}
