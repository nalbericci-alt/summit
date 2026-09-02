/**
 * Return to the 1,000-Pound Club, Rebuilt Edition.
 *
 * Source: "Return-to-the-1000-Pound-Club-Rebuilt-V5.pdf" (26 pages, prepared
 * for Nick, approval candidate V5.1), transcribed on 2026-09-02. Calendar
 * anchoring follows Nick's 2026-08-27 correction: Week 8 is August 24 to 30,
 * 2026, so the default cycle start is Monday 2026-07-06. The PDF's printed
 * July 27 calendar is superseded by that owner fact.
 *
 * Baselines S (squat) and D (deadlift) come from the archived program file:
 * S = 225 lb accepted 2026-08-24, D = 255 lb working-accepted 2026-08-24.
 * Bench follows a fixed route. Loads written as formulas resolve through
 * src/engine/loads.ts.
 */

export type Baseline = "S" | "D";

export type LoadSpec =
  | { kind: "lb"; lb: number }
  | { kind: "perHand"; lb: number }
  | { kind: "perHandRange"; lowLb: number; highLb: number }
  | { kind: "bodyweight"; addedLb?: number }
  | { kind: "baselinePlus"; base: Baseline; plusLb: number }
  | { kind: "baselinePct"; base: Baseline; pct: number }
  | { kind: "pctOfTop"; pct: number }
  | { kind: "pctOfLast"; pct: number }
  | { kind: "same" }
  | { kind: "increment"; step: "pin" | "smallest" | "2.5s" | "5lb"; ifEarned?: boolean }
  | { kind: "trial"; lb?: number }
  | { kind: "calibrate"; base: Baseline }
  | { kind: "none" };

export interface SetPlan {
  role: "top" | "backoff" | "work";
  sets: number;
  reps: string;
  load: LoadSpec;
  rpeCap?: number;
  optional?: boolean;
  note?: string;
}

export type WeekPlan = { sets: SetPlan[]; note?: string } | { omit: true; note?: string };

export type Equipment =
  | "barbell"
  | "ez_bar"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "band"
  | "cardio";

export interface Exercise {
  id: string;
  name: string;
  equipment: Equipment;
  mainLift?: "bench" | "squat" | "deadlift";
  guidePage?: number;
  cues?: string[];
}

export interface Backup {
  substituteId: string;
  substituteName: string;
  rule: string;
  secondChoice?: string;
}

export interface ExerciseLine {
  lineId: string;
  exerciseId: string;
  weeks: WeekPlan[];
  restSeconds: [number, number];
  warmup?: string[];
  supersetWith?: string;
  backup?: Backup;
  notes?: string[];
}

export type DayId = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface LiftingDay {
  id: DayId;
  kind: "lifting";
  title: string;
  focus: string;
  mission: string;
  sequence: string[];
  lines: ExerciseLine[];
  winCondition: string;
  rules: string[];
  normalMinutes: [number, number];
}

export interface RunWalkWeek {
  rounds: string;
  jogRule: string;
  walkRule: string;
  purpose: string;
}

export interface BaseCardioWeek {
  minutes: string;
  band: string;
}

export interface SaturdayWeek {
  hikeOrLongWalk: string;
  stairmaster: string;
  optionalSecondRun: string;
}

export interface ConditioningDay {
  id: DayId;
  kind: "conditioning" | "recovery";
  title: string;
  focus: string;
  mission: string;
  normalMinutes: [number, number];
  steps: string[];
  rules: string[];
  winCondition: string;
}

export type ProgramDay = LiftingDay | ConditioningDay;

export interface WeekMeta {
  week: number;
  block: "Block 1" | "Deload" | "Block 2" | "Block 3";
  purpose: "Calibrate" | "Build" | "Deload" | "Intensify" | "Taper" | "Check";
  mainLiftPattern: string;
}

const lb = (n: number): LoadSpec => ({ kind: "lb", lb: n });
const hand = (n: number): LoadSpec => ({ kind: "perHand", lb: n });
const handRange = (lowLb: number, highLb: number): LoadSpec => ({ kind: "perHandRange", lowLb, highLb });
const bw = (addedLb?: number): LoadSpec => ({ kind: "bodyweight", addedLb });
const plus = (base: Baseline, plusLb: number): LoadSpec => ({ kind: "baselinePlus", base, plusLb });
const pctBase = (base: Baseline, pct: number): LoadSpec => ({ kind: "baselinePct", base, pct });
const pctTop = (pct: number): LoadSpec => ({ kind: "pctOfTop", pct });
const pctLast = (pct: number): LoadSpec => ({ kind: "pctOfLast", pct });
const same = (): LoadSpec => ({ kind: "same" });
const inc = (step: "pin" | "smallest" | "2.5s" | "5lb", ifEarned = false): LoadSpec => ({ kind: "increment", step, ifEarned });
const trial = (n?: number): LoadSpec => ({ kind: "trial", lb: n });
const none = (): LoadSpec => ({ kind: "none" });

const work = (sets: number, reps: string, load: LoadSpec, extra: Partial<SetPlan> = {}): SetPlan => ({ role: "work", sets, reps, load, ...extra });
const top = (reps: string, load: LoadSpec, extra: Partial<SetPlan> = {}): SetPlan => ({ role: "top", sets: 1, reps, load, ...extra });
const backoff = (sets: number, reps: string, load: LoadSpec, extra: Partial<SetPlan> = {}): SetPlan => ({ role: "backoff", sets, reps, load, ...extra });
const plan = (...sets: SetPlan[]): WeekPlan => ({ sets });
const planNote = (note: string, ...sets: SetPlan[]): WeekPlan => ({ sets, note });
const omit = (note?: string): WeekPlan => ({ omit: true, note });

/** Standard accessory ladder used by most machine and cable lines. */
function machineLadder(trialLb: number | undefined, step: "pin" | "smallest", reps: [string, string, string], deloadReps: string, week12: WeekPlan): WeekPlan[] {
  return [
    plan(work(2, reps[0], trial(trialLb))),
    plan(work(2, reps[1], same())),
    plan(work(2, reps[2], same())),
    plan(work(1, deloadReps, pctLast(80))),
    plan(work(2, reps[0], inc(step))),
    plan(work(2, reps[1], same())),
    plan(work(2, reps[2], same())),
    plan(work(1, deloadReps, pctLast(80))),
    plan(work(2, reps[0], inc(step))),
    plan(work(2, reps[1], same())),
    plan(work(1, reps[2], same())),
    week12,
  ];
}

export const PROGRAM_META = {
  name: "Return to the 1,000-Pound Club",
  edition: "Rebuilt Edition, approval candidate V5.1",
  source: "Return-to-the-1000-Pound-Club-Rebuilt-V5.pdf",
  transcribedOn: "2026-09-02",
  defaultCycleStart: "2026-07-06",
  goals: { bench: 250, squat: 350, deadlift: 400, total: 1000 },
  baselines: {
    S: { lb: 225, acceptedOn: "2026-08-24", status: "accepted" },
    D: { lb: 255, acceptedOn: "2026-08-24", status: "working accepted" },
  },
  operatingRule:
    "Complete the scheduled work with clean mechanics and the listed RPE ceiling. When a progression is not earned, repeat or reduce it. Do not force the calendar.",
  rpeCaps: {
    weeks1to3: 7.5,
    loadingWeeks: 8,
    deloads: 6,
    fridaySkillWork: 6,
  },
  mainLiftRoutes:
    "Bench follows a fixed route. Squat and deadlift follow formulas from accepted Week 1 baselines S and D.",
  accessoryRule:
    "Add reps first. Add the smallest load only after all sets reach the top of the range at RPE 8 or lower. Printed increases are projections. Repeat any unearned load.",
  whatAdvances: [
    "Every prescribed rep",
    "Technique stays consistent",
    "Top and back-offs stay under the ceiling",
    "No worsening pain response",
  ],
  whatHolds:
    "A clean result above the phase cap through RPE 8, less-repeatable technique, or worse recovery means repeat the effective load at the next loading exposure with current-phase reps and 90% back-offs. Deloads stay fixed.",
  missedSessions:
    "One miss preserves its route rung. Any intervening Week 4 or 8 deload stays fixed and does not count. Repeat at the next matching loading exposure with current-phase reps. After two or more misses, return at 90% of the last clean top, cap at RPE 7, and review. Never stack heavy work.",
  sessionStatuses: ["Full", "Reduced", "Substitute", "Recovery", "Skipped"] as const,
  e1rmFormula: "e1RM = load x (1 + completed reps / 30). An RIR-adjusted estimate may be stored separately but is never presented as a tested maximum.",
  safety:
    "Summit is a training tool, not a medical device. Symptoms and stop rules come before the talk test, session RPE, recovery response, heat, the heart-rate cap, and any displayed zone. One reading above a cap is a workload control, not a claim that it is automatically dangerous.",
} as const;

