import type { PlannedExercise, WarmupStep } from "../../engine/session";

export interface ExerciseSectionsProps {
  planned: PlannedExercise | null;
  video?: { url: string; publisher: string };
}

/** "45 x 15" from a resolved warm-up rung; falls back to the raw label when no numeric load resolved. */
function formatWarmupStep(step: WarmupStep): string {
  if (step.lb != null && step.reps) return `${step.lb} x ${step.reps}`;
  return step.label;
}

/** Closed-by-default collapsibles for an exercise's contextual material: never changes a prescription. */
export function ExerciseSections({ planned, video }: ExerciseSectionsProps) {
  if (!planned) return null;
  const notes = planned.weekNote ? [...planned.notes, planned.weekNote] : planned.notes;

  return (
    <div className="exercise-sections">
      {planned.warmup.length > 0 && (
        <details>
          <summary>Warm-up</summary>
          <ul>
            {planned.warmup.map((step, i) => (
              <li key={i}>{formatWarmupStep(step)}</li>
            ))}
          </ul>
        </details>
      )}

      {planned.cues.length > 0 && (
        <details>
          <summary>Cues</summary>
          <ul>
            {planned.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </details>
      )}

      {notes.length > 0 && (
        <details>
          <summary>Program notes</summary>
          <ul>
            {notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </details>
      )}

      {planned.backup && (
        <details>
          <summary>Backup</summary>
          <p>{planned.backup.substituteName}</p>
          <p className="muted">{planned.backup.rule}</p>
        </details>
      )}

      {video && (
        <p>
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            Video ({video.publisher})
          </a>
        </p>
      )}
    </div>
  );
}
