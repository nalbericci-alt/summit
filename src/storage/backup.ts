import { openSummitDb } from "./db";
import type { CheckinRecord, SetRecord, WorkoutRecord } from "./schema";
import { getAllSettings, getSetting } from "./settings";
import type { SettingKey, SettingsMap } from "./settings";

export interface SummitBackup {
  app: "summit";
  version: 1;
  exportedAt: string;
  settings: SettingsMap;
  workouts: WorkoutRecord[];
  sets: SetRecord[];
  checkins: CheckinRecord[];
}

/** Snapshots every store into one portable JSON object, for the owner's own Back up / Restore. */
export async function exportBackup(): Promise<SummitBackup> {
  const db = await openSummitDb();
  const [settings, workouts, sets, checkins] = await Promise.all([
    getAllSettings(),
    db.getAll("workouts"),
    db.getAll("sets"),
    db.getAll("checkins"),
  ]);
  return { app: "summit", version: 1, exportedAt: new Date().toISOString(), settings, workouts, sets, checkins };
}

export type BackupPreview =
  | { ok: true; exportedAt: string; workoutCount: number; setCount: number; checkinCount: number }
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidWorkout(value: unknown): value is WorkoutRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.week === "number" &&
    typeof value.dayId === "string" &&
    typeof value.status === "string" &&
    typeof value.startedAt === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isValidSet(value: unknown): value is SetRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.workoutId === "string" &&
    typeof value.lineId === "string" &&
    typeof value.exerciseId === "string" &&
    typeof value.setIndex === "number" &&
    typeof value.role === "string" &&
    typeof value.setType === "string" &&
    typeof value.plannedReps === "string" &&
    typeof value.perHand === "boolean" &&
    typeof value.completed === "boolean" &&
    typeof value.updatedAt === "string"
  );
}

function isValidCheckin(value: unknown): value is CheckinRecord {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === "string" &&
    typeof value.sleep === "number" &&
    typeof value.soreness === "number" &&
    typeof value.energy === "number" &&
    typeof value.symptoms === "boolean" &&
    typeof value.createdAt === "string"
  );
}

/** Validates a backup's shape strictly, without touching storage. Never trust an unpreviewed file. */
export function previewBackup(json: unknown): BackupPreview {
  if (!isRecord(json)) return { ok: false, reason: "Not a JSON object" };
  if (json.app !== "summit") return { ok: false, reason: "Not a Summit backup (wrong app field)" };
  if (json.version !== 1) return { ok: false, reason: "Unsupported backup version" };
  if (typeof json.exportedAt !== "string") return { ok: false, reason: "Missing exportedAt" };
  if (!isRecord(json.settings)) return { ok: false, reason: "Missing settings object" };
  if (!Array.isArray(json.workouts)) return { ok: false, reason: "Missing workouts array" };
  if (!Array.isArray(json.sets)) return { ok: false, reason: "Missing sets array" };
  if (!Array.isArray(json.checkins)) return { ok: false, reason: "Missing checkins array" };
  for (const workout of json.workouts) if (!isValidWorkout(workout)) return { ok: false, reason: "Invalid workout record" };
  for (const set of json.sets) if (!isValidSet(set)) return { ok: false, reason: "Invalid set record" };
  for (const checkin of json.checkins) if (!isValidCheckin(checkin)) return { ok: false, reason: "Invalid checkin record" };
  return {
    ok: true,
    exportedAt: json.exportedAt,
    workoutCount: json.workouts.length,
    setCount: json.sets.length,
    checkinCount: json.checkins.length,
  };
}

/**
 * Replaces settings, workouts, sets, and checkins from a previewed-valid backup, in one transaction.
 * lastBackupAt is left untouched: importing is not itself a backup event.
 */
export async function importBackup(json: unknown): Promise<void> {
  const preview = previewBackup(json);
  if (!preview.ok) throw new Error(preview.reason);
  const backup = json as SummitBackup;

  const currentLastBackupAt = await getSetting("lastBackupAt");
  const db = await openSummitDb();
  const tx = db.transaction(["settings", "workouts", "sets", "checkins"], "readwrite");
  const settingsStore = tx.objectStore("settings");
  const workoutsStore = tx.objectStore("workouts");
  const setsStore = tx.objectStore("sets");
  const checkinsStore = tx.objectStore("checkins");

  await settingsStore.clear();
  await workoutsStore.clear();
  await setsStore.clear();
  await checkinsStore.clear();

  for (const key of Object.keys(backup.settings) as SettingKey[]) {
    if (key === "lastBackupAt") continue;
    await settingsStore.put({ key, value: backup.settings[key] });
  }
  // lastBackupAt is restored to its pre-import value, inside the same transaction: importing is not a backup event.
  await settingsStore.put({ key: "lastBackupAt", value: currentLastBackupAt });
  for (const workout of backup.workouts) await workoutsStore.put(workout);
  for (const set of backup.sets) await setsStore.put(set);
  for (const checkin of backup.checkins) await checkinsStore.put(checkin);

  await tx.done;
}
