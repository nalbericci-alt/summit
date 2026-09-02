import type { PlannedExercise } from "../../engine/session";
import type { SetRecord } from "../../storage/schema";

/**
 * One exercise line's stored sets, in setIndex order, joined with its resolved plan when the session
 * still lists this line this week. Stored sets are the source of truth for which rows exist; `planned`
 * only supplies presentational context (name, warm-up, cues, notes, backup, superset partner, rest).
 */
export interface ExerciseGroup {
  lineId: string;
  exerciseId: string;
  planned: PlannedExercise | null;
  sets: SetRecord[];
}
