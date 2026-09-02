import { PROGRAM_META } from "../../data/program";

export function SafetyCard() {
  return (
    <div className="card">
      <h2>Safety</h2>
      <p>{PROGRAM_META.safety}</p>
    </div>
  );
}
