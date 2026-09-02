import { useEffect, useState } from "react";
import { useSummit } from "../app/state";
import { dayById, exerciseName } from "../data/program";
import { buildSession } from "../engine/session";
import { getWorkout, setsForWorkout } from "../storage/workouts";
import type { SetRecord, WorkoutRecord } from "../storage/schema";

export interface WorkoutScreenProps {
  workoutId: string;
}

function loadLabel(set: SetRecord): string {
  if (set.plannedLb == null) return "-";
  return set.perHand ? `${set.plannedLb}s` : String(set.plannedLb);
}

/**
 * Read-only placeholder for #/workout/<id>. Shows exactly what was planned and saved when the
 * workout was created, in program order. A later build replaces this with interactive logging.
 */
export function WorkoutScreen({ workoutId }: WorkoutScreenProps) {
  const { settings } = useSummit();
  const [workout, setWorkout] = useState<WorkoutRecord | null | undefined>(undefined);
  const [sets, setSets] = useState<SetRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const w = (await getWorkout(workoutId)) ?? null;
      const s = w ? await setsForWorkout(workoutId) : [];
      if (!cancelled) {
        setWorkout(w);
        setSets(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workoutId]);

  if (workout === undefined) {
    return (
      <section className="content">
        <p className="muted">Loading...</p>
      </section>
    );
  }

  if (workout === null) {
    return (
      <section className="content">
        <h1>Workout not found</h1>
        <a className="button-secondary" href="#/today">
          Back to Today
        </a>
      </section>
    );
  }

  const day = dayById(workout.dayId);
  const session = day.kind === "lifting" ? buildSession(workout.week, workout.dayId, settings.baselines, {}) : null;

  const setsByLine = new Map<string, SetRecord[]>();
  for (const set of sets) {
    const line = setsByLine.get(set.lineId) ?? [];
    line.push(set);
    setsByLine.set(set.lineId, line);
  }

  const orderedLineIds = session ? session.exercises.map((exercise) => exercise.lineId) : [...setsByLine.keys()];

  return (
    <section className="content">
      <h1>{day.title}</h1>
      <p className="muted">Interactive workout mode arrives in the next build. Nothing here is lost.</p>

      {orderedLineIds.map((lineId) => {
        const lineSets = (setsByLine.get(lineId) ?? []).sort((a, b) => a.setIndex - b.setIndex);
        if (lineSets.length === 0) return null;
        return (
          <div className="card" key={lineId}>
            <h2>{exerciseName(lineSets[0].exerciseId)}</h2>
            <ul>
              {lineSets.map((set) => (
                <li key={set.id}>
                  Set {set.setIndex} · {loadLabel(set)} x {set.plannedReps}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <a className="button-secondary" href="#/today">
        Back to Today
      </a>
    </section>
  );
}
