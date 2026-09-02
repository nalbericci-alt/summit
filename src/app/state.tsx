import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { SETTINGS_DEFAULTS, getAllSettings, setSetting } from "../storage/settings";
import type { SettingKey, SettingsMap } from "../storage/settings";

export interface SummitContextValue {
  ready: boolean;
  settings: SettingsMap;
  updateSetting: <K extends SettingKey>(key: K, value: SettingsMap[K]) => Promise<void>;
  refresh: () => Promise<void>;
}

const SummitContext = createContext<SummitContextValue | null>(null);

/** Resolves "system" against the OS preference and keeps it live. Returns a cleanup function. */
function applyTheme(theme: SettingsMap["theme"]): () => void {
  const root = document.documentElement;
  if (theme === "system") {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme = mql.matches ? "dark" : "light";
    };
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }
  root.dataset.theme = theme;
  return () => {};
}

export function SummitProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<SettingsMap>(SETTINGS_DEFAULTS);

  const refresh = useCallback(async () => {
    const all = await getAllSettings();
    setSettings(all);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => applyTheme(settings.theme), [settings.theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("big-type", settings.bigType);
  }, [settings.bigType]);

  const updateSetting = useCallback(async <K extends SettingKey>(key: K, value: SettingsMap[K]) => {
    await setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo<SummitContextValue>(
    () => ({ ready, settings, updateSetting, refresh }),
    [ready, settings, updateSetting, refresh],
  );

  return <SummitContext.Provider value={value}>{children}</SummitContext.Provider>;
}

export function useSummit(): SummitContextValue {
  const ctx = useContext(SummitContext);
  if (!ctx) throw new Error("useSummit must be used within SummitProvider");
  return ctx;
}
