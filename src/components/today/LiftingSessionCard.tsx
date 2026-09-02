import type { LiftingDay } from "../../data/program";

export interface LiftingSessionCardProps {
  day: LiftingDay;
  exerciseCount: number;
  hasDraft: boolean;
  busy: boolean;
  onStart: () => void;
}

/** The Today hero card for a lifting day: name, focus, mission, estimate, and the one primary action. */
export function LiftingSessionCard({ day, exerciseCount, hasDraft, busy, onStart }: LiftingSessionCardProps) {
  return (
    <div className="hero">
      <h2 className="hero-title">{day.title}</h2>
      <p className="muted">{day.focus}</p>
      <p>{day.mission}</p>
      <p className="muted">
        About {day.normalMinutes[0]}-{day.normalMinutes[1]} min · {exerciseCount} exercises
      </p>
      <button type="button" className="button-primary" onClick={onStart} disabled={busy}>
        {busy ? "Starting..." : hasDraft ? "Resume workout" : "Start workout"}
      </button>
    </div>
  );
}