export const WEEKS: WeekMeta[] = [
  { week: 1, block: "Block 1", purpose: "Calibrate", mainLiftPattern: "Actual Monday, accept S and D" },
  { week: 2, block: "Block 1", purpose: "Build", mainLiftPattern: "Top fives plus back-offs" },
  { week: 3, block: "Block 1", purpose: "Build", mainLiftPattern: "Top fives plus back-offs" },
  { week: 4, block: "Deload", purpose: "Deload", mainLiftPattern: "RPE 6 maximum" },
  { week: 5, block: "Block 2", purpose: "Build", mainLiftPattern: "Top fours plus back-offs" },
  { week: 6, block: "Block 2", purpose: "Build", mainLiftPattern: "Top fours plus back-offs" },
  { week: 7, block: "Block 2", purpose: "Build", mainLiftPattern: "Top fours plus back-offs" },
  { week: 8, block: "Deload", purpose: "Deload", mainLiftPattern: "RPE 6 maximum" },
  { week: 9, block: "Block 3", purpose: "Intensify", mainLiftPattern: "Top triples plus back-offs" },
  { week: 10, block: "Block 3", purpose: "Intensify", mainLiftPattern: "Top triples plus back-offs" },
  { week: 11, block: "Block 3", purpose: "Taper", mainLiftPattern: "Top doubles, reduced volume" },
  { week: 12, block: "Block 3", purpose: "Check", mainLiftPattern: "Controlled sets, RPE 8 cap" },
];

export const EXERCISES: Record<string, Exercise> = {
  barbell_bench_press: { id: "barbell_bench_press", name: "Barbell bench press", equipment: "barbell", mainLift: "bench", guidePage: 4, cues: ["Controlled touch, no bounce, full lockout", "Safe spotter or safety-arm setup"] },
  standing_barbell_overhead_press: { id: "standing_barbell_overhead_press", name: "Standing barbell overhead press", equipment: "barbell", guidePage: 9 },
  barbell_row: { id: "barbell_row", name: "Barbell row", equipment: "barbell", guidePage: 13 },
  incline_dumbbell_press: { id: "incline_dumbbell_press", name: "Incline dumbbell press", equipment: "dumbbell", guidePage: 11 },
  neutral_grip_lat_pulldown: { id: "neutral_grip_lat_pulldown", name: "Neutral-grip lat pulldown", equipment: "machine", guidePage: 15 },
  dumbbell_lateral_raise: { id: "dumbbell_lateral_raise", name: "Dumbbell lateral raise", equipment: "dumbbell", guidePage: 17 },
  rear_delt_dumbbell_fly: { id: "rear_delt_dumbbell_fly", name: "Rear-delt dumbbell fly", equipment: "dumbbell", guidePage: 18 },
  ez_bar_skull_crusher: { id: "ez_bar_skull_crusher", name: "EZ-bar skull crusher", equipment: "ez_bar", guidePage: 21 },
  knees_to_elbow_plank: { id: "knees_to_elbow_plank", name: "Knees-to-elbow plank", equipment: "bodyweight", guidePage: 35 },
  back_squat: { id: "back_squat", name: "Back squat", equipment: "barbell", mainLift: "squat", guidePage: 5, cues: ["Consistent depth, controlled descent", "Stable bar path, full standing lockout"] },
  romanian_deadlift: { id: "romanian_deadlift", name: "Romanian deadlift", equipment: "barbell", guidePage: 8 },
  forty_five_degree_leg_press: { id: "forty_five_degree_leg_press", name: "45-degree leg press", equipment: "machine", guidePage: 27 },
  seated_or_lying_leg_curl: { id: "seated_or_lying_leg_curl", name: "Seated or lying leg curl", equipment: "machine", guidePage: 29 },
  leg_extension: { id: "leg_extension", name: "Leg extension", equipment: "machine", guidePage: 28 },
  standing_calf_raise: { id: "standing_calf_raise", name: "Standing calf raise", equipment: "machine", guidePage: 31 },
  rope_cable_crunch: { id: "rope_cable_crunch", name: "Rope cable crunch", equipment: "cable", guidePage: 32 },
  paused_back_squat: { id: "paused_back_squat", name: "Paused back squat", equipment: "barbell", guidePage: 6, cues: ["One-second pause, no relaxation", "RPE 6 maximum"] },
  seated_dumbbell_shoulder_press: { id: "seated_dumbbell_shoulder_press", name: "Seated dumbbell shoulder press", equipment: "dumbbell", guidePage: 10 },
  chest_supported_dumbbell_row: { id: "chest_supported_dumbbell_row", name: "Chest-supported dumbbell row", equipment: "dumbbell", guidePage: 14 },
  pec_deck: { id: "pec_deck", name: "Pec deck", equipment: "machine", guidePage: 12 },
  rope_face_pull: { id: "rope_face_pull", name: "Rope face pull", equipment: "cable", guidePage: 19 },
  barbell_curl: { id: "barbell_curl", name: "Barbell curl", equipment: "barbell", guidePage: 25 },
  hammer_curl: { id: "hammer_curl", name: "Hammer curl", equipment: "dumbbell", guidePage: 26 },
  hanging_knee_raise: { id: "hanging_knee_raise", name: "Hanging knee raise", equipment: "bodyweight", guidePage: 34 },
  conventional_deadlift: { id: "conventional_deadlift", name: "Conventional deadlift", equipment: "barbell", mainLift: "deadlift", guidePage: 7, cues: ["Bar begins motionless, no hitching", "Full hip and knee lockout, controlled return"] },
  pull_up: { id: "pull_up", name: "Pull-up", equipment: "bodyweight", guidePage: 16 },
  barbell_hip_thrust: { id: "barbell_hip_thrust", name: "Barbell hip thrust", equipment: "barbell", guidePage: 30 },
  cable_triceps_pressdown: { id: "cable_triceps_pressdown", name: "Cable triceps pressdown", equipment: "cable", guidePage: 22 },
  machine_chest_press: { id: "machine_chest_press", name: "Machine chest press", equipment: "machine", guidePage: 44 },
  neutral_grip_machine_press: { id: "neutral_grip_machine_press", name: "Neutral-grip machine press", equipment: "machine" },
  chest_supported_row_machine: { id: "chest_supported_row_machine", name: "Chest-supported row machine", equipment: "machine" },
  incline_machine_press: { id: "incline_machine_press", name: "Incline machine press", equipment: "machine" },
  hack_squat: { id: "hack_squat", name: "Hack squat", equipment: "machine" },
  paused_hack_squat: { id: "paused_hack_squat", name: "Paused hack squat", equipment: "machine" },
  back_extension: { id: "back_extension", name: "45-degree back extension", equipment: "bodyweight" },
  machine_row: { id: "machine_row", name: "Machine row", equipment: "machine" },
  trap_bar_deadlift: { id: "trap_bar_deadlift", name: "High-handle trap-bar deadlift", equipment: "barbell" },
  glute_drive: { id: "glute_drive", name: "Glute drive", equipment: "machine" },
  assisted_pull_up: { id: "assisted_pull_up", name: "Assisted pull-up", equipment: "machine" },
  easy_walking: { id: "easy_walking", name: "Easy walking", equipment: "cardio", guidePage: 39 },
  bodyweight_squat: { id: "bodyweight_squat", name: "Bodyweight squat", equipment: "bodyweight" },
  hip_hinge_drill: { id: "hip_hinge_drill", name: "Hip hinge drill", equipment: "bodyweight" },
  ankle_rocks: { id: "ankle_rocks", name: "Ankle rocks", equipment: "bodyweight" },
  thoracic_rotation: { id: "thoracic_rotation", name: "Thoracic rotation", equipment: "bodyweight" },
  band_pull_apart: { id: "band_pull_apart", name: "Band pull-apart", equipment: "band", guidePage: 20 },
  run_walk: { id: "run_walk", name: "Run-walk", equipment: "cardio" },
  base_cardio: { id: "base_cardio", name: "Base cardio", equipment: "cardio" },
  stairmaster: { id: "stairmaster", name: "StairMaster", equipment: "cardio", guidePage: 37 },
  rowing_machine: { id: "rowing_machine", name: "Rowing machine", equipment: "cardio", guidePage: 38 },
  hike_or_long_walk: { id: "hike_or_long_walk", name: "Hike or long walk", equipment: "cardio", guidePage: 39 },
};

