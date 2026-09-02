import { useState } from "react";
import { EXERCISES, VIDEOS, exerciseName } from "../../data/program";
import { upsertSet } from "../../storage/workouts";
import type { SetRecord } from "../../storage/schema";
import { ExerciseSections } from "./ExerciseSections";
import { SetRow } from "./SetRow";
import { SWAP_REASONS, SwapSheet } from "./SwapSheet";
import type { SwapReason } from "./SwapSheet";
import type { ExerciseGroup } from "./types";

export interface ExercisePanelProps {
  group: ExerciseGroup;
  index: number;
  total: number;
  workoutId: string;
  effortInput: "rpe" | "rir";
  supersetPartnerName: string | null;
  lastTimePerformance: SetRecord[];
  onChanged: () => Promise<void> | void;
  onStartRest: (partnerName: string | null) => void;
  onOpenAllExercises: () => void;
  onOpenPlates: (targetLb: number) => void;
  onOpenHistory: () => void;
}

function parseSwapReason(note: string): string | null {
  return SWAP_REASONS.find((reason) => note.startsWith(`${reason}: `)) ?? null;
}

/** Seconds to a trimmed minutes label: 180 -> "3", 150 -> "2.5". */
function formatMinutes(seconds: number): string {
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

/** The current exercise's full detail: header, collapsibles, and every stored set row with its tools. */
export function ExercisePanel({
  group,
  index,
  total,
  workoutId,
  effortInput,
  supersetPartnerName,
  lastTimePerformance,
  onChanged,
  onStartRest,
  onOpenAllExercises,
  onOpenPlates,
  onOpenHistory,
}: ExercisePanelProps) {
  const [swapOpen, setSwapOpen] = useState(false);
  const name = group.planned?.name ?? exerciseName(group.exerciseId);
  const video = VIDEOS[group.exerciseId];
  const substitutedSet = group.sets.find((s) => s.substituteExerciseId != null);
  const equipment = EXERCISES[group.exerciseId]?.equipment;
  const showPlatesTap = equipment === "barbell" || equipment === "ez_bar";

  const lastTimeBySetIndex = new Map(lastTimePerformance.map((s) => [s.setIndex, s]));
  const rowByFullId = new Map((group.planned?.rows ?? []).map((row) => [`${workoutId}:${row.rowId}`, row]));

  async function handleAddSet() {
    const last = group.sets[group.sets.length - 1];
    const nextIndex = Math.max(...group.sets.map((s) => s.setIndex)) + 1;
    await upsertSet({
      id: crypto.randomUUID(),
      workoutId,
      lineId: group.lineId,
      exerciseId: group.exerciseId,
      substituteExerciseId: last?.substituteExerciseId ?? null,
      setIndex: nextIndex,
      role: "work",
      setType: "working",
      plannedLb: last?.plannedLb ?? null,
      plannedReps: last?.plannedReps ?? "",
      perHand: last?.perHand ?? false,
      actualLb: null,
      actualReps: null,
      rpe: null,
      rir: null,
      completed: false,
      completedAt: null,
      note: "",
    });
    await onChanged();
  }

  async function handleSwapConfirm(reason: SwapReason) {
    const backup = group.planned?.backup;
    if (!backup) return;
    for (const s of group.sets) {
      if (s.completed) continue;
      await upsertSet({ ...s, substituteExerciseId: backup.substituteId, note: `${reason}: ${s.note}`.replace(/: $/, "") });
    }
    setSwapOpen(false);
    await onChanged();
  }

  return (
    <div className="exercise-panel">
      <div className="exercise-panel-position">
        <span className="muted">
          {index + 1} of {total}
        </span>
        <button type="button" className="button-secondary button-compact" onClick={onOpenAllExercises}>
          All exercises
        </button>
      </div>

      <h2 className="exercise-panel-name">{name}</h2>
      {group.planned && (
        <p className="muted">
          Rest {formatMinutes(group.planned.restSeconds[0])}-{formatMinutes(group.planned.restSeconds[1])} min
          {supersetPartnerName && ` · Superset with ${supersetPartnerName}`}
        </p>
      )}
      {substitutedSet && substitutedSet.substituteExerciseId && (
        <p className="muted">
          Substitute: {exerciseName(substitutedSet.substituteExerciseId)}
          {parseSwapReason(substitutedSet.note) ? ` (${parseSwapReason(substitutedSet.note)})` : ""}
        </p>
      )}

      <div className="exercise-panel-tools">
        {group.planned?.backup && (
          <button type="button" className="button-secondary button-compact" onClick={() => setSwapOpen(true)}>
            Swap
          </button>
        )}
        <button type="button" className="button-secondary button-compact" onClick={onOpenHistory}>
          History
        </button>
      </div>

      <ExerciseSections planned={group.planned} video={video} />

      <div className="set-row-list">
        {group.sets.map((set, i) => (
          <SetRow
            roleOrdinal={group.sets.slice(0, i).filter((prior) => prior.role === set.role).length + 1}
            key={set.id}
            set={set}
            planRow={rowByFullId.get(set.id)}
            lastTimeSet={lastTimeBySetIndex.get(set.setIndex)}
            previousSet={i > 0 ? group.sets[i - 1] : undefined}
            effortInput={effortInput}
            showPlatesTap={showPlatesTap}
            onOpenPlates={onOpenPlates}
            onSetCompleted={() => onStartRest(supersetPartnerName)}
            onChanged={onChanged}
          />
        ))}
      </div>

      <button type="button" className="button-secondary" onClick={() => void handleAddSet()}>
        Add set
      </button>

      {swapOpen && group.planned?.backup && (
        <SwapSheet backup={group.planned.backup} onConfirm={(reason) => void handleSwapConfirm(reason)} onClose={() => setSwapOpen(false)} />
      )}
    </div>
  );
}
