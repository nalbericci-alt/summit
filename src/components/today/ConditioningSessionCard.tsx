import { BASE_CARDIO, RUN_WALK, SATURDAY } from "../../data/program";
import type { ConditioningDay } from "../../data/program";

export interface ConditioningSessionCardProps {
  day: ConditioningDay;
  week: number;
}

function TuesdayRow({ week }: { week: number }) {
  const run = RUN_WALK[week - 1];
  const base = BASE_CARDIO[week - 1];
  return (
    <div className="card">
      <p>
        Run-walk: {run.rounds} rounds · jog {run.jogRule} · {run.walkRule}
      </p>
      <p className="muted">{run.purpose}</p>
      <p>
        Base cardio: {base.minutes} in the {base.band} bpm band
      </p>
    </div>
  );
}

function SaturdayRow({ week }: { week: number }) {
  const sat = SATURDAY[week - 1];
  return (
    <div className="card">
      <p>Hike or long walk: {sat.hikeOrLongWalk}</p>
      <p>StairMaster: {sat.stairmaster}</p>
      <p className="muted">Optional second run: {sat.optionalSecondRun}</p>
    </div>
  );
}

/** The Today card for Tuesday, Thursday, and Saturday: mission, steps or this week's row, and a disabled log button. */
export function ConditioningSessionCard({ day, week }: ConditioningSessionCardProps) {
  return (
    <div className="card">
      <h2>{day.title}</h2>
      <p className="muted">{day.focus}</p>
      <p>{day.mission}</p>

      {day.id === "tuesday" && <TuesdayRow week={week} />}
      {day.id === "saturday" && <SaturdayRow week={week} />}
      {day.id === "thursday" && (
        <ol>
          {day.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}

      <button type="button" className="button-secondary" disabled>
        Log conditioning
      </button>
      <p className="muted">Conditioning logging arrives in Phase 3.</p>
    </div>
  );
}