/** Instructional videos checked by hand. Only exact-identity matches are listed. */
export const VIDEOS: Record<string, { url: string; publisher: string; verifiedOn: string }> = {
  barbell_bench_press: { url: "https://www.youtube.com/watch?v=w0XBfuCC2WM", publisher: "Calgary Barbell", verifiedOn: "2026-08-28" },
  back_squat: { url: "https://www.youtube.com/watch?v=J_ekvFybels", publisher: "Calgary Barbell", verifiedOn: "2026-08-28" },
  dumbbell_lateral_raise: { url: "https://www.youtube.com/watch?v=OuG1smZTsQQ", publisher: "Renaissance Periodization", verifiedOn: "2026-08-28" },
  rowing_machine: { url: "https://www.youtube.com/watch?v=4zWu1yuJ0_g", publisher: "Concept2", verifiedOn: "2026-08-28" },
  run_walk: { url: "https://www.youtube.com/watch?v=3RlvKMxPMr0", publisher: "Higher Running / Sage Running", verifiedOn: "2026-08-28" },
};

const monday: LiftingDay = {
  id: "monday",
  kind: "lifting",
  title: "Monday",
  focus: "Bench strength, shoulders, back, triceps",
  mission: "Bench first, then overhead strength. Keep bench, overhead press, and barbell row unsupersetted.",
  normalMinutes: [60, 75],
  sequence: [
    "barbell_bench_press",
    "standing_barbell_overhead_press",
    "barbell_row",
    "incline_dumbbell_press",
    "neutral_grip_lat_pulldown",
    "dumbbell_lateral_raise",
    "rear_delt_dumbbell_fly",
    "ez_bar_skull_crusher",
    "knees_to_elbow_plank",
  ],
  lines: [
    {
      lineId: "monday_bench",
      exerciseId: "barbell_bench_press",
      restSeconds: [180, 300],
      warmup: ["Empty bar x15", "45% of heaviest work x8", "65% x5", "80% x3", "Add 90% x1 when top is 200+"],
      backup: { substituteId: "machine_chest_press", substituteName: "Chest press", rule: "Use scheduled reps, finish at RPE 6-7. Machine load does not update bench e1RM." },
      notes: [
        "If 180x5 is above 7.5 through RPE 8, use 160 for back-offs and hold 180. Above RPE 8, use 160 then begin the next loading exposure at 175. An unearned increase becomes a repeat, not a forced jump.",
      ],
      weeks: [
        planNote("Week 1 actual on July 27.", top("5", lb(135)), backoff(3, "5", lb(155))),
        plan(top("5", lb(180)), backoff(3, "5", lb(165))),
        plan(top("5", lb(185)), backoff(3, "5", lb(170))),
        plan(work(3, "5", lb(145), { rpeCap: 6 })),
        plan(top("4", lb(190)), backoff(3, "4", lb(175))),
        plan(top("4", lb(195)), backoff(3, "4", lb(180))),
        plan(top("4", lb(200)), backoff(3, "4", lb(185))),
        plan(work(3, "4", lb(155), { rpeCap: 6 })),
        plan(top("3", lb(205)), backoff(3, "3", lb(185))),
        plan(top("3", lb(210)), backoff(3, "3", lb(190))),
        plan(top("2", lb(215)), backoff(2, "3", lb(195))),
        planNote(
          "Week 12 check. Continue to 5 only while clean. Stop at 5 reps or RPE 8.",
          work(1, "3-5", lb(205), { rpeCap: 8 }),
          work(1, "1", lb(220), { optional: true, note: "Only after 205x5 at RPE 7.5 or lower." }),
        ),
      ],
    },
    {
      lineId: "monday_ohp",
      exerciseId: "standing_barbell_overhead_press",
      restSeconds: [120, 180],
      warmup: ["Empty bar x10", "50% of work x5", "75% x3", "Add 90% x1 when work is 105+"],
      backup: { substituteId: "neutral_grip_machine_press", substituteName: "Machine press", rule: "Neutral grip, same sets and reps, same ceiling." },
      weeks: [
        planNote("Week 1 actual on July 27.", top("8", lb(75)), work(2, "6", lb(95))),
        plan(work(3, "6", lb(100))),
        plan(work(3, "7", lb(100))),
        plan(work(2, "6", lb(80), { rpeCap: 6 })),
        plan(work(3, "8", lb(100))),
        plan(work(3, "6", lb(105))),
        plan(work(3, "7", lb(105))),
        plan(work(2, "6", lb(85), { rpeCap: 6 })),
        plan(work(3, "8", lb(105))),
        plan(work(3, "6", lb(110))),
        plan(work(2, "7", lb(110))),
        plan(work(2, "6", lb(90), { rpeCap: 8 })),
      ],
    },
    {
      lineId: "monday_row",
      exerciseId: "barbell_row",
      restSeconds: [120, 180],
      warmup: ["65x8", "75% of work x5", "Add 90% x3 when work is 130+"],
      backup: { substituteId: "chest_supported_row_machine", substituteName: "Supported row", rule: "Same sets and reps. Record seat, handle, chest pad, and load." },
      weeks: [
        planNote("Week 1 actual on July 27.", top("8", lb(95)), work(2, "8", lb(115))),
        plan(work(3, "8", lb(125))),
        plan(work(3, "9", lb(125))),
        plan(work(2, "8", lb(100), { rpeCap: 6 })),
        plan(work(3, "10", lb(125))),
        plan(work(3, "8", lb(130))),
        plan(work(3, "9", lb(130))),
        plan(work(2, "8", lb(105), { rpeCap: 6 })),
        plan(work(3, "10", lb(130))),
        plan(work(3, "8", lb(135))),
        plan(work(2, "9", lb(135))),
        plan(work(2, "8", lb(110), { rpeCap: 8 })),
      ],
    },
    {
      lineId: "monday_incline",
      exerciseId: "incline_dumbbell_press",
      restSeconds: [90, 120],
      warmup: ["25s x8", "40s x5"],
      backup: { substituteId: "incline_machine_press", substituteName: "Incline machine", rule: "Match the incline, use scheduled reps, finish at RPE 6-7." },
      weeks: [
        planNote("Week 1 actual on July 27.", top("8", hand(40)), work(2, "8", hand(50))),
        plan(work(2, "8", hand(55))),
        plan(work(2, "9", hand(55))),
        plan(work(1, "8", hand(45), { rpeCap: 6 })),
        plan(work(2, "10", hand(55))),
        plan(work(2, "8", hand(60))),
        plan(work(2, "9", hand(60))),
        plan(work(1, "8", hand(50), { rpeCap: 6 })),
        plan(work(2, "10", hand(60))),
        plan(work(2, "8", hand(65))),
        plan(work(1, "9", hand(65))),
        omit(),
      ],
    },
    {
      lineId: "monday_pulldown",
      exerciseId: "neutral_grip_lat_pulldown",
      restSeconds: [90, 120],
      warmup: ["Easy x10", "Medium x5"],
      notes: ["Use the same pulldown machine, handle, seat, thigh pad, and range. A changed setup creates a new line. Printed stack pounds do not transfer to another machine."],
      weeks: [
        planNote("Week 1 actual on July 27.", top("10", lb(100)), work(2, "8", lb(110))),
        plan(work(3, "8", lb(120))),
        plan(work(3, "9", lb(120))),
        plan(work(2, "8", pctLast(80), { rpeCap: 6 })),
        plan(work(3, "10", lb(120))),
        plan(work(3, "8", inc("pin"))),
        plan(work(3, "9", same())),
        plan(work(2, "8", pctLast(80), { rpeCap: 6 })),
        plan(work(3, "10", same())),
        plan(work(3, "8", inc("pin"))),
        plan(work(2, "9", same())),
        plan(work(2, "8", same(), { rpeCap: 6 })),
      ],
    },
    {
      lineId: "monday_lateral_raise",
      exerciseId: "dumbbell_lateral_raise",
      restSeconds: [60, 90],
      supersetWith: "monday_rear_delt",
      notes: ["With no 2.5 lb dumbbells, keep the load and add control or a slower lowering phase."],
      weeks: [
        planNote("Week 1 actual on July 27.", work(3, "12", hand(15))),
        plan(work(2, "13", hand(15))),
        plan(work(2, "15", hand(15))),
        plan(work(1, "12", handRange(10, 12.5), { rpeCap: 6 })),
        plan(work(2, "12", inc("2.5s", true))),
        plan(work(2, "14", same())),
        plan(work(2, "15", same())),
        plan(work(1, "12", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "12", inc("2.5s", true))),
        plan(work(2, "14", same())),
        plan(work(1, "15", same())),
        omit(),
      ],
    },
    {
      lineId: "monday_rear_delt",
      exerciseId: "rear_delt_dumbbell_fly",
      restSeconds: [60, 90],
      supersetWith: "monday_lateral_raise",
      weeks: [
        planNote("Week 1 actual on July 27.", work(3, "15", hand(15))),
        plan(work(2, "17", hand(15))),
        plan(work(2, "20", hand(15))),
        plan(work(1, "15", handRange(10, 12.5), { rpeCap: 6 })),
        plan(work(2, "15", inc("2.5s", true))),
        plan(work(2, "17", same())),
        plan(work(2, "20", same())),
        plan(work(1, "15", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "15", inc("2.5s", true))),
        plan(work(2, "17", same())),
        plan(work(1, "20", same())),
        omit(),
      ],
    },
    {
      lineId: "monday_skull_crusher",
      exerciseId: "ez_bar_skull_crusher",
      restSeconds: [60, 90],
      supersetWith: "monday_plank",
      weeks: [
        planNote("Week 1 actual on July 27.", work(3, "10", lb(50))),
        plan(work(2, "8", lb(55))),
        plan(work(2, "10", lb(55))),
        plan(work(1, "8", lb(45), { rpeCap: 6 })),
        plan(work(2, "12", lb(55))),
        plan(work(2, "8", lb(60))),
        plan(work(2, "10", lb(60))),
        plan(work(1, "8", lb(50), { rpeCap: 6 })),
        plan(work(2, "12", lb(60))),
        plan(work(2, "8", lb(65))),
        plan(work(1, "10", lb(65))),
        omit(),
      ],
    },
    {
      lineId: "monday_plank",
      exerciseId: "knees_to_elbow_plank",
      restSeconds: [60, 90],
      supersetWith: "monday_skull_crusher",
      weeks: [
        planNote("Replaces the missed ab wheel.", work(2, "8 per side", none())),
        plan(work(2, "8 per side", none())),
        plan(work(2, "10 per side", none())),
        plan(work(1, "8 per side", none(), { rpeCap: 6 })),
        plan(work(2, "12 per side", none())),
        plan(work(2, "8 per side", none(), { note: "Slower." })),
        plan(work(2, "10 per side", none())),
        plan(work(1, "8 per side", none(), { rpeCap: 6 })),
        plan(work(2, "12 per side", none())),
        plan(work(2, "8", none(), { note: "One-second squeeze." })),
        plan(work(1, "10 per side", none())),
        omit(),
      ],
    },
  ],
  winCondition:
    "All reps are clean and inside the ceiling. Weeks 2-3 cap at RPE 7.5, later loading weeks cap at 8, and deloads cap at 6.",
  rules: [
    "Rest: bench 3-5 minutes; OHP and barbell row 2-3 minutes; incline press and pulldown 90-120 seconds; isolation and core 60-90 seconds.",
    "Supersets: lateral raise with rear-delt fly; skull crusher with knees-to-elbow plank. Never superset bench, OHP, or barbell row.",
    "Warm-ups keep loads ascending and omit any step at or above work.",
    "Log as substitute when a backup is used: useful work is preserved, the original progression is not advanced.",
  ],
};

