import { useEffect, useRef } from "react";

/**
 * Requests a screen wake lock for as long as workout mode is mounted, so the screen does not sleep
 * mid-set. Re-requests when the tab regains visibility (the OS releases wake locks on backgrounding),
 * and releases on unmount. Best-effort: unsupported browsers and permission denials are silently ignored.
 */
export function useWakeLock(): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function requestLock() {
      try {
        const sentinel = await navigator.wakeLock?.request("screen");
        if (!sentinel) return;
        if (cancelled) {
          void sentinel.release();
          return;
        }
        lockRef.current = sentinel;
      } catch {
        // Unsupported or denied: workout mode still functions without it.
      }
    }

    void requestLock();

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && !lockRef.current) void requestLock();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);
}
