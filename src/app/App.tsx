import { useEffect, useState } from "react";
import { MoreScreen } from "../screens/MoreScreen";
import { PlaceholderScreen } from "../screens/PlaceholderScreen";
import { DEFAULT_TAB, TABS, tabFromHash, type TabId } from "./tabs";

function useHashTab(): [TabId, (tab: TabId) => void] {
  const [tab, setTab] = useState<TabId>(() =>
    typeof window === "undefined" ? DEFAULT_TAB : tabFromHash(window.location.hash),
  );
  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const go = (next: TabId) => {
    const target = TABS.find((item) => item.id === next);
    if (target) window.location.hash = target.hash;
  };
  return [tab, go];
}

const SCREEN_COPY: Record<Exclude<TabId, "more">, { title: string; note: string }> = {
  today: {
    title: "Today",
    note: "Phase 1 brings today's session, the Start button, the 1000-Pound Club meter, and workout mode.",
  },
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

export function App() {
  const [tab, go] = useHashTab();
  return (
    <div className="app">
      <main className="screen" id="main">
        {tab === "more" ? (
          <MoreScreen />
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
          </button>
        ))}
      </nav>
    </div>
  );
}
