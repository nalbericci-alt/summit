import { useCallback, useEffect, useState } from "react";
import { dayById } from "../../data/program";
import { buildSession } from "../../engine/session";
import type { SessionPlan } from "../../engine/session";
import type { LastEarned } from "../../engine/loads";
import { getWorkout, lastEarnedForLine, setsForWorkout } from "../../storage/workouts";
import type { SetRecord, WorkoutRecord } from "../../storage/schema";
import type { BaselineSettings } from "../../storage/settings";
import type { ExerciseGroup } from "./types";

export interface WorkoutData {
  /** undefined while loading, null when the id does not resolve to a stored workout. */
  workout: WorkoutRecord | null | undefined;
  sets: SetRecord[];
  session: SessionPlan | null;
  groups: ExerciseGroup[];
  reload: () => Promise<void>;
}

function groupSetsByLine(sets: SetRecord[], session: SessionPlan | null): ExerciseGroup[] {
  const byLine = new Map<string, SetRecord[]>();
  for (const set of sets) {
    const list = byLine.get(set.lineId) ?? [];
    list.push(set);
    byLine.set(set.lineId, list);
  }

  const orderedLineIds = session ? session.exercises.map((exercise) => exercise.lineId) : [];
  for (const lineId of byLine.keys()) {
    if (!orderedLineIds.includes(lineId)) orderedLineIds.push(lineId);
  }

  const plannedByLine = new Map((session?.exercises ?? []).map((exercise) => [exercise.lineId, exercise]));

  const groups: ExerciseGroup[] = [];
  for (const lineId of orderedLineIds) {
    const lineSets = (byLine.get(lineId) ?? []).slice().sort((a, b) => a.setIndex - b.setIndex);
    if (lineSets.length === 0) continue;
    groups.push({
      lineId,
      exerciseId: lineSets[0].exerciseId,
      planned: plannedByLine.get(lineId) ?? null,
      sets: lineSets,
    });
  }
  return groups;
}

/**
 * Loads a workout, its stored sets, and the resolved session plan for workout mode, and groups the
 * sets by exercise line in session order (falling back to plan-order-then-appended for any line the
 * plan no longer lists). Call `reload()` after any write so every screen reading this data stays current.
 */
export function useWorkoutData(workoutId: string, baselines: BaselineSettings): WorkoutData {
  const [workout, setWorkout] = useState<WorkoutRecord | null | undefined>(undefined);
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [session, setSession] = useState<SessionPlan | null>(null);

  const reload = useCallback(async () => {
    const w = (await getWorkout(workoutId)) ?? null;
    setWorkout(w);
    if (!w) {
      setSets([]);
      setSession(null);
      return;
    }

    const day = dayById(w.dayId);
    let nextSession: SessionPlan | null = null;
    if (day.kind === "lifting") {
      const lastEarnedByLine: Record<string, LastEarned> = {};
      for (const line of day.lines) {
        const earned = await lastEarnedForLine(line.lineId);
        if (earned) lastEarnedByLine[line.lineId] = earned;
      }
      nextSession = buildSession(w.week, w.dayId, baselines, lastEarnedByLine);
    }
    setSession(nextSession);
    setSets(await setsForWorkout(workoutId));
  }, [workoutId, baselines.S, baselines.D]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const groups = groupSetsByLine(sets, session);

  return { workout, sets, session, groups, reload };
}