const wednesday: LiftingDay = {
  id: "wednesday",
  kind: "lifting",
  title: "Wednesday",
  focus: "Squat, hamstrings, quads, calves, core",
  mission: "Earn S honestly, build the squat, and leave enough posterior-chain capacity for Sunday.",
  normalMinutes: [60, 75],
  sequence: [
    "back_squat",
    "romanian_deadlift",
    "forty_five_degree_leg_press",
    "seated_or_lying_leg_curl",
    "leg_extension",
    "standing_calf_raise",
    "rope_cable_crunch",
  ],
  lines: [
    {
      lineId: "wednesday_squat",
      exerciseId: "back_squat",
      restSeconds: [180, 300],
      warmup: ["Bar x10", "95x8", "60% x5", "75% x3", "90% x1", "Round to 5 and omit steps at or above work"],
      backup: { substituteId: "hack_squat", substituteName: "Hack squat", rule: "3-4x6-10 at the day's cap.", secondChoice: "45-degree leg press" },
      notes: [
        "Week 1 calibration: bar x10, 95x8, 135x5, 175x3, 205x1. Try 215x5, then 225 and 235 only while the prior set is 5.5 or easier. The first clean 6-7.5 set becomes S. If 235 is still 5.5 or easier, accept conservative S=235 and do not add a fourth candidate. Finish four total candidate plus work sets: 3 back-offs if S=215, 2 if S=225, 1 if S=235.",
        "Calibration fallback: if 215x5 exceeds 7.5, use 190 for 2x5 and begin the next loading Wednesday at 205. If 205 exceeds 7.5, stop: no S, recovery or substitute, and retry after the issue resolves.",
      ],
      weeks: [
        planNote("Calibrate S and finish four total squat sets.", work(4, "5", { kind: "calibrate", base: "S" })),
        plan(top("5", plus("S", 5)), backoff(3, "5", pctTop(90))),
        plan(top("5", plus("S", 10)), backoff(3, "5", pctTop(90))),
        plan(work(3, "5", pctBase("S", 75), { rpeCap: 6 })),
        plan(top("4", plus("S", 15)), backoff(3, "4", pctTop(90))),
        plan(top("4", plus("S", 20)), backoff(3, "4", pctTop(90))),
        plan(top("4", plus("S", 25)), backoff(3, "4", pctTop(90))),
        plan(work(3, "4", pctBase("S", 80), { rpeCap: 6 })),
        plan(top("3", plus("S", 30)), backoff(3, "3", pctTop(90))),
        plan(top("3", plus("S", 35)), backoff(3, "3", pctTop(90))),
        plan(top("2", plus("S", 40)), backoff(2, "3", pctTop(90))),
        planNote(
          "Week 12 check. Continue to 5 only while stable. Stop at 5 reps or RPE 8.",
          work(1, "3-5", plus("S", 30), { rpeCap: 8 }),
          work(1, "1", plus("S", 50), { optional: true, note: "Only after 5 reps at RPE 7.5 or lower." }),
        ),
      ],
    },
    {
      lineId: "wednesday_rdl",
      exerciseId: "romanian_deadlift",
      restSeconds: [120, 180],
      warmup: ["95x8", "135x5"],
      backup: { substituteId: "back_extension", substituteName: "Back extension", rule: "2-3x10-12 at RPE 6-7.", secondChoice: "Cable pull-through plus leg curl" },
      weeks: [
        plan(work(2, "8", lb(185))),
        plan(work(2, "9", lb(185))),
        plan(work(2, "10", lb(185))),
        plan(work(1, "8", lb(150), { rpeCap: 6 })),
        plan(work(2, "8", lb(195), { note: "If earned." })),
        plan(work(2, "9", lb(195))),
        plan(work(2, "10", lb(195))),
        plan(work(1, "8", lb(155), { rpeCap: 6 })),
        plan(work(2, "8", lb(205), { note: "If earned." })),
        plan(work(2, "9", lb(205))),
        plan(work(1, "10", lb(205))),
        omit(),
      ],
    },
    {
      lineId: "wednesday_leg_press",
      exerciseId: "forty_five_degree_leg_press",
      restSeconds: [120, 180],
      warmup: ["Minimum x10", "Half-work x8"],
      weeks: [
        planNote("Calibrate at RPE 7.", work(3, "10", trial(), { rpeCap: 7 })),
        plan(work(3, "11", same())),
        plan(work(3, "12", same())),
        plan(work(2, "10", pctLast(80), { rpeCap: 6 })),
        plan(work(3, "10", inc("smallest"))),
        plan(work(3, "11", same())),
        plan(work(3, "12", same())),
        plan(work(2, "10", pctLast(80), { rpeCap: 6 })),
        plan(work(3, "10", inc("smallest"))),
        plan(work(3, "11", same())),
        plan(work(2, "12", same())),
        omit(),
      ],
    },
    {
      lineId: "wednesday_leg_curl",
      exerciseId: "seated_or_lying_leg_curl",
      restSeconds: [60, 90],
      supersetWith: "wednesday_calf",
      notes: ["Shared line with Sunday: same machine, setup, and load. Increase only after both weekly exposures reach 15 reps per set at RPE 8 or lower. A different machine starts a new line."],
      weeks: machineLadder(60, "pin", ["10", "12", "15"], "10", plan(work(1, "10", same(), { note: "One easy set only if helpful." }))),
    },
    {
      lineId: "wednesday_leg_extension",
      exerciseId: "leg_extension",
      restSeconds: [60, 90],
      supersetWith: "wednesday_crunch",
      weeks: machineLadder(60, "pin", ["10", "12", "15"], "10", omit()),
    },
    {
      lineId: "wednesday_calf",
      exerciseId: "standing_calf_raise",
      restSeconds: [60, 90],
      supersetWith: "wednesday_leg_curl",
      weeks: machineLadder(80, "smallest", ["10", "12", "15"], "10", omit()),
    },
    {
      lineId: "wednesday_crunch",
      exerciseId: "rope_cable_crunch",
      restSeconds: [60, 90],
      supersetWith: "wednesday_leg_extension",
      weeks: machineLadder(60, "pin", ["10", "12", "15"], "10", plan(work(1, "10", same(), { note: "One easy set only if helpful." }))),
    },
  ],
  winCondition:
    "Consistent depth, controlled descent, stable bar path, and no symptom change. Weeks 1-3 cap at 7.5, loading weeks cap at 8, and deloads stay at 6.",
  rules: [
    "Rest: squat 3-5 minutes; RDL and leg press 2-3 minutes; machine work and core 60-90 seconds.",
    "Supersets: leg curl with standing calf raise; leg extension with cable crunch. Keep squat, RDL, and leg press separate.",
    "Do not add lower-body work because the day feels easy. Wednesday already connects to Friday paused squat, Saturday conditioning, and Sunday deadlift.",
    "Printed increases are projections. Repeat any unearned load.",
  ],
};

