import { deleteDB, openDB } from "idb";
import type { IDBPDatabase } from "idb";
import { DB_NAME, DB_VERSION } from "./schema";
import type { SummitDB } from "./schema";

let dbPromise: Promise<IDBPDatabase<SummitDB>> | null = null;

function upgrade(database: IDBPDatabase<SummitDB>): void {
  if (!database.objectStoreNames.contains("settings")) {
    database.createObjectStore("settings", { keyPath: "key" });
  }
  if (!database.objectStoreNames.contains("workouts")) {
    const workouts = database.createObjectStore("workouts", { keyPath: "id" });
    workouts.createIndex("byDate", "date");
    workouts.createIndex("byStatus", "status");
  }
  if (!database.objectStoreNames.contains("sets")) {
    const sets = database.createObjectStore("sets", { keyPath: "id" });
    sets.createIndex("byWorkout", "workoutId");
    sets.createIndex("byExercise", "exerciseId");
    sets.createIndex("byLine", "lineId");
  }
  if (!database.objectStoreNames.contains("checkins")) {
    database.createObjectStore("checkins", { keyPath: "date" });
  }
}

/** Opens (or returns the cached) singleton connection to the summit IndexedDB database. */
export function openSummitDb(): Promise<IDBPDatabase<SummitDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SummitDB>(DB_NAME, DB_VERSION, { upgrade });
  }
  return dbPromise;
}

/** Test-only: closes the cached connection and deletes the database, so the next openSummitDb() starts fresh. */
export async function resetSummitDbForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await deleteDB(DB_NAME);
}
