import { PROGRAM_META } from "../../data/program";

export interface ClubMeterProps {
  baselineS: number;
  baselineD: number;
}

const LIFTS: { key: "bench" | "squat" | "deadlift"; label: string }[] = [
  { key: "bench", label: "Bench" },
  { key: "squat", label: "Squat" },
  { key: "deadlift", label: "Deadlift" },
];

/**
 * The 1000-Pound Club meter. Phase 1 has no tested singles anywhere in the app,
 * so every bar is honestly empty: only a tested single should ever move this.
 */
export function ClubMeter({ baselineS, baselineD }: ClubMeterProps) {
  return (
    <div className="card">
      <h2>1000-Pound Club</h2>
      {LIFTS.map(({ key, label }) => (
        <div className="meter" key={key}>
          <div className="row">
            <span>{label}</span>
            <span className="muted">
              No tested single yet · goal {PROGRAM_META.goals[key]} lb
            </span>
          </div>
          <div className="meter-track">
            <div className="meter-fill" style={{ width: "0%" }} />
          </div>
        </div>
      ))}
      <p>0 of {PROGRAM_META.goals.total.toLocaleString()} lb tested</p>
      <p className="muted">
        Working baselines: S {baselineS}, D {baselineD} (from settings). Only tested singles move this meter.
      </p>
    </div>
  );
}
