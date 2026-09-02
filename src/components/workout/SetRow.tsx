import { useState } from "react";
import type { PlannedRow } from "../../engine/session";
import { completeSet, upsertSet } from "../../storage/workouts";
import type { SetRecord, SetType } from "../../storage/schema";

const SET_TYPE_CYCLE: SetType[] = ["working", "warmup", "amrap", "failure", "drop"];
const SET_TYPE_LABEL: Record<SetType, string> = {
  working: "Work",
  warmup: "Warm-up",
  amrap: "AMRAP",
  failure: "Failure",
  drop: "Drop",
};
const ROLE_LABEL: Record<string, string> = { top: "Top", backoff: "Back-off" };

export interface SetRowProps {
  set: SetRecord;
  /** 1-based position among rows that share this row's role, so back-offs read 1, 2, 3. */
  roleOrdinal: number;
  planRow: PlannedRow | undefined;
  lastTimeSet: SetRecord | undefined;
  previousSet: SetRecord | undefined;
  effortInput: "rpe" | "rir";
  showPlatesTap: boolean;
  onOpenPlates: (targetLb: number) => void;
  onSetCompleted: () => void;
  onChanged: () => Promise<void> | void;
}

function firstInt(text: string): number | null {
  const match = /\d+/.exec(text);
  return match ? Number(match[0]) : null;
}

/** "255 x 3", "55s x 8", "+1 pin x 10": the numeric plannedLb when there is one, else the plan's own label. */
function targetLabel(set: SetRecord, planRow: PlannedRow | undefined): string {
  const reps = set.plannedReps || planRow?.reps || "";
  if (set.plannedLb != null) {
    const load = set.perHand ? `${set.plannedLb}s` : String(set.plannedLb);
    return reps ? `${load} x ${reps}` : load;
  }
  if (planRow?.load.label) return reps ? `${planRow.load.label} x ${reps}` : planRow.load.label;
  return reps ? `x ${reps}` : "-";
}

function formatPerformed(set: SetRecord | undefined, effortInput: "rpe" | "rir"): string {
  if (!set || set.actualLb == null || set.actualReps == null) return "-";
  const load = set.perHand ? `${set.actualLb}s` : String(set.actualLb);
  const effortValue = effortInput === "rpe" ? set.rpe : set.rir;
  const effortLabel = effortValue == null ? "" : effortInput === "rpe" ? ` @ ${effortValue}` : ` @ ${effortValue} RIR`;
  return `${load} x ${set.actualReps}${effortLabel}`;
}

/** One completable set row: role, last time, target, live inputs, and its per-row tools. */
export function SetRow({
  set,
  roleOrdinal,
  planRow,
  lastTimeSet,
  previousSet,
  effortInput,
  showPlatesTap,
  onOpenPlates,
  onSetCompleted,
  onChanged,
}: SetRowProps) {
  // Initialized once from the record (prefilled from the plan when nothing is logged yet) and never
  // reset by later prop changes, so other rows re-rendering after a save does not clobber this one's
  // in-progress typing.
  const [weight, setWeight] = useState(() => String(set.actualLb ?? set.plannedLb ?? ""));
  const [reps, setReps] = useState(() => String(set.actualReps ?? firstInt(set.plannedReps) ?? ""));
  const [effort, setEffort] = useState(() => {
    const value = effortInput === "rpe" ? set.rpe : set.rir;
    return value == null ? "" : String(value);
  });

  async function handleComplete() {
    const actualLb = weight.trim() === "" ? null : Number(weight);
    const actualReps = reps.trim() === "" ? null : Number(reps);
    const effortValue = effort.trim() === "" ? null : Number(effort);
    await completeSet(set.id, {
      actualLb,
      actualReps,
      rpe: effortInput === "rpe" ? effortValue : null,
      rir: effortInput === "rir" ? effortValue : null,
    });
    onSetCompleted();
    await onChanged();
  }

  async function handleUndo() {
    // Writes completed back to false without touching the logged actuals, per spec.
    await upsertSet({ ...set, completed: false, completedAt: null });
    await onChanged();
  }

  function handleCopyLast() {
    if (!previousSet) return;
    if (previousSet.actualLb != null) setWeight(String(previousSet.actualLb));
    if (previousSet.actualReps != null) setReps(String(previousSet.actualReps));
    const value = effortInput === "rpe" ? previousSet.rpe : previousSet.rir;
    if (value != null) setEffort(String(value));
  }

  async function handleCycleSetType() {
    const nextIdx = (SET_TYPE_CYCLE.indexOf(set.setType) + 1) % SET_TYPE_CYCLE.length;
    await upsertSet({ ...set, setType: SET_TYPE_CYCLE[nextIdx] });
    await onChanged();
  }

  const roleLabel = ROLE_LABEL[set.role] ?? "Set";
  const canTapPlates = showPlatesTap && set.plannedLb != null;

  return (
    <div className={set.completed ? "set-row set-row-completed" : "set-row"}>
      <div className="set-row-head">
        <span className="set-row-role">
          {roleLabel} {roleOrdinal}
          {planRow?.optional && <span className="tag">optional</span>}
        </span>
        <button type="button" className="chip" onClick={() => void handleCycleSetType()}>
          {SET_TYPE_LABEL[set.setType]}
        </button>
      </div>

      <div className="set-row-meta">
        <span className="muted">Last time: {formatPerformed(lastTimeSet, effortInput)}</span>
        <button
          type="button"
          className={canTapPlates ? "set-row-target set-row-target-tap" : "set-row-target"}
          disabled={!canTapPlates}
          onClick={() => set.plannedLb != null && onOpenPlates(set.plannedLb)}
        >
          Target: {targetLabel(set, planRow)}
        </button>
      </div>

      <div className="set-row-inputs">
        <label className="field">
          <span>Weight</span>
          <input type="number" inputMode="decimal" step={2.5} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          <span>Reps</span>
          <input type="number" inputMode="numeric" step={1} value={reps} onChange={(e) => setReps(e.target.value)} />
        </label>
        <label className="field">
          <span>{effortInput === "rpe" ? "RPE" : "RIR"}</span>
          <input
            type="number"
            inputMode="decimal"
            step={effortInput === "rpe" ? 0.5 : 1}
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          />
        </label>
      </div>

      <div className="set-row-actions">
        <button type="button" className="button-secondary button-compact" onClick={handleCopyLast} disabled={!previousSet}>
          Copy last
        </button>
        <button
          type="button"
          className={set.completed ? "set-complete-button set-complete-button-done" : "set-complete-button"}
          aria-label={set.completed ? "Undo" : "Complete set"}
          onClick={() => void (set.completed ? handleUndo() : handleComplete())}
        >
          {set.completed ? "✓" : "Complete"}
        </button>
      </div>
    </div>
  );
}
