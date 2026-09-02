import { PROGRAM_META } from "../data/program";
import { DEFAULT_BAR, DEFAULT_PLATES } from "../engine/plates";
import { openSummitDb } from "./db";

export interface RestDefaults {
  mainLift: number;
  accessory: number;
}

export interface BaselineSettings {
  S: number;
  D: number;
}

/** Every known setting and its value type. */
export interface SettingsMap {
  units: "lb" | "kg";
  effortInput: "rpe" | "rir";
  theme: "dark" | "light" | "system";
  bigType: boolean;
  handedness: "right" | "left";
  restDefaults: RestDefaults;
  plateSet: number[];
  barLb: number;
  cycleStart: string;
  baselines: BaselineSettings;
  lastBackupAt: string | null;
}

export type SettingKey = keyof SettingsMap;

/** Typed defaults for every known setting, used when a key has never been written. */
export const SETTINGS_DEFAULTS: SettingsMap = {
  units: "lb",
  effortInput: "rpe",
  theme: "dark",
  bigType: false,
  handedness: "right",
  restDefaults: { mainLift: 180, accessory: 90 },
  plateSet: DEFAULT_PLATES,
  barLb: DEFAULT_BAR,
  cycleStart: PROGRAM_META.defaultCycleStart,
  baselines: { S: PROGRAM_META.baselines.S.lb, D: PROGRAM_META.baselines.D.lb },
  lastBackupAt: null,
};

/** A fresh (deep-cloned) copy of one setting's default, so callers never mutate the shared default. */
function cloneDefault<K extends SettingKey>(key: K): SettingsMap[K] {
  return structuredClone(SETTINGS_DEFAULTS[key]);
}

function assign<K extends SettingKey>(target: SettingsMap, key: K, value: unknown): void {
  target[key] = value as SettingsMap[K];
}

/** Reads one setting, falling back to its typed default when unset. */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingsMap[K]> {
  const db = await openSummitDb();
  const record = await db.get("settings", key);
  return record ? (record.value as SettingsMap[K]) : cloneDefault(key);
}

/** Writes one setting by key. */
export async function setSetting<K extends SettingKey>(key: K, value: SettingsMap[K]): Promise<void> {
  const db = await openSummitDb();
  await db.put("settings", { key, value });
}

/** Reads every known setting, merging stored values over defaults. */
export async function getAllSettings(): Promise<SettingsMap> {
  const db = await openSummitDb();
  const records = await db.getAll("settings");
  const stored = new Map(records.map((record) => [record.key, record.value]));
  const result = {} as SettingsMap;
  for (const key of Object.keys(SETTINGS_DEFAULTS) as SettingKey[]) {
    assign(result, key, stored.has(key) ? stored.get(key) : cloneDefault(key));
  }
  return result;
}
