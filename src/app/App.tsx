import { useEffect, useState } from "react";
import { MoreScreen } from "../screens/MoreScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { TodayScreen } from "../screens/TodayScreen";
import { WorkoutScreen } from "../screens/WorkoutScreen";
import { localIsoDate } from "./dates";
import { useSummit } from "./state";
import { TABS, tabFromHash } from "./tabs";
import type { TabId } from "./tabs";
import { todayNeedsDot } from "./todayDot";
import { todayPlan } from "../engine/calendar";
import { listWorkouts } from "../storage/workouts";

function useHash(): string {
  const [hash, setHash] = useState<string>(() => (typeof window === "undefined" ? "" : window.location.hash));
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  return hash;
}

/** Matches "#/workout/<id>" and "#/workout/<id>/finish", the two full-screen routes that hide the tab bar. */
function workoutIdFromHash(hash: string): string | null {
  const match = /^#\/workout\/([^/]+)/.exec(hash);
  return match ? decodeURIComponent(match[1]) : null;
}

/** True for "#/workout/<id>/finish": tells WorkoutScreen to render the finish flow instead of the pager. */
function isFinishHash(hash: string): boolean {
  return /^#\/workout\/[^/]+\/finish\/?$/.test(hash);
}

const SCREEN_COPY: Record<Exclude<TabId, "more" | "today">, { title: string; note: string }> = {
  plan: {
    title: "Plan",
    note: "Phase 2 brings the 12-week map, every day's full prescription, videos, swaps, and rescheduling.",
  },
  progress: {
    title: "Progress",
    note: "Phase 3 brings tested versus estimated lift charts, PRs, the weekly report, and the conditioning panel.",
  },
  trails: {
    title: "Trails",
    note: "Phase 3 brings the Palisades route cards. Phase 4 adds the Kinnelon pack, GPX import, and the hike recorder.",
  },
};

/** True when today is a lifting day inside the cycle with no complete workout yet. Re-checks on every hash change. */
function useTodayDot(cycleStart: string, hash: string): boolean {
  const [needsDot, setNeedsDot] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const today = new Date();
      const plan = todayPlan(today, cycleStart);
      const todayISO = localIsoDate(today);
      const complete = await listWorkouts({ status: "complete" });
      const hasCompleteWorkoutToday = complete.some((w) => w.date === todayISO);
      if (!cancelled) {
        setNeedsDot(
          todayNeedsDot({ isLiftingDay: plan.day.kind === "lifting", hasCompleteWorkoutToday, week: plan.week }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cycleStart, hash]);
  return needsDot;
}

export function App() {
  const { ready, settings } = useSummit();
  const hash = useHash();
  const workoutId = workoutIdFromHash(hash);
  const tab: TabId = tabFromHash(hash);
  const needsDot = useTodayDot(settings.cycleStart, hash);

  const go = (next: TabId) => {
    const target = TABS.find((item) => item.id === next);
    if (target) window.location.hash = target.hash;
  };

  if (!ready) {
    return (
      <div className="app">
        <main className="screen" id="main" />
        <nav className="tabbar" aria-label="Sections">
          {TABS.map((item) => (
            <button key={item.id} type="button" className="tab" disabled>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  if (workoutId) {
    return (
      <div className="app">
        <main className="screen-full" id="main">
          <WorkoutScreen workoutId={workoutId} finish={isFinishHash(hash)} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <main className="screen" id="main">
        {tab === "more" ? (
          <MoreScreen />
        ) : tab === "today" ? (
          <TodayScreen />
        ) : (
          <PlaceholderScreen title={SCREEN_COPY[tab].title} note={SCREEN_COPY[tab].note} />
        )}
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === tab ? "tab active" : "tab"}
            aria-current={item.id === tab ? "page" : undefined}
            onClick={() => go(item.id)}
          >
            {item.label}
            {item.id === "today" && needsDot && <span className="dot" aria-hidden="true" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
