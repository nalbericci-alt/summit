import { useEffect, useRef, useState } from "react";
import { useSummit } from "../app/state";
import { localIsoDate } from "../app/dates";
import { BackupNudge } from "../components/today/BackupNudge";
import { ClubMeter } from "../components/today/ClubMeter";
import { ConditioningSessionCard } from "../components/today/ConditioningSessionCard";
import { CycleBoundaryCard } from "../components/today/CycleBoundaryCard";
import { LiftingSessionCard } from "../components/today/LiftingSessionCard";
import { ReadinessCard } from "../components/today/ReadinessCard";
import { WeekHeader } from "../components/today/WeekHeader";
import type { LiftingDay } from "../data/program";
import { todayPlan } from "../engine/calendar";
import { buildSession } from "../engine/session";
import type { SessionPlan } from "../engine/session";
import type { LastEarned } from "../engine/loads";
import { createWorkout, findDraftForDate, lastEarnedForLine, listWorkouts, upsertSet } from "../storage/workouts";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_START_HASH = "#/today/start";

interface SessionInfo {
  session: SessionPlan | null;
  exerciseCount: number;
  draftId: string | null;
}

/** Builds every planned set row for a fresh workout, exactly as the day's session resolves this week. */
async function writePlannedSets(workoutId: string, session: SessionPlan): Promise<void> {
  for (const exercise of session.exercises) {
    for (const row of exercise.rows) {
      await upsertSet({
        id: `${workoutId}:${row.rowId}`,
        workoutId,
        lineId: row.lineId,
        exerciseId: row.exerciseId,
        substituteExerciseId: null,
        setIndex: row.setIndex,
        role: row.role,
        setType: "working",
        plannedLb: row.load.lb,
        plannedReps: row.reps,
        perHand: row.load.perHand,
        actualLb: null,
        actualReps: null,
        rpe: null,
        rir: null,
        completed: false,
        completedAt: null,
        note: "",
      });
    }
  }
}

export function TodayScreen() {
  const { settings } = useSummit();
  const [today] = useState(() => new Date());
  const todayISO = localIsoDate(today);
  const plan = todayPlan(today, settings.cycleStart);
  const isLiftingDay = plan.day.kind === "lifting";
  const isSunday = today.getDay() === 0;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasCompleteWorkout, setHasCompleteWorkout] = useState(false);
  const autoStartRef = useRef(false);

  useEffect(() => {
    if (plan.week == null || !isLiftingDay) {
      setSessionInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const day = plan.day as LiftingDay;
      const lastEarnedByLine: Record<string, LastEarned> = {};
      for (const line of day.lines) {
        const earned = await lastEarnedForLine(line.lineId);
        if (earned) lastEarnedByLine[line.lineId] = earned;
      }
      const session = buildSession(plan.week as number, plan.dayId, settings.baselines, lastEarnedByLine);
      const draft = await findDraftForDate(todayISO);
      if (!cancelled) {
        setSessionInfo({ session, exerciseCount: session?.exercises.length ?? 0, draftId: draft?.id ?? null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan.week, plan.dayId, isLiftingDay, settings.baselines, todayISO]);

  useEffect(() => {
    if (!isSunday) return;
    let cancelled = false;
    (async () => {
      const complete = await listWorkouts({ status: "complete", limit: 1 });
      if (!cancelled) setHasCompleteWorkout(complete.length > 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSunday]);

  async function startOrResume() {
    if (plan.week == null || !isLiftingDay || !sessionInfo) return;
    setBusy(true);
    try {
      if (sessionInfo.draftId) {
        window.location.hash = `#/workout/${sessionInfo.draftId}`;
        return;
      }
      const workout = await createWorkout({ date: todayISO, week: plan.week, dayId: plan.dayId });
      if (sessionInfo.session) await writePlannedSets(workout.id, sessionInfo.session);
      window.location.hash = `#/workout/${workout.id}`;
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoStartRef.current) return;
    if (window.location.hash !== AUTO_START_HASH) return;
    if (plan.week == null) return;
    if (isLiftingDay && !sessionInfo) return;
    autoStartRef.current = true;
    if (isLiftingDay) void startOrResume();
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/today`);
    // startOrResume intentionally omitted: it closes over sessionInfo, and re-running this effect on every
    // sessionInfo change would fight the autoStartRef guard. The guard above already re-checks readiness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.week, isLiftingDay, sessionInfo]);

  const lastBackupAt = settings.lastBackupAt;
  const backupIsStale = lastBackupAt != null && Date.now() - new Date(lastBackupAt).getTime() > SEVEN_DAYS_MS;
  const showBackupNudge = isSunday && ((lastBackupAt == null && hasCompleteWorkout) || backupIsStale);

  return (
    <section className="content">
      <h1>Today</h1>

      {plan.week == null ? (
        <CycleBoundaryCard kind={todayISO < settings.cycleStart ? "before" : "after"} cycleStart={settings.cycleStart} />
      ) : (
        <>
          <WeekHeader week={plan.week} date={today} weekMeta={plan.weekMeta!} />
          {plan.day.kind === "lifting" ? (
            <LiftingSessionCard
              day={plan.day}
              exerciseCount={sessionInfo?.exerciseCount ?? 0}
              hasDraft={!!sessionInfo?.draftId}
              busy={busy}
              onStart={() => void startOrResume()}
            />
          ) : (
            <ConditioningSessionCard day={plan.day} week={plan.week} />
          )}
        </>
      )}

      <ClubMeter baselineS={settings.baselines.S} baselineD={settings.baselines.D} />
      <ReadinessCard date={todayISO} />
      {showBackupNudge && <BackupNudge />}
    </section>
  );
}
