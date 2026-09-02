import { EXERCISES } from "../data/program";
import type { RestDefaults } from "../storage/settings";

/**
 * The rest countdown, in seconds, for one exercise: the plan's own rest range floor when the plan
 * has one, otherwise the owner's main-lift or accessory default (settings.restDefaults), chosen by
 * whether the exercise carries a main-lift identity (bench, squat, deadlift) in the program data.
 */
export function restDurationFor(exerciseId: string, restSeconds: [number, number] | undefined, restDefaults: RestDefaults): number {
  if (restSeconds != null && restSeconds[0] != null) return restSeconds[0];
  const isMainLift = EXERCISES[exerciseId]?.mainLift != null;
  return isMainLift ? restDefaults.mainLift : restDefaults.accessory;
}

/** Formats milliseconds remaining as mm:ss, clamped to zero. Rounds up so the display never reads 0:00 early. */
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
