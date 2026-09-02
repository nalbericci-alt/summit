import { openSummitDb } from "./db";
import type { SetRecord, WorkoutRecord } from "./schema";

export interface ExercisePerformance {
  workout: WorkoutRecord;
  sets: SetRecord[];
}

/**
 * The last `limit` complete workouts that trained this exercise id, newest first, each paired with
 * that workout's sets for the exercise (sorted by setIndex). Used by the workout-mode history sheet
 * and by PR detection at finish time. Draft and skipped workouts never count, and `excludeWorkoutId`
 * (typically the workout currently being logged) is left out even if it happens to be complete.
 */
export async function recentPerformances(
  exerciseId: string,
  limit: number,
  excludeWorkoutId?: string,
): Promise<ExercisePerformance[]> {
  const db = await openSummitDb();
  const exerciseSets = await db.getAllFromIndex("sets", "byExercise", exerciseId);
  const workoutIds = new Set(exerciseSets.map((set) => set.workoutId));

  const candidates: WorkoutRecord[] = [];
  for (const workoutId of workoutIds) {
    if (workoutId === excludeWorkoutId) continue;
    const workout = await db.get("workouts", workoutId);
    if (workout && workout.status === "complete") candidates.push(workout);
  }
  candidates.sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : a.date < b.date ? 1 : -1));

  const top = candidates.slice(0, limit);
  return top.map((workout) => ({
    workout,
    sets: exerciseSets.filter((set) => set.workoutId === workout.id).sort((a, b) => a.setIndex - b.setIndex),
  }));
}
