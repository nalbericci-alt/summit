import { formatMonthDay } from "../../app/dates";

export interface CycleBoundaryCardProps {
  kind: "before" | "after";
  cycleStart: string;
}

/** Shown on Today instead of a session card when the date falls outside the 12-week cycle. */
export function CycleBoundaryCard({ kind, cycleStart }: CycleBoundaryCardProps) {
  return (
    <div className="hero">
      <h2 className="hero-title">
        {kind === "before" ? `Your cycle starts ${formatMonthDay(cycleStart)}` : "Cycle complete"}
      </h2>
      <p className="muted">
        {kind === "before"
          ? "Check or change your cycle start date in More."
          : "Start a new 12-week cycle in More when you're ready."}
      </p>
      <a className="button-secondary" href="#/more">
        Go to More
      </a>
    </div>
  );
}
