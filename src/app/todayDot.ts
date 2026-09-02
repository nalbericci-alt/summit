export interface TodayDotInput {
  isLiftingDay: boolean;
  hasCompleteWorkoutToday: boolean;
  week: number | null;
}

/** True when today is a lifting day inside the 12-week cycle and no complete workout is logged for it yet. */
export function todayNeedsDot({ isLiftingDay, hasCompleteWorkoutToday, week }: TodayDotInput): boolean {
  if (week == null) return false;
  if (!isLiftingDay) return false;
  return !hasCompleteWorkoutToday;
}
