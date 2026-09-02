import type { DayId } from "../data/program";
import type { LastEarned } from "../engine/loads";
import { openSummitDb } from "./db";
import type { SessionStatus, SetRecord, WorkoutRecord, WorkoutStatus } from "./schema";

export interface CreateWorkoutInput {
  date: string;
  week: number;
  dayId: DayId;
  status?: WorkoutStatus;
  sessionStatus?: SessionStatus | null;
  decisionReason?: string | null;
  notes?: string;
}

/** Creates and stores a new workout, defaulting to a fresh draft. */
export async function createWorkout(input: CreateWorkoutInput): Promise<WorkoutRecord> {
  const db = await openSummitDb();
  const now = new Date().toISOString();
  const record: WorkoutRecord = {
    id: crypto.randomUUID(),
    date: input.date,
    week: input.week,
    dayId: input.dayId,
    status: input.status ?? "draft",
    sessionStatus: input.sessionStatus ?? null,
    decisionReason: input.decisionReason ?? null,
    startedAt: now,
    finishedAt: null,
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await db.put("workouts", record);
  return record;
}

/** Reads one workout by id. */
export async function getWorkout(id: string): Promise<WorkoutRecord | undefined> {
  const db = await openSummitDb();
  return db.get("workouts", id);
}

export type WorkoutPatch = Partial<Omit<WorkoutRecord, "id" | "createdAt">>;

/** Applies a partial update to a workout and stamps updatedAt. Throws if the workout does not exist. */
export async function updateWorkout(id: string, patch: WorkoutPatch): Promise<WorkoutRecord> {
  const db = await openSummitDb();
  const existing = await db.get("workouts", id);
  if (!existing) throw new Error(`Unknown workout ${id}`);
  const updated: WorkoutRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.put("workouts", updated);
  return updated;
}

export interface ListWorkoutsOptions {
  limit?: number;
  status?: WorkoutStatus;
}

/** Lists workouts newest first (by date, then by creation time), optionally filtered and capped. */
export async function listWorkouts(options: ListWorkoutsOptions = {}): Promise<WorkoutRecord[]> {
  const db = await openSummitDb();
  let all = await db.getAll("workouts");
  if (options.status) all = all.filter((workout) => workout.status === options.status);
  all.sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : a.date < b.date ? 1 : -1));
  return options.limit != null ? all.slice(0, options.limit) : all;
}

/** Finds the in-progress draft workout for a date, if one exists. */
export async function findDraftForDate(date: string): Promise<WorkoutRecord | undefined> {
  const db = await openSummitDb();
  const byDate = await db.getAllFromIndex("workouts", "byDate", date);
  return byDate.find((workout) => workout.status === "draft");
}

export type SetInput = Omit<SetRecord, "updatedAt">;

/** Writes a set row, stamping updatedAt. Idempotent: a second call with the same id overwrites in place. */
export async function upsertSet(set: SetInput): Promise<SetRecord> {
  const db = await openSummitDb();
  const record: SetRecord = { ...set, updatedAt: new Date().toISOString() };
  await db.put("sets", record);
  return record;
}

/** Every set row for a workout, ordered by line and then set position. */
export async function setsForWorkout(workoutId: string): Promise<SetRecord[]> {
  const db = await openSummitDb();
  const sets = await db.getAllFromIndex("sets", "byWorkout", workoutId);
  return sets.sort((a, b) => (a.lineId === b.lineId ? a.setIndex - b.setIndex : a.lineId.localeCompare(b.lineId)));
}

export interface CompleteSetInput {
  actualLb: number | null;
  actualReps: number | null;
  rpe: number | null;
  rir: number | null;
}

/** Marks a set completed with its logged outcome. Throws if the set does not exist. */
export async function completeSet(setId: string, input: CompleteSetInput): Promise<SetRecord> {
  const db = await openSummitDb();
  const existing = await db.get("sets", setId);
  if (!existing) throw new Error(`Unknown set ${setId}`);
  const now = new Date().toISOString();
  const updated: SetRecord = {
    ...existing,
    actualLb: input.actualLb,
    actualReps: input.actualReps,
    rpe: input.rpe,
    rir: input.rir,
    completed: true,
    completedAt: now,
    updatedAt: now,
  };
  await db.put("sets", updated);
  return updated;
}

/**
 * The most recently completed non-warmup set on a line, across complete workouts only.
 * Used to seed the next week's "same as last" and "percent of last" load formulas.
 */
export async function lastEarnedForLine(lineId: string): Promise<LastEarned | undefined> {
  const db = await openSummitDb();
  const sets = await db.getAllFromIndex("sets", "byLine", lineId);
  const candidates = sets
    .filter((set): set is SetRecord & { actualLb: number; completedAt: string } => set.completed && set.role !== "warmup" && set.actualLb != null && set.completedAt != null)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  for (const candidate of candidates) {
    const workout = await db.get("workouts", candidate.workoutId);
    if (workout?.status === "complete") {
      return { lb: candidate.actualLb, perHand: candidate.perHand };
    }
  }
  return undefined;
}

/** The sets from the most recent complete workout that trained this exercise, for the "last time" column. */
export async function lastPerformance(exerciseId: string, beforeWorkoutId?: string): Promise<SetRecord[]> {
  const db = await openSummitDb();
  const exerciseSets = await db.getAllFromIndex("sets", "byExercise", exerciseId);
  const workoutIds = new Set(exerciseSets.map((set) => set.workoutId));
  const candidateWorkouts: WorkoutRecord[] = [];
  for (const workoutId of workoutIds) {
    if (workoutId === beforeWorkoutId) continue;
    const workout = await db.get("workouts", workoutId);
    if (workout && workout.status === "complete") candidateWorkouts.push(workout);
  }
  candidateWorkouts.sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : a.date < b.date ? 1 : -1));
  const mostRecent = candidateWorkouts[0];
  if (!mostRecent) return [];
  return exerciseSets.filter((set) => set.workoutId === mostRecent.id).sort((a, b) => a.setIndex - b.setIndex);
}

export interface WorkoutSummary {
  durationMin: number | null;
  tonnageLb: number;
  completedSets: number;
  plannedSets: number;
}

/** Duration, tonnage, and completion counts for a workout. Tonnage doubles per-hand loads (one bell in each hand). */
export async function workoutSummary(workoutId: string): Promise<WorkoutSummary> {
  const db = await openSummitDb();
  const workout = await db.get("workouts", workoutId);
  const sets = await setsForWorkout(workoutId);

  const durationMin =
    workout?.startedAt && workout.finishedAt
      ? Math.round((new Date(workout.finishedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000)
      : null;

  let tonnageLb = 0;
  let completedSets = 0;
  for (const set of sets) {
    if (set.completed) completedSets += 1;
    if (set.completed && set.role !== "warmup" && set.actualLb != null && set.actualReps != null) {
      tonnageLb += set.actualLb * set.actualReps * (set.perHand ? 2 : 1);
    }
  }

  return { durationMin, tonnageLb, completedSets, plannedSets: sets.length };
}
