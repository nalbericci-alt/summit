import { useState } from "react";
import { useSummit } from "../../app/state";
import { formatMonthDay, isMonday, localIsoDate } from "../../app/dates";
import { cycleWeekForDate } from "../../engine/calendar";

function weekReadout(cycleStart: string): string {
  const week = cycleWeekForDate(new Date(), cycleStart);
  if (week != null) return `Week ${week} of 12`;
  return localIsoDate(new Date()) < cycleStart ? `Starts ${formatMonthDay(cycleStart)}` : "Cycle complete";
}

/** Cycle start date (Monday-only), the current-week readout, and the S/D working baselines. */
export function ProgramCard() {
  const { settings, updateSetting } = useSummit();
  const [cycleStartInput, setCycleStartInput] = useState(settings.cycleStart);
  const [cycleStartError, setCycleStartError] = useState<string | null>(null);
  const [baselineS, setBaselineS] = useState(String(settings.baselines.S));
  const [baselineD, setBaselineD] = useState(String(settings.baselines.D));

  function handleCycleStartChange(value: string) {
    setCycleStartInput(value);
    if (!value) {
      setCycleStartError(null);
      return;
    }
    if (!isMonday(value)) {
      setCycleStartError("Pick a Monday. The 12-week cycle always starts on one.");
      return;
    }
    setCycleStartError(null);
    void updateSetting("cycleStart", value);
  }

  function commitBaseline(key: "S" | "D", raw: string) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return;
    void updateSetting("baselines", { ...settings.baselines, [key]: n });
  }

  return (
    <div className="card">
      <h2>Program</h2>

      <label className="field">
        Cycle start
        <input type="date" value={cycleStartInput} onChange={(e) => handleCycleStartChange(e.target.value)} />
      </label>
      {cycleStartError && <p className="error">{cycleStartError}</p>}
      <p className="muted">{weekReadout(settings.cycleStart)}</p>

      <label className="field">
        S (squat baseline, lb)
        <input
          type="number"
          step={5}
          value={baselineS}
          onChange={(e) => setBaselineS(e.target.value)}
          onBlur={() => commitBaseline("S", baselineS)}
        />
      </label>
      <label className="field">
        D (deadlift baseline, lb)
        <input
          type="number"
          step={5}
          value={baselineD}
          onChange={(e) => setBaselineD(e.target.value)}
          onBlur={() => commitBaseline("D", baselineD)}
        />
      </label>
      <p className="muted">S and D are working baselines from the archived program file, accepted 2026-08-24.</p>
    </div>
  );
}
