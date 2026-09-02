import { openSummitDb } from "./db";
import type { CheckinRecord } from "./schema";

/** Reads one day's check-in by its YYYY-MM-DD date key, if one was saved. */
export async function getCheckin(date: string): Promise<CheckinRecord | undefined> {
  const db = await openSummitDb();
  return db.get("checkins", date);
}

/** Writes (or overwrites) one day's check-in. Idempotent: a second call for the same date replaces it. */
export async function saveCheckin(record: CheckinRecord): Promise<CheckinRecord> {
  const db = await openSummitDb();
  await db.put("checkins", record);
  return record;
}

/** The most recent check-ins, newest date first, capped at limit. */
export async function recentCheckins(limit: number): Promise<CheckinRecord[]> {
  const db = await openSummitDb();
  const all = await db.getAll("checkins");
  all.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  return all.slice(0, limit);
}
