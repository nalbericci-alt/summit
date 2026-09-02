import { e1rm } from "./loads";
import type { SetRecord } from "../storage/schema";

export interface PrResult {
  exerciseId: string;
  weightPr: boolean;
  repPr: boolean;
  e1rmPr: boolean;
}

/** A completed set that counts toward PR detection: setType "working" with a logged weight and reps. */
function workingCompleted(sets: SetRecord[]): SetRecord[] {
  return sets.filter((s) => s.completed && s.setType === "working" && s.actualLb != null && s.actualReps != null);
}

function groupByExercise(sets: SetRecord[]): Map<string, SetRecord[]> {
  const map = new Map<string, SetRecord[]>();
  for (const set of sets) {
    const list = map.get(set.exerciseId) ?? [];
    list.push(set);
    map.set(set.exerciseId, list);
  }
  return map;
}

/**
 * Detects weight, rep, and e1RM PRs for each exercise trained in `currentSets`, comparing against
 * `history`: the prior complete workouts' sets for that same exercise id (see storage/history.ts's
 * recentPerformances). Pure and read-only: it only compares logged numbers, never writes anything.
 *
 * - Weight PR: the top completed working weight this session beats every prior working weight.
 * - Rep PR: reps at that same top weight beat every prior rep count logged at that exact weight.
 *   (No PR when history never trained at exactly the new top weight - nothing to compare reps against.)
 * - e1RM PR: the best Epley estimate this session beats every prior estimate.
 *
 * Loads compare as logged: a dumbbell exercise's per-hand weight is compared as written, never doubled.
 * An exercise with no prior history returns all-false PRs - a first-ever session has nothing to beat.
 */
export function detectPrs(currentSets: SetRecord[], history: Record<string, SetRecord[]>): PrResult[] {
  const results: PrResult[] = [];
  for (const [exerciseId, sets] of groupByExercise(currentSets)) {
    const current = workingCompleted(sets);
    if (current.length === 0) continue;

    const prior = workingCompleted(history[exerciseId] ?? []);
    if (prior.length === 0) {
      results.push({ exerciseId, weightPr: false, repPr: false, e1rmPr: false });
      continue;
    }

    const topWeight = Math.max(...current.map((s) => s.actualLb as number));
    const priorMaxWeight = Math.max(...prior.map((s) => s.actualLb as number));
    const weightPr = topWeight > priorMaxWeight;

    const repsAtTopWeight = current.filter((s) => s.actualLb === topWeight).map((s) => s.actualReps as number);
    const priorRepsAtTopWeight = prior.filter((s) => s.actualLb === topWeight).map((s) => s.actualReps as number);
    const repPr = priorRepsAtTopWeight.length > 0 && Math.max(...repsAtTopWeight) > Math.max(...priorRepsAtTopWeight);

    const bestE1rm = Math.max(...current.map((s) => e1rm(s.actualLb as number, s.actualReps as number)));
    const priorBestE1rm = Math.max(...prior.map((s) => e1rm(s.actualLb as number, s.actualReps as number)));
    const e1rmPr = bestE1rm > priorBestE1rm;

    results.push({ exerciseId, weightPr, repPr, e1rmPr });
  }
  return results;
}