const friday: LiftingDay = {
  id: "friday",
  kind: "lifting",
  title: "Friday",
  focus: "Paused squat skill, bench volume, shoulders, back",
  mission: "Paused squat stays light. Bench volume follows Monday readiness instead of competing with Monday strength.",
  normalMinutes: [60, 75],
  sequence: [
    "paused_back_squat",
    "barbell_bench_press",
    "seated_dumbbell_shoulder_press",
    "chest_supported_dumbbell_row",
    "pec_deck",
    "dumbbell_lateral_raise",
    "rope_face_pull",
    "barbell_curl",
    "hammer_curl",
    "hanging_knee_raise",
  ],
  lines: [
    {
      lineId: "friday_paused_squat",
      exerciseId: "paused_back_squat",
      restSeconds: [150, 240],
      warmup: ["Empty bar x10", "95x5", "About 80% of the day's work x3"],
      backup: { substituteId: "paused_hack_squat", substituteName: "Paused hack squat", rule: "3x5-8 at RPE 6 max.", secondChoice: "Controlled-stop leg press" },
      weeks: [
        plan(work(3, "5", pctBase("S", 70), { rpeCap: 6 })),
        plan(work(3, "5", pctBase("S", 70), { rpeCap: 6 })),
        plan(work(3, "5", pctBase("S", 72.5), { rpeCap: 6 })),
        plan(work(2, "5", pctBase("S", 60), { rpeCap: 6 })),
        plan(work(3, "4", pctBase("S", 75), { rpeCap: 6 })),
        plan(work(3, "4", pctBase("S", 75), { rpeCap: 6 })),
        plan(work(3, "4", pctBase("S", 77.5), { rpeCap: 6 })),
        plan(work(2, "4", pctBase("S", 65), { rpeCap: 6 })),
        plan(work(3, "3", pctBase("S", 80), { rpeCap: 6 })),
        plan(work(3, "3", pctBase("S", 80), { rpeCap: 6 })),
        plan(work(2, "3", pctBase("S", 80), { rpeCap: 6 })),
        omit(),
      ],
    },
    {
      lineId: "friday_bench",
      exerciseId: "barbell_bench_press",
      restSeconds: [150, 240],
      warmup: ["Empty bar x15", "50% x8", "70% x5", "85% x3", "Round to 5 and omit steps at or above work"],
      backup: { substituteId: "machine_chest_press", substituteName: "Chest press", rule: "Same reps, final set RPE 6-7. Machine load stays on its own line." },
      notes: [
        "Monday controls Friday bench. Monday at 7.5 or lower follows the route; above 7.5 through 8 holds Friday; above 8 or a technique reduction lowers Friday 5-10 lb.",
      ],
      weeks: [
        planNote("July 27 has no bench-specific top RPE. Cap at 7 and lower 5-10 lb if needed.", work(3, "8", lb(150), { rpeCap: 7 })),
        plan(work(3, "8", lb(155))),
        plan(work(3, "8", lb(160))),
        plan(work(2, "8", lb(130), { rpeCap: 6 })),
        plan(work(3, "7", lb(160))),
        plan(work(3, "7", lb(165))),
        plan(work(3, "7", lb(170))),
        plan(work(2, "7", lb(135), { rpeCap: 6 })),
        plan(work(3, "6", lb(170))),
        plan(work(3, "6", lb(175))),
        plan(work(2, "6", lb(180))),
        plan(work(2, "5", lb(135))),
      ],
    },
    {
      lineId: "friday_db_press",
      exerciseId: "seated_dumbbell_shoulder_press",
      restSeconds: [90, 120],
      warmup: ["20s x8", "30s x5"],
      backup: { substituteId: "neutral_grip_machine_press", substituteName: "Machine press", rule: "Neutral grip, same sets and reps, same ceiling." },
      weeks: [
        plan(work(2, "8", hand(40))),
        plan(work(2, "10", hand(40))),
        plan(work(2, "12", hand(40))),
        plan(work(1, "8", hand(30), { rpeCap: 6 })),
        plan(work(2, "8", hand(45))),
        plan(work(2, "10", hand(45))),
        plan(work(2, "12", hand(45))),
        plan(work(1, "8", hand(35), { rpeCap: 6 })),
        plan(work(2, "8", hand(50))),
        plan(work(2, "10", hand(50))),
        plan(work(1, "12", hand(50))),
        omit(),
      ],
    },
    {
      lineId: "friday_cs_row",
      exerciseId: "chest_supported_dumbbell_row",
      restSeconds: [90, 120],
      backup: { substituteId: "machine_row", substituteName: "Machine row", rule: "Same sets and reps. Record grip, pad, range, and load." },
      weeks: [
        plan(work(2, "8", hand(50))),
        plan(work(2, "10", hand(50))),
        plan(work(2, "12", hand(50))),
        plan(work(1, "8", hand(40), { rpeCap: 6 })),
        plan(work(2, "8", hand(55))),
        plan(work(2, "10", hand(55))),
        plan(work(2, "12", hand(55))),
        plan(work(1, "8", hand(45), { rpeCap: 6 })),
        plan(work(2, "8", hand(60))),
        plan(work(2, "10", hand(60))),
        plan(work(1, "12", hand(60))),
        plan(work(2, "8", same(), { rpeCap: 6, note: "Two easy sets." })),
      ],
    },
    {
      lineId: "friday_pec_deck",
      exerciseId: "pec_deck",
      restSeconds: [60, 90],
      supersetWith: "friday_face_pull",
      weeks: machineLadder(85, "pin", ["10", "12", "15"], "10", omit()),
    },
    {
      lineId: "friday_lateral_raise",
      exerciseId: "dumbbell_lateral_raise",
      restSeconds: [60, 90],
      supersetWith: "friday_knee_raise",
      weeks: [
        plan(work(2, "12", hand(15))),
        plan(work(2, "14", hand(15))),
        plan(work(2, "15", hand(15))),
        plan(work(1, "12", handRange(10, 12.5), { rpeCap: 6 })),
        plan(work(2, "12", inc("2.5s", true))),
        plan(work(2, "14", same())),
        plan(work(2, "15", same())),
        plan(work(1, "12", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "12", inc("2.5s", true))),
        plan(work(2, "14", same())),
        plan(work(1, "15", same())),
        omit(),
      ],
    },
    {
      lineId: "friday_face_pull",
      exerciseId: "rope_face_pull",
      restSeconds: [60, 90],
      supersetWith: "friday_pec_deck",
      weeks: [
        plan(work(2, "12", trial(45))),
        plan(work(2, "16", same())),
        plan(work(2, "20", same())),
        plan(work(1, "12", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "12", inc("pin"))),
        plan(work(2, "16", same())),
        plan(work(2, "20", same())),
        plan(work(1, "12", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "12", inc("pin"))),
        plan(work(2, "16", same())),
        plan(work(1, "20", same())),
        plan(work(2, "12", same(), { rpeCap: 6, note: "Two easy sets." })),
      ],
    },
    {
      lineId: "friday_barbell_curl",
      exerciseId: "barbell_curl",
      restSeconds: [60, 90],
      supersetWith: "friday_hammer_curl",
      weeks: [
        plan(work(2, "8", lb(55))),
        plan(work(2, "10", lb(55))),
        plan(work(2, "12", lb(55))),
        plan(work(1, "8", lb(45), { rpeCap: 6 })),
        plan(work(2, "8", lb(60))),
        plan(work(2, "10", lb(60))),
        plan(work(2, "12", lb(60))),
        plan(work(1, "8", lb(50), { rpeCap: 6 })),
        plan(work(2, "8", lb(65))),
        plan(work(2, "10", lb(65))),
        plan(work(1, "12", lb(65))),
        omit(),
      ],
    },
    {
      lineId: "friday_hammer_curl",
      exerciseId: "hammer_curl",
      restSeconds: [60, 90],
      supersetWith: "friday_barbell_curl",
      weeks: [
        plan(work(2, "10", hand(25))),
        plan(work(2, "11", hand(25))),
        plan(work(2, "12", hand(25))),
        plan(work(1, "10", hand(20), { rpeCap: 6 })),
        plan(work(2, "10", hand(30))),
        plan(work(2, "11", hand(30))),
        plan(work(2, "12", hand(30))),
        plan(work(1, "10", hand(25), { rpeCap: 6 })),
        plan(work(2, "10", hand(35))),
        plan(work(2, "11", hand(35))),
        plan(work(1, "12", hand(35))),
        omit(),
      ],
    },
    {
      lineId: "friday_knee_raise",
      exerciseId: "hanging_knee_raise",
      restSeconds: [60, 90],
      supersetWith: "friday_lateral_raise",
      weeks: [
        plan(work(2, "8", bw())),
        plan(work(2, "10", bw())),
        plan(work(2, "12", bw())),
        plan(work(1, "8", bw(), { rpeCap: 6 })),
        plan(work(2, "8", bw(), { note: "Slower." })),
        plan(work(2, "10", bw())),
        plan(work(2, "12", bw())),
        plan(work(1, "8", bw(), { rpeCap: 6 })),
        plan(work(2, "8", bw(), { note: "Pause at the top." })),
        plan(work(2, "10", bw())),
        plan(work(1, "12", bw())),
        omit(),
      ],
    },
  ],
  winCondition: "Paused squat remains skill practice. Bench volume stays inside its ceiling and does not create a forced Monday increase.",
  rules: [
    "Rest: paused squat and bench 2.5-4 minutes; dumbbell press and rows 90-120 seconds; remaining work 60-90 seconds.",
    "Supersets: pec deck with face pull; lateral raise with knee raise; barbell curl with hammer curl.",
    "Taper: Weeks 4 and 8 use 1 set for normal 2-set work and 2 for normal 3-set work, plus 80% of last earned loads. Week 11 removes one set from every non-main accessory. Week 12 keeps only bench, two easy row sets, and two easy face-pull sets.",
    "Monday OHP and Friday dumbbell press are the two direct pressing exposures. Raises and face pulls support them. Do not add bonus shoulder work.",
  ],
};

