import type { WeekMeta } from "../../data/program";

export interface WeekHeaderProps {
  week: number;
  date: Date;
  weekMeta: WeekMeta;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" });

/** "Week 9 of 12 · Wednesday, Sep 2" plus the week's block, purpose, and main-lift pattern. */
export function WeekHeader({ week, date, weekMeta }: WeekHeaderProps) {
  return (
    <div>
      <p className="muted">
        Week {week} of 12 · {DATE_FORMAT.format(date)}
      </p>
      <p className="muted">
        {weekMeta.block} · {weekMeta.purpose} · {weekMeta.mainLiftPattern}
      </p>
    </div>
  );
}
