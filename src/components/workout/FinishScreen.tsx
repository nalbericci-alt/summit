import { useEffect, useState } from "react";
import { exerciseName, liftingDays } from "../../data/program";
import type { DayId } from "../../data/program";
import { detectPrs } from "../../engine/prs";
import type { PrResult } from "../../engine/prs";
import { recentPerformances } from "../../storage/history";
import { updateWorkout, workoutSummary } from "../../storage/workouts";
import type { WorkoutSummary } from "../../storage/workouts";
import type { SessionStatus, SetRecord, WorkoutRecord } from "../../storage/schema";

const STATUS_OPTIONS: SessionStatus[] = ["Full", "Reduced", "Substitute", "Recovery", "Skipped"];

export interface FinishScreenProps {
  workout: WorkoutRecord;
  sets: SetRecord[];
  onBack: () => void;
  onSaved: () => void;
}

function defaultStatus(sets: SetRecord[]): SessionStatus {
  if (sets.some((s) => s.substituteExerciseId != null)) return "Substitute";
  const working = sets.filter((s) => s.setType === "working");
  if (working.length > 0 && working.every((s) => s.completed)) return "Full";
  return "Reduced";
}

/** The next lifting day after `dayId` in program order. Sunday wraps to next week's Monday. */
function nextUp(dayId: DayId, week: number): { title: string; focus: string; week: number } | null {
  const days = liftingDays();
  const idx = days.findIndex((d) => d.id === dayId);
  if (idx === -1) return null;
  const wrapsToNextWeek = idx === days.length - 1;
  const next = days[(idx + 1) % days.length];
  const nextWeek = wrapsToNextWeek ? week + 1 : week;
  if (nextWeek > 12) return null;
  return { title: next.title, focus: next.focus, week: nextWeek };
}

/** Duration, tonnage, PRs, session status, notes, and a preview of the next session. */
export function FinishScreen({ workout, sets, onBack, onSaved }: FinishScreenProps) {
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [prs, setPrs] = useState<PrResult[]>([]);
  const [status, setStatus] = useState<SessionStatus>(() => defaultStatus(sets));
  const [why, setWhy] = useState(workout.decisionReason ?? "");
  const [notes, setNotes] = useState(workout.notes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void workoutSummary(workout.id).then(setSummary);
  }, [workout.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const exerciseIds = Array.from(new Set(sets.map((s) => s.exerciseId)));
      const history: Record<string, SetRecord[]> = {};
      for (const exerciseId of exerciseIds) {
        const performances = await recentPerformances(exerciseId, 50, workout.id);
        history[exerciseId] = performances.flatMap((p) => p.sets);
      }
      if (!cancelled) setPrs(detectPrs(sets, history));
    })();
    return () => {
      cancelled = true;
    };
  }, [sets, workout.id]);

  async function save() {
    setSaving(true);
    try {
      await updateWorkout(workout.id, {
        status: "complete",
        sessionStatus: status,
        decisionReason: status === "Full" ? null : why,
        notes,
        finishedAt: new Date().toISOString(),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const next = nextUp(workout.dayId, workout.week);
  const prBadges = prs.filter((pr) => pr.weightPr || pr.repPr || pr.e1rmPr);
  const canSave = status === "Full" || why.trim() !== "";

  return (
    <section className="content">
      <h1>Finish workout</h1>

      {summary && (
        <div className="card">
          <p>{`${summary.durationMin ?? Math.max(1, Math.round((Date.now() - new Date(workout.startedAt).getTime()) / 60000))} min`}</p>
          <p>{summary.tonnageLb.toLocaleString()} lb moved</p>
          <p className="muted">
            {summary.completedSets} of {summary.plannedSets} sets completed
          </p>
        </div>
      )}

      {prBadges.length > 0 && (
        <div className="card">
          <h2>PRs</h2>
          {prBadges.map((pr) => (
            <div className="row" key={pr.exerciseId}>
              <span>{exerciseName(pr.exerciseId)}</span>
              <span className="pr-badges">
                {pr.weightPr && <span className="tag">Weight PR</span>}
                {pr.repPr && <span className="tag">Rep PR</span>}
                {pr.e1rmPr && <span className="tag">e1RM PR</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h2>Session status</h2>
        <div className="segmented wrap" role="group" aria-label="Session status">
          {STATUS_OPTIONS.map((option) => (
            <button key={option} type="button" aria-pressed={status === option} onClick={() => setStatus(option)}>
              {option}
            </button>
          ))}
        </div>
        {status !== "Full" && (
          <div className="field">
            <label htmlFor="finish-why">Why</label>
            <input id="finish-why" type="text" value={why} onChange={(e) => setWhy(e.target.value)} required />
          </div>
        )}
        <div className="field">
          <label htmlFor="finish-notes">Notes</label>
          <textarea id="finish-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          <p className="muted">Tap the keyboard mic to dictate.</p>
        </div>
      </div>

      <div className="card">
        <h2>Next up</h2>
        {next ? (
          <>
            <p>
              Week {next.week} · {next.title}
            </p>
            <p className="muted">{next.focus}</p>
          </>
        ) : (
          <p>Cycle complete after this week.</p>
        )}
      </div>

      <button type="button" className="button-primary" onClick={() => void save()} disabled={saving || !canSave}>
        {saving ? "Saving..." : "Save workout"}
      </button>
      <button type="button" className="button-secondary" onClick={onBack}>
        Back to workout
      </button>
    </section>
  );
}