const sunday: LiftingDay = {
  id: "sunday",
  kind: "lifting",
  title: "Sunday",
  focus: "Deadlift, back, posterior chain, triceps",
  mission: "Apply the Saturday decision first. Then earn D and keep deadlift quality ahead of accessory volume.",
  normalMinutes: [60, 75],
  sequence: [
    "conventional_deadlift",
    "pull_up",
    "chest_supported_dumbbell_row",
    "barbell_hip_thrust",
    "seated_or_lying_leg_curl",
    "cable_triceps_pressdown",
  ],
  lines: [
    {
      lineId: "sunday_deadlift",
      exerciseId: "conventional_deadlift",
      restSeconds: [240, 300],
      warmup: ["135x5", "60% x3", "75% x2", "85% x1", "Round to 5 and omit steps at or above work"],
      backup: { substituteId: "trap_bar_deadlift", substituteName: "Trap bar or machine pair", rule: "High-handle trap bar uses scheduled reps. Machine pair is glute drive plus leg curl, 3x8-10 at RPE 6-7." },
      notes: [
        "Week 1 calibration: 135x5, 185x3, 225x1. Try 245x5, then 255 and 265 only while the prior set is 5.5 or easier. The first clean 6-7.5 set becomes D. If 265 is still 5.5 or easier, accept conservative D=265 and do not add another candidate. Finish three total candidate plus work sets: 2 back-offs if D=245, 1 if D=255, none if D=265.",
        "Calibration fallback: if 245x5 exceeds 7.5, use 210 for 2x5 and begin the next loading Sunday at 235. If 235 exceeds 7.5, stop: no D, recovery or substitute, and retry after the issue resolves. A hard Saturday before D uses 210 for 2x5 at RPE 6, omits hip thrust, records no D, and repeats calibration next loading Sunday.",
        "Hard-Saturday adjustment on loading weeks: 90% of the scheduled top for 2 work sets at scheduled reps, no additional back-offs, RPE 7 maximum, omit hip thrust, trim pull-up and row sets if fatigue remains. Week 4: 75% D 2x5. Week 8: 80% D 2x4. Both RPE 6.",
        "Week 12 exception: a hard Saturday cancels the check. Perform 70% of D for 2x3 at RPE 6. Move the check only after 48-72 easy hours, otherwise skip it.",
      ],
      weeks: [
        planNote("Calibrate D and finish three total deadlift sets.", work(3, "5", { kind: "calibrate", base: "D" })),
        plan(top("5", plus("D", 10)), backoff(2, "5", pctTop(90))),
        plan(top("5", plus("D", 20)), backoff(2, "5", pctTop(90))),
        plan(work(2, "5", pctBase("D", 75), { rpeCap: 6 })),
        plan(top("4", plus("D", 25)), backoff(2, "4", pctTop(90))),
        plan(top("4", plus("D", 35)), backoff(2, "4", pctTop(90))),
        plan(top("4", plus("D", 45)), backoff(2, "4", pctTop(90))),
        plan(work(2, "4", pctBase("D", 80), { rpeCap: 6 })),
        plan(top("3", plus("D", 50)), backoff(2, "3", pctTop(90))),
        plan(top("3", plus("D", 60)), backoff(2, "3", pctTop(90))),
        plan(top("2", plus("D", 65)), backoff(1, "3", pctTop(90))),
        planNote(
          "Week 12 check. Continue to 5 only while setup and bar path hold. Stop at 5 reps or RPE 8.",
          work(1, "3-5", plus("D", 50), { rpeCap: 8 }),
          work(1, "1", plus("D", 80), { optional: true, note: "Only after 5 reps at RPE 7.5 or lower and an easy Saturday." }),
        ),
      ],
    },
    {
      lineId: "sunday_pull_up",
      exerciseId: "pull_up",
      restSeconds: [120, 180],
      warmup: ["5 scapular pulls", "Easy x3"],
      backup: { substituteId: "assisted_pull_up", substituteName: "Pulldown or assisted pull-up", rule: "Same number of sets, 6-10 clean reps at RPE 7 or lower." },
      weeks: [
        plan(work(3, "5", bw())),
        plan(work(3, "6", bw())),
        plan(work(3, "7", bw())),
        plan(work(2, "5", bw(), { rpeCap: 6 })),
        plan(work(3, "8", bw())),
        plan(work(3, "5", bw(5), { note: "Add 5 lb if earned." })),
        plan(work(3, "6", same())),
        plan(work(2, "5", bw(), { rpeCap: 6 })),
        plan(work(3, "7", same())),
        plan(work(3, "8", same())),
        plan(work(2, "5", same(), { note: "At earned load." })),
        plan(work(2, "5", bw(), { rpeCap: 6, note: "At most two easy sets." })),
      ],
    },
    {
      lineId: "sunday_cs_row",
      exerciseId: "chest_supported_dumbbell_row",
      restSeconds: [120, 180],
      backup: { substituteId: "machine_row", substituteName: "Machine row", rule: "Same sets and reps. Record all setup details." },
      weeks: [
        plan(work(2, "8", hand(55))),
        plan(work(2, "10", hand(55))),
        plan(work(2, "12", hand(55))),
        plan(work(1, "8", hand(45), { rpeCap: 6 })),
        plan(work(2, "8", hand(60))),
        plan(work(2, "10", hand(60))),
        plan(work(2, "12", hand(60))),
        plan(work(1, "8", hand(50), { rpeCap: 6 })),
        plan(work(2, "8", hand(65))),
        plan(work(2, "10", hand(65))),
        plan(work(1, "12", hand(65))),
        plan(work(1, "8", same(), { rpeCap: 6, note: "One easy set." })),
      ],
    },
    {
      lineId: "sunday_hip_thrust",
      exerciseId: "barbell_hip_thrust",
      restSeconds: [120, 180],
      warmup: ["Bar x10", "95x8", "135x5"],
      backup: { substituteId: "glute_drive", substituteName: "Glute drive", rule: "Same reps at RPE 6-7. Record pad and range." },
      weeks: [
        plan(work(2, "8", lb(185))),
        plan(work(2, "9", lb(185))),
        plan(work(2, "10", lb(185))),
        plan(work(1, "8", lb(150), { rpeCap: 6 })),
        plan(work(2, "8", lb(195))),
        plan(work(2, "9", lb(195))),
        plan(work(2, "10", lb(195))),
        plan(work(1, "8", lb(155), { rpeCap: 6 })),
        plan(work(2, "8", lb(205))),
        plan(work(2, "9", lb(205))),
        plan(work(1, "10", lb(205))),
        omit(),
      ],
    },
    {
      lineId: "sunday_leg_curl",
      exerciseId: "seated_or_lying_leg_curl",
      restSeconds: [60, 90],
      supersetWith: "sunday_pressdown",
      notes: ["Shared Wednesday line: same machine, setup, and load as Wednesday."],
      weeks: [
        plan(work(2, "10", same(), { note: "Wednesday load." })),
        plan(work(2, "12", same())),
        plan(work(2, "15", same())),
        plan(work(1, "10", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "10", same(), { note: "Earned load." })),
        plan(work(2, "12", same())),
        plan(work(2, "15", same())),
        plan(work(1, "10", pctLast(80), { rpeCap: 6 })),
        plan(work(2, "10", same(), { note: "Earned load." })),
        plan(work(2, "12", same())),
        plan(work(1, "15", same())),
        omit(),
      ],
    },
    {
      lineId: "sunday_pressdown",
      exerciseId: "cable_triceps_pressdown",
      restSeconds: [60, 90],
      supersetWith: "sunday_leg_curl",
      weeks: machineLadder(60, "pin", ["10", "12", "15"], "10", omit()),
    },
  ],
  winCondition:
    "The bar starts motionless, setup and path stay repeatable, the Saturday adjustment is applied before loading, and no accessory work compromises the main lift.",
  rules: [
    "Rest: deadlift 4-5 minutes; pull-ups, rows, hip thrust 2-3 minutes; remaining work 60-90 seconds. Leg curl may pair with pressdown. Keep deadlift, pull-ups, rows, and hip thrust separate.",
    "Week 11 taper: 2 pull-up sets, 1 row, 1 hip thrust, 1 leg curl, 1 pressdown. Week 12: at most 2 easy pull-up sets and 1 easy row; omit hip thrust, curl, and pressdown.",
    "Repeat any unearned accessory load. Log actual sets, RPE or RIR, technique, symptoms, Saturday reason, and decision.",
  ],
};

