import { useEffect, useState } from "react";
import { useSummit } from "../app/state";
import { dayById } from "../data/program";
import type { SessionPlan } from "../engine/session";
import { restDurationFor } from "../engine/restTimer";
import { AllExercisesSheet } from "../components/workout/AllExercisesSheet";
import { ControlBar } from "../components/workout/ControlBar";
import { ExercisePanel } from "../components/workout/ExercisePanel";
import { FinishScreen } from "../components/workout/FinishScreen";
import { HistorySheet } from "../components/workout/HistorySheet";
import { PlateSheet } from "../components/workout/PlateSheet";
import { RestTimerBar } from "../components/workout/RestTimerBar";
import { WorkoutTopBar } from "../components/workout/WorkoutTopBar";
import { useRestTimer } from "../components/workout/useRestTimer";
import { useWakeLock } from "../components/workout/useWakeLock";
import { useWorkoutData } from "../components/workout/useWorkoutData";
import type { ExerciseGroup } from "../components/workout/types";
import { recentPerformances } from "../storage/history";
import type { ExercisePerformance } from "../storage/history";
import { lastPerformance } from "../storage/workouts";
import type { SetRecord } from "../storage/schema";

export interface WorkoutScreenProps {
  workoutId: string;
  /** True for the #/workout/<id>/finish route: renders the finish flow instead of the logging pager. */
  finish?: boolean;
}

/** The exercise this exercise is superset with, resolved to its display name for the header and rest bar. */
function supersetPartnerName(group: ExerciseGroup | undefined, session: SessionPlan | null): string | null {
  const partnerLineId = group?.planned?.supersetWith;
  if (!partnerLineId) return null;
  return session?.exercises.find((e) => e.lineId === partnerLineId)?.name ?? null;
}

/** Full-screen workout mode: one exercise at a time, plus the finish flow, for #/workout/<id>[/finish]. */
export function WorkoutScreen({ workoutId, finish = false }: WorkoutScreenProps) {
  const { settings } = useSummit();
  const { workout, sets, session, groups, reload } = useWorkoutData(workoutId, settings.baselines);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allExercisesOpen, setAllExercisesOpen] = useState(false);
  const [plateTarget, setPlateTarget] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPerformances, setHistoryPerformances] = useState<ExercisePerformance[]>([]);
  const [lastTimePerformance, setLastTimePerformance] = useState<SetRecord[]>([]);
  const restTimer = useRestTimer();

  useWakeLock();

  useEffect(() => {
    if (groups.length > 0 && currentIndex >= groups.length) setCurrentIndex(groups.length - 1);
  }, [groups.length, currentIndex]);

  const currentGroup = groups[currentIndex];

  useEffect(() => {
    if (!currentGroup) {
      setLastTimePerformance([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await lastPerformance(currentGroup.exerciseId, workoutId);
      if (!cancelled) setLastTimePerformance(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentGroup?.exerciseId, workoutId]);

  if (workout === undefined) {
    return (
      <section className="content">
        <p className="muted">Loading...</p>
      </section>
    );
  }

  if (workout === null) {
    return (
      <section className="content">
        <h1>Workout not found</h1>
        <a className="button-secondary" href="#/today">
          Back to Today
        </a>
      </section>
    );
  }

  if (finish) {
    return (
      <FinishScreen
        workout={workout}
        sets={sets}
        onBack={() => (window.location.hash = `#/workout/${workoutId}`)}
        onSaved={() => (window.location.hash = "#/today")}
      />
    );
  }

  const day = dayById(workout.dayId);
  const partnerName = supersetPartnerName(currentGroup, session);

  async function handleOpenHistory() {
    if (!currentGroup) return;
    setHistoryPerformances(await recentPerformances(currentGroup.exerciseId, 5, workoutId));
    setHistoryOpen(true);
  }

  function handleStartRest(partner: string | null) {
    if (!currentGroup) return;
    const seconds = restDurationFor(currentGroup.exerciseId, currentGroup.planned?.restSeconds, settings.restDefaults);
    restTimer.start(seconds * 1000, partner);
  }

  return (
    <div className={settings.handedness === "left" ? "workout-screen left-handed" : "workout-screen"}>
      <WorkoutTopBar
        title={day.title}
        startedAt={workout.startedAt}
        normalMinutes={day.normalMinutes}
        onExit={() => (window.location.hash = "#/today")}
        onFinish={() => (window.location.hash = `#/workout/${workoutId}/finish`)}
      />

      <div className="workout-body">
        {currentGroup ? (
          <ExercisePanel
            key={currentGroup.lineId}
            group={currentGroup}
            index={currentIndex}
            total={groups.length}
            workoutId={workoutId}
            effortInput={settings.effortInput}
            supersetPartnerName={partnerName}
            lastTimePerformance={lastTimePerformance}
            onChanged={reload}
            onStartRest={handleStartRest}
            onOpenAllExercises={() => setAllExercisesOpen(true)}
            onOpenPlates={setPlateTarget}
            onOpenHistory={() => void handleOpenHistory()}
          />
        ) : (
          <p className="muted">Nothing planned for this day.</p>
        )}
      </div>

      <RestTimerBar timer={restTimer} />
      <ControlBar
        canPrevious={currentIndex > 0}
        canNext={currentIndex < groups.length - 1}
        onPrevious={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        onNext={() => setCurrentIndex((i) => Math.min(groups.length - 1, i + 1))}
      />

      {allExercisesOpen && (
        <AllExercisesSheet groups={groups} currentIndex={currentIndex} onJump={setCurrentIndex} onClose={() => setAllExercisesOpen(false)} />
      )}
      {plateTarget != null && (
        <PlateSheet targetLb={plateTarget} barLb={settings.barLb} plateSet={settings.plateSet} onClose={() => setPlateTarget(null)} />
      )}
      {historyOpen && currentGroup && (
        <HistorySheet
          exerciseName={currentGroup.planned?.name ?? currentGroup.exerciseId}
          performances={historyPerformances}
          effortInput={settings.effortInput}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  );
}
