import { useEffect, useState } from "react";

export interface WorkoutTopBarProps {
  title: string;
  startedAt: string;
  normalMinutes: [number, number];
  onExit: () => void;
  onFinish: () => void;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * The workout-mode top bar: day title, a session clock ticking every second against the planned
 * range, Exit (keeps the draft, returns to Today), and Finish (opens the finish flow).
 */
export function WorkoutTopBar({ title, startedAt, normalMinutes, onExit, onFinish }: WorkoutTopBarProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsedMs = now - new Date(startedAt).getTime();
  const overTime = elapsedMs > normalMinutes[1] * 60000;

  return (
    <header className="workout-top-bar">
      <button type="button" className="button-secondary button-compact" onClick={onExit}>
        Exit
      </button>
      <div className="workout-top-bar-title">
        <h1>{title}</h1>
        <p className="mono workout-clock">
          {formatClock(elapsedMs)} <span className="muted">of {normalMinutes[0]}-{normalMinutes[1]} min</span>
        </p>
        {overTime && <p className="muted workout-over-time">Over time</p>}
      </div>
      <button type="button" className="button-primary button-compact" onClick={onFinish}>
        Finish
      </button>
    </header>
  );
}
