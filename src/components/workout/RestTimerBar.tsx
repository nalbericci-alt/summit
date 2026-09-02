import { formatRemaining } from "../../engine/restTimer";
import type { RestTimerState } from "./useRestTimer";

export interface RestTimerBarProps {
  timer: RestTimerState;
}

function endsAtLabel(endAt: number): string {
  return new Date(endAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Sticky bar above the control bar while a rest countdown is active or has just finished. Remaining
 * time and the clock time it ends are both derived straight from the timer's absolute end timestamp.
 */
export function RestTimerBar({ timer }: RestTimerBarProps) {
  if (timer.endAt == null) return null;

  return (
    <div className="rest-bar" role="status">
      <div className="rest-bar-info">
        <span className="rest-bar-time">{timer.isOver ? "Rest over" : formatRemaining(timer.remainingMs ?? 0)}</span>
        <span className="muted rest-bar-detail">
          {!timer.isOver && `ends ${endsAtLabel(timer.endAt)}`}
          {timer.supersetPartner && `${timer.isOver ? "" : " · "}then ${timer.supersetPartner}`}
        </span>
      </div>
      <div className="rest-bar-actions">
        <button type="button" className="button-secondary button-compact" onClick={() => timer.addSeconds(30)}>
          +30 s
        </button>
        <button type="button" className="button-secondary button-compact" onClick={timer.skip}>
          Skip
        </button>
      </div>
    </div>
  );
}
