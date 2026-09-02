import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { BackupCard } from "../components/more/BackupCard";
import { PreferencesCard } from "../components/more/PreferencesCard";
import { ProgramCard } from "../components/more/ProgramCard";
import { SafetyCard } from "../components/more/SafetyCard";

function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    setStandalone(
      nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
    );
  }, []);
  return standalone;
}

export function MoreScreen() {
  const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();
  const standalone = useStandalone();
  const builtAt = new Date(__SUMMIT_BUILT_AT__);

  return (
    <section className="content">
      <h1>More</h1>

      <ProgramCard />
      <PreferencesCard />
      <BackupCard />
      <SafetyCard />

      <div className="card">
        <h2>Install on your iPhone</h2>
        {standalone ? (
          <p className="ok">Installed. You are running Summit from the home screen.</p>
        ) : (
          <ol>
            <li>Open this page in Safari.</li>
            <li>Tap Share, then Add to Home Screen.</li>
            <li>Open Summit from the home screen. It works with airplane mode on.</li>
          </ol>
        )}
      </div>

      <div className="card">
        <h2>Offline</h2>
        <p className={offlineReady[0] ? "ok" : "muted"}>
          {offlineReady[0]
            ? "Ready offline. The app is cached on this phone."
            : "Caching for offline use. Reopen once online and this will read Ready offline."}
        </p>
        {needRefresh[0] && (
          <button type="button" className="button" onClick={() => updateServiceWorker(true)}>
            Update to the latest build
          </button>
        )}
      </div>

      <div className="card">
        <h2>Build</h2>
        <p className="muted mono">
          {__SUMMIT_COMMIT__} · {builtAt.toLocaleString()}
        </p>
        <p className="muted">Phase 1: program data, Today, workout mode, and backup.</p>
      </div>
    </section>
  );
}
