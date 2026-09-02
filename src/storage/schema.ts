import type { DBSchema } from "idb";
import type { DayId } from "../data/program";

/** IndexedDB database name and schema version. Bump DB_VERSION and extend db.ts's upgrade() to migrate. */
export const DB_NAME = "summit";
export const DB_VERSION = 1;

export type WorkoutStatus = "draft" | "complete" | "skipped";
export type SessionStatus = "Full" | "Reduced" | "Substitute" | "Recovery" | "Skipped";

/** One logged (or in-progress) training session. */
export interface WorkoutRecord {
  id: string;
  date: string; // YYYY-MM-DD
  week: number;
  dayId: DayId;
  status: WorkoutStatus;
  sessionStatus: SessionStatus | null;
  decisionReason: string | null;
  startedAt: string;
  finishedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type SetRole = "top" | "backoff" | "work" | "warmup";
export type SetType = "working" | "warmup" | "amrap" | "failure" | "drop";

/** One logged set row, tied to a workout and a program line. */
export interface SetRecord {
  id: string;
  workoutId: string;
  lineId: string;
  exerciseId: string;
  substituteExerciseId: string | null;
  setIndex: number;
  role: SetRole;
  setType: SetType;
  plannedLb: number | null;
  plannedReps: string;
  perHand: boolean;
  actualLb: number | null;
  actualReps: number | null;
  rpe: number | null;
  rir: number | null;
  completed: boolean;
  completedAt: string | null;
  note: string;
  updatedAt: string;
}

/** One daily readiness check-in. */
export interface CheckinRecord {
  date: string; // YYYY-MM-DD, primary key
  sleep: 1 | 2 | 3;
  soreness: 1 | 2 | 3;
  energy: 1 | 2 | 3;
  symptoms: boolean;
  note: string;
  createdAt: string;
}

/** One settings row. Typed known keys and defaults live in settings.ts. */
export interface SettingRecord {
  key: string;
  value: unknown;
}

export interface SummitDB extends DBSchema {
  settings: {
    key: string;
    value: SettingRecord;
  };
  workouts: {
    key: string;
    value: WorkoutRecord;
    indexes: { byDate: string; byStatus: string };
  };
  sets: {
    key: string;
    value: SetRecord;
    indexes: { byWorkout: string; byExercise: string; byLine: string };
  };
  checkins: {
    key: string;
    value: CheckinRecord;
  };
}
