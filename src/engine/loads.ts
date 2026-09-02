import type { Baseline, LoadSpec, SetPlan, WeekPlan } from "../data/program";

export interface Baselines {
  S: number;
  D: number;
}

/** The last earned load on a line, when the app has one. Absent for a fresh cycle. */
export interface LastEarned {
  lb?: number;
  perHand?: boolean;
  /** Pin or stack position for machine lines, when the owner logs it that way. */
  pin?: number;
}

export interface ResolvedLoad {
  /** Numeric load when the program produces one. Null when it depends on a log entry or a trial. */
  lb: number | null;
  perHand: boolean;
  /** Short label for the set row, such as "245", "55s", "+1 pin", "80% of last", "bodyweight". */
  label: string;
  /** True when the number comes from a formula on S or D. */
  fromBaseline: boolean;
  /** True when the row needs the owner to pick a load, such as a trial or an earned increment. */
  ownerChoice: boolean;
}

/** Barbell and cable loads round to the nearest 5 lb, as the PDF's worked examples do. */
export function roundTo5(value: number): number {
  return Math.round(value / 5) * 5;
}

export function baselineValue(base: Baseline, baselines: Baselines): number {
  return base === "S" ? baselines.S : baselines.D;
}

export function resolveLoad(spec: LoadSpec, context: { baselines: Baselines; topLb?: number | null; last?: LastEarned }): ResolvedLoad {
  const { baselines, topLb, last } = context;
  switch (spec.kind) {
    case "lb":
      return { lb: spec.lb, perHand: false, label: String(spec.lb), fromBaseline: false, ownerChoice: false };
    case "perHand":
      return { lb: spec.lb, perHand: true, label: `${spec.lb}s`, fromBaseline: false, ownerChoice: false };
    case "perHandRange":
      return { lb: null, perHand: true, label: `${spec.lowLb}-${spec.highLb}s`, fromBaseline: false, ownerChoice: true };
    case "bodyweight":
      return {
        lb: spec.addedLb ?? 0,
        perHand: false,
        label: spec.addedLb ? `bodyweight +${spec.addedLb}` : "bodyweight",
        fromBaseline: false,
        ownerChoice: false,
      };
    case "baselinePlus": {
      const lb = roundTo5(baselineValue(spec.base, baselines) + spec.plusLb);
      return { lb, perHand: false, label: String(lb), fromBaseline: true, ownerChoice: false };
    }
    case "baselinePct": {
      const lb = roundTo5((baselineValue(spec.base, baselines) * spec.pct) / 100);
      return { lb, perHand: false, label: String(lb), fromBaseline: true, ownerChoice: false };
    }
    case "pctOfTop": {
      if (topLb == null) return { lb: null, perHand: false, label: `${spec.pct}% of top`, fromBaseline: true, ownerChoice: false };
      const lb = roundTo5((topLb * spec.pct) / 100);
      return { lb, perHand: false, label: String(lb), fromBaseline: true, ownerChoice: false };
    }
    case "pctOfLast": {
      if (last?.lb != null) {
        const raw = (last.lb * spec.pct) / 100;
        const lb = last.perHand ? Math.round(raw / 2.5) * 2.5 : roundTo5(raw);
        return { lb, perHand: !!last.perHand, label: last.perHand ? `${lb}s` : String(lb), fromBaseline: false, ownerChoice: false };
      }
      return { lb: null, perHand: false, label: `${spec.pct}% of last`, fromBaseline: false, ownerChoice: true };
    }
    case "same":
      if (last?.lb != null) {
        return { lb: last.lb, perHand: !!last.perHand, label: last.perHand ? `${last.lb}s` : String(last.lb), fromBaseline: false, ownerChoice: false };
      }
      return { lb: null, perHand: false, label: "same as last", fromBaseline: false, ownerChoice: true };
    case "increment": {
      const suffix = spec.ifEarned ? " if earned" : "";
      const label =
        spec.step === "pin" ? `+1 pin${suffix}` :
        spec.step === "smallest" ? `+smallest load${suffix}` :
        spec.step === "2.5s" ? `+2.5s${suffix}` :
        `+5 lb${suffix}`;
      return { lb: null, perHand: spec.step === "2.5s", label, fromBaseline: false, ownerChoice: true };
    }
    case "trial":
      return { lb: spec.lb ?? null, perHand: false, label: spec.lb ? `trial ${spec.lb}` : "trial", fromBaseline: false, ownerChoice: true };
    case "calibrate":
      return { lb: null, perHand: false, label: `calibrate ${spec.base}`, fromBaseline: true, ownerChoice: true };
    case "none":
      return { lb: null, perHand: false, label: "", fromBaseline: false, ownerChoice: false };
  }
}

export interface ResolvedSet extends ResolvedLoad {
  role: SetPlan["role"];
  sets: number;
  reps: string;
  rpeCap?: number;
  optional: boolean;
  note?: string;
}

/** Resolve one week's plan for a line. Back-offs written as a percent of the top use the resolved top. */
export function resolveWeek(week: WeekPlan, baselines: Baselines, last?: LastEarned): ResolvedSet[] | null {
  if ("omit" in week) return null;
  let topLb: number | null = null;
  const out: ResolvedSet[] = [];
  for (const set of week.sets) {
    const load = resolveLoad(set.load, { baselines, topLb, last });
    if (set.role === "top" && load.lb != null) topLb = load.lb;
    out.push({ ...load, role: set.role, sets: set.sets, reps: set.reps, rpeCap: set.rpeCap, optional: set.optional === true, note: set.note });
  }
  return out;
}

/** Epley estimate as the PDF states it. Never a tested maximum. */
export function e1rm(loadLb: number, completedReps: number): number {
  return loadLb * (1 + completedReps / 30);
}
