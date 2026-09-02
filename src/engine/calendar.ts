import { WEEKS, dayById } from "../data/program";
import type { DayId, ProgramDay, WeekMeta } from "../data/program";

const DAY_IDS: DayId[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/** Maps a Date's local weekday to a Monday-first DayId (JS getDay is Sunday-first). */
export function dayIdForDate(date: Date): DayId {
  const jsDay = date.getDay();
  const mondayFirst = (jsDay + 6) % 7;
  return DAY_IDS[mondayFirst];
}

/** Parses a YYYY-MM-DD string into UTC milliseconds at midnight, for DST-safe date-only math. */
function utcMsFromIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** UTC milliseconds at midnight for a Date's local calendar day, for DST-safe date-only math. */
function utcMsFromLocalDate(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function isoFromUtcMs(utcMs: number): string {
  const d = new Date(utcMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Which 1-12 program week a date falls in for a Monday cycleStart, or null before or after the 12-week span. */
export function cycleWeekForDate(date: Date, cycleStartISO: string): number | null {
  const diffDays = Math.round((utcMsFromLocalDate(date) - utcMsFromIso(cycleStartISO)) / MS_PER_DAY);
  if (diffDays < 0) return null;
  const week = Math.floor(diffDays / 7) + 1;
  return week > 12 ? null : week;
}

/** ISO Monday start and Sunday end dates for a 1-12 program week, given the cycle start. */
export function weekDates(week: number, cycleStartISO: string): { start: string; end: string } {
  const startUtc = utcMsFromIso(cycleStartISO) + (week - 1) * 7 * MS_PER_DAY;
  const endUtc = startUtc + 6 * MS_PER_DAY;
  return { start: isoFromUtcMs(startUtc), end: isoFromUtcMs(endUtc) };
}

/** The full plan context for a date: resolved week (or null outside the cycle), weekday, day data, and week metadata. */
export function todayPlan(
  date: Date,
  cycleStartISO: string,
): { week: number | null; dayId: DayId; day: ProgramDay; weekMeta: WeekMeta | null } {
  const dayId = dayIdForDate(date);
  const week = cycleWeekForDate(date, cycleStartISO);
  const day = dayById(dayId);
  const weekMeta = week != null ? (WEEKS.find((w) => w.week === week) ?? null) : null;
  return { week, dayId, day, weekMeta };
}