export const RUN_WALK: RunWalkWeek[] = [
  { rounds: "6", jogRule: "60 sec or 170 bpm", walkRule: "Walk to 135-140", purpose: "Establish control" },
  { rounds: "7", jogRule: "60-75 sec or 172 bpm", walkRule: "Walk to 135-140", purpose: "Progress one variable" },
  { rounds: "8", jogRule: "Up to 75 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "No peak chasing" },
  { rounds: "0-5", jogRule: "45-60 sec or 165 bpm", walkRule: "Walk to 135-140", purpose: "Prefer base cardio" },
  { rounds: "8", jogRule: "Up to 75 sec or 172 bpm", walkRule: "Walk to 135-140", purpose: "Resume" },
  { rounds: "8", jogRule: "75-90 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "Hold pace if recovery slows" },
  { rounds: "9", jogRule: "75-90 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "Last full build week" },
  { rounds: "0-5", jogRule: "45-60 sec or 165 bpm", walkRule: "Walk to 135-140", purpose: "Prefer base cardio" },
  { rounds: "8", jogRule: "75-90 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "Improve pace, not peak" },
  { rounds: "9", jogRule: "75-90 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "Last progression" },
  { rounds: "7-8", jogRule: "75-90 sec or 175 bpm", walkRule: "Walk to 135-140", purpose: "Protect top doubles" },
  { rounds: "0", jogRule: "Easy base cardio only", walkRule: "Not applicable", purpose: "Protect checks" },
];

export const BASE_CARDIO: BaseCardioWeek[] = [
  { minutes: "25 min", band: "120-145" },
  { minutes: "30 min", band: "120-145" },
  { minutes: "35 min", band: "120-145" },
  { minutes: "20 min", band: "115-135" },
  { minutes: "30 min", band: "120-145" },
  { minutes: "35 min", band: "120-145" },
  { minutes: "40 min", band: "120-145" },
  { minutes: "25 min", band: "115-135" },
  { minutes: "35 min", band: "120-145" },
  { minutes: "40 min", band: "120-145" },
  { minutes: "30 min", band: "120-145" },
  { minutes: "20-25 min", band: "115-135" },
];

export const SATURDAY: SaturdayWeek[] = [
  { hikeOrLongWalk: "60 min", stairmaster: "30 min", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "75 min", stairmaster: "35 min", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "90 min", stairmaster: "40 min", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "45 min easy", stairmaster: "20 min easy", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "90 min", stairmaster: "35 min", optionalSecondRun: "6 rounds, replaces choice" },
  { hikeOrLongWalk: "105 min", stairmaster: "40 min", optionalSecondRun: "6 rounds, replaces choice" },
  { hikeOrLongWalk: "120 min", stairmaster: "45 min", optionalSecondRun: "7 rounds, replaces choice" },
  { hikeOrLongWalk: "60 min easy", stairmaster: "25 min easy", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "90 min", stairmaster: "40 min", optionalSecondRun: "6 rounds, replaces choice" },
  { hikeOrLongWalk: "105-120 min", stairmaster: "45 min", optionalSecondRun: "6-7 rounds, replaces choice" },
  { hikeOrLongWalk: "75-90 min controlled", stairmaster: "30 min controlled", optionalSecondRun: "Not permitted" },
  { hikeOrLongWalk: "45-60 min easy", stairmaster: "25 min easy", optionalSecondRun: "Not permitted" },
];

export const HEART_RATE = {
  bands: [
    { range: "Below 120", use: "Warm up gradually for 5-8 minutes." },
    { range: "120-145", use: "Primary steady-work band." },
    { range: "146-155", use: "Brief controlled use." },
    { range: "Above 155", use: "Reduce pace or level. Easy if repeatedly 165+." },
  ],
  trailBands: [
    { range: "125-150", use: "Normal long-work band." },
    { range: "151-165", use: "Brief climbing." },
    { range: "Above 165", use: "Slow when practical. Repeated 175+ helps classify the outing as hard." },
  ],
  overshootRule:
    "One brief reading above 180 means walk immediately and extend recovery. Two overshoots in the same session end the running intervals. Continue only with easy walking when comfortable.",
  controlPriority: [
    "Symptoms and stop rules",
    "Talk test",
    "Session RPE",
    "Recovery response",
    "Heat and environment",
    "Heart-rate cap",
    "Displayed zone",
  ],
  sensorHierarchy: [
    "Continuous paired external sensor",
    "Apple Watch",
    "Machine handles, spot checks only",
  ],
  sensorConflictRule: "If sources differ by more than 10 bpm for over 2 minutes, log both and use the continuous external source.",
  observedMaxBpm: 191,
  restingBpm: 69,
  initialCapBpm: 170,
  approvedUpperCapBpm: 175,
} as const;

const tuesday: ConditioningDay = {
  id: "tuesday",
  kind: "conditioning",
  title: "Tuesday",
  focus: "Run-walk default, base-cardio replacement",
  mission: "Train controlled surge and recovery without stealing Wednesday squat quality.",
  normalMinutes: [25, 45],
  steps: [
    "Walk 10 minutes, gradually reaching 120-140 bpm",
    "Jog using the week's time or bpm cap, whichever arrives first",
    "Walk all the way back to 135-140 before the next round",
    "Complete only the week's round target",
    "Finish with at least 5 easy minutes and record recovery",
  ],
  rules: [
    "StairMaster: progress time first. Change one level at a time. Hold rails for balance only.",
    "Rowing: use the weekly time minus 5 minutes. Keep strokes smooth, generally 20-24 per minute.",
    "Outdoor: brisk or incline walking. Choose pace and grade from heart rate, breathing, symptoms, and footing.",
    "Advance: at least 80% of steady work in band, no symptoms, no major drift, normal next-day squat. Hold: repeated reductions, about 10 bpm late drift, or one worse Wednesday. Reduce: unusual symptoms, steady work above 155 despite backing off, or squat quality degrades twice.",
    "Automatic relocation: move the default run from Tuesday to Saturday after two consecutive Wednesdays with squat warm-ups at least 2 RPE points harder or squat load reduced because Tuesday fatigue remained. Then Tuesday becomes base cardio and Saturday uses the current Tuesday run protocol with no optional second run. After two normal Wednesdays one Tuesday return trial is allowed.",
    "Record modality, time, distance, pace or level or incline, average and peak heart rate, minutes in band, sensor source, 1- and 2-minute recovery, symptoms, and next-day strength effect.",
  ],
  winCondition:
    "Recovery returns to 135-140, the cap is respected, and Wednesday squat warm-ups remain normal. Better pace at the same cap or faster recovery is progress. A higher peak is not.",
};

const thursday: ConditioningDay = {
  id: "thursday",
  kind: "recovery",
  title: "Thursday",
  focus: "Walking, mobility, no makeup volume",
  mission: "Create space between Wednesday squat work and Friday training. Finish fresher than you started.",
  normalMinutes: [0, 45],
  steps: [
    "Easy walking: 30-45 minutes",
    "Bodyweight squat: 2x10 to comfortable depth",
    "Hip hinge drill: 2x10",
    "Ankle rocks: 2x10 per side",
    "Thoracic rotation: 2x8 per side",
    "Band pull-aparts: 2x15",
  ],
  rules: [
    "Thursday is not a hidden fifth lifting day. Mobility should improve position and breathing, not create soreness.",
    "Bodyweight squat: slow descent, whole foot loaded, comfortable symptom-free depth, easy breathing. Hip hinge: push hips back while keeping the trunk long; stop before range changes position. Upper body: rotate through the upper back; pull the band apart without arching the low back.",
    "Use recovery status when illness symptoms are present, energy is very poor, warm-up mechanics are altered, or symptoms make the planned session inappropriate.",
  ],
  winCondition: "Walking stays easy, mobility improves comfort, and Friday's warm-ups feel normal. No hard intervals and no makeup lifting.",
};

const saturday: ConditioningDay = {
  id: "saturday",
  kind: "conditioning",
  title: "Saturday",
  focus: "Hike, long walk, StairMaster, permitted run",
  mission: "Choose exactly one conditioning load. Sunday deadlift quality remains the priority.",
  normalMinutes: [0, 120],
  steps: [
    "Pick one: hike or long walk, StairMaster, or the optional second run when the week permits it",
    "Log choice, duration, distance, elevation or level, heart rate, hard triggers, symptoms, and the Sunday adjustment",
  ],
  rules: [
    "Optional second run only while Tuesday remains the default run day: walk 8-10 minutes, jog 45-75 seconds or to 170 bpm, walk to 135-140, complete only the listed rounds, then walk at least 5 minutes. A relocated Tuesday run uses Tuesday's weekly table instead.",
    "Hard Saturday, any one trigger: longer than 2 hours; sustained steep climbing; more than about 10 minutes above 165; repeated readings above 175; hard run or marked leg fatigue; legs clearly fatigued Sunday morning.",
    "Sunday consequence of a hard Saturday: 90% of Sunday's scheduled top for 2 work sets at the scheduled reps, no additional deadlift back-offs, cap at RPE 7, omit hip thrust, trim pull and row sets when fatigue remains. Deload weeks keep the RPE 6 cap.",
  ],
  winCondition:
    "The chosen session is logged honestly, no second conditioning load is stacked, and Sunday is adjusted before warm-ups when a hard trigger occurred.",
};

export const DAYS: ProgramDay[] = [monday, tuesday, wednesday, thursday, friday, saturday, sunday];

export const DELOAD_AND_READINESS = {
  deloadWeeks: [4, 8],
  deloadRules: [
    "Use the listed main-lift loads",
    "No set above RPE 6",
    "Normal 2 sets becomes 1; normal 3 sets becomes 2",
    "About 80% of the last earned accessory load",
    "No optional second run",
    "Easy conditioning only",
    "No bonus sets because the day feels easy",
  ],
  fullSession: ["Normal energy", "Normal warm-up feel", "Expected technique", "No unresolved meaningful symptoms"],
  reducedSession: ["Remove one back-off set", "Cap all work at RPE 7", "Remove the final two accessories", "Conditioning easy only"],
  recoverySession: "Easy walking and mobility when illness symptoms, very poor energy, or altered warm-up mechanics are present.",
  warningPattern: [
    "Poor sleep",
    "Unusually low or wired energy",
    "Warm-ups meaningfully heavier",
    "Hard conditioning remains in the legs",
    "Several measures moving away from normal together",
  ],
  singleNumberRule:
    "One HRV value, resting-heart-rate value, or isolated heart-rate spike does not decide the session by itself. Review trends, sleep, soreness, energy, symptoms, and warm-up performance together.",
  noHeavyMakeupDays: "Missed work follows the written re-entry rule and is never stacked on another heavy session.",
} as const;

export const WEEK_12_CHECKS = {
  eligibilityGate:
    "The matching Week 11 top and back-offs must be completed with no hold, reduction, substitute, missed work, symptom worsening, or technique change. Squat and deadlift also require accepted S and D. Top RPE 7.5 or lower, back-offs 8 or lower.",
  ifGateMissed: "Bench 150 for 2x5. Squat 70% of S for 2x3. Deadlift 70% of D for 2x3. Cap all at RPE 6, perform no single, and record why the check was not earned.",
  sameDayVeto: [
    "Unexpected warm-up change",
    "Worsening symptoms",
    "Technique no longer repeatable",
    "Hard Saturday before deadlift",
    "Any required rep reaches the stop ceiling early",
  ],
  usefulResult: "Load, reps, RPE, technique, and symptoms at a known stopping point. A clean controlled set is better data than an ugly single.",
} as const;

export function exerciseName(id: string): string {
  return EXERCISES[id]?.name ?? id;
}

export function liftingDays(): LiftingDay[] {
  return DAYS.filter((day): day is LiftingDay => day.kind === "lifting");
}

export function dayById(id: DayId): ProgramDay {
  const day = DAYS.find((item) => item.id === id);
  if (!day) throw new Error(`Unknown day ${id}`);
  return day;
}
