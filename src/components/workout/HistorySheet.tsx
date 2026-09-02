import { e1rm } from "../../engine/loads";
import type { ExercisePerformance } from "../../storage/history";
import type { SetRecord } from "../../storage/schema";
import { Sheet } from "./Sheet";

export interface HistorySheetProps {
  exerciseName: string;
  performances: ExercisePerformance[];
  effortInput: "rpe" | "rir";
  onClose: () => void;
}

function formatSet(set: SetRecord, effortInput: "rpe" | "rir"): string {
  if (set.actualLb == null || set.actualReps == null) return "-";
  const load = set.perHand ? `${set.actualLb}s` : String(set.actualLb);
  const effortValue = effortInput === "rpe" ? set.rpe : set.rir;
  const effortLabel = effortValue == null ? "" : effortInput === "rpe" ? ` @ ${effortValue}` : ` @ ${effortValue} RIR`;
  return `${load} x ${set.actualReps}${effortLabel}`;
}

/** The best Epley estimate among a workout's completed, non-warm-up sets, rounded to the nearest 1 lb. */
function bestE1rm(sets: SetRecord[]): number | null {
  const working = sets.filter(
    (s): s is SetRecord & { actualLb: number; actualReps: number } =>
      s.completed && s.role !== "warmup" && s.actualLb != null && s.actualReps != null,
  );
  if (working.length === 0) return null;
  return Math.round(Math.max(...working.map((s) => e1rm(s.actualLb, s.actualReps))));
}

/** The last five complete workouts that trained this exercise, newest first, without leaving workout mode. */
export function HistorySheet({ exerciseName, performances, effortInput, onClose }: HistorySheetProps) {
  return (
    <Sheet title={`History: ${exerciseName}`} onClose={onClose}>
      {performances.length === 0 && <p className="muted">No completed workouts yet for this exercise.</p>}
      {performances.map(({ workout, sets }) => {
        const completedSets = sets.filter((s) => s.completed);
        const best = bestE1rm(sets);
        return (
          <div className="card" key={workout.id}>
            <p>
              <strong>{workout.date}</strong>
            </p>
            <ul>
              {completedSets.map((s) => (
                <li key={s.id}>{formatSet(s, effortInput)}</li>
              ))}
            </ul>
            {best != null && <p className="muted">Best e1RM: {best} lb</p>}
          </div>
        );
      })}
    </Sheet>
  );
}
