import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetSummitDbForTests } from "./db";
import { SETTINGS_DEFAULTS, getAllSettings, getSetting, setSetting } from "./settings";

beforeEach(async () => {
  await resetSummitDbForTests();
});

describe("settings", () => {
  it("returns typed defaults before anything is written", async () => {
    expect(await getSetting("units")).toBe("lb");
    expect(await getSetting("effortInput")).toBe("rpe");
    expect(await getSetting("theme")).toBe("dark");
    expect(await getSetting("bigType")).toBe(false);
    expect(await getSetting("handedness")).toBe("right");
    expect(await getSetting("restDefaults")).toEqual({ mainLift: 180, accessory: 90 });
    expect(await getSetting("plateSet")).toEqual([45, 35, 25, 10, 5, 2.5]);
    expect(await getSetting("barLb")).toBe(45);
    expect(await getSetting("cycleStart")).toBe(SETTINGS_DEFAULTS.cycleStart);
    expect(await getSetting("baselines")).toEqual(SETTINGS_DEFAULTS.baselines);
    expect(await getSetting("lastBackupAt")).toBeNull();
  });

  it("round-trips a written value", async () => {
    await setSetting("units", "kg");
    expect(await getSetting("units")).toBe("kg");

    await setSetting("restDefaults", { mainLift: 150, accessory: 75 });
    expect(await getSetting("restDefaults")).toEqual({ mainLift: 150, accessory: 75 });

    await setSetting("lastBackupAt", "2026-09-01T12:00:00.000Z");
    expect(await getSetting("lastBackupAt")).toBe("2026-09-01T12:00:00.000Z");
  });

  it("does not let a caller mutate the shared default object", async () => {
    const first = await getSetting("restDefaults");
    first.mainLift = 999;
    const second = await getSetting("restDefaults");
    expect(second.mainLift).toBe(180);
  });

  it("getAllSettings merges stored values over defaults", async () => {
    await setSetting("theme", "light");
    await setSetting("bigType", true);
    const all = await getAllSettings();
    expect(all.theme).toBe("light");
    expect(all.bigType).toBe(true);
    expect(all.units).toBe("lb"); // untouched, still default
    expect(all.plateSet).toEqual([45, 35, 25, 10, 5, 2.5]);
  });
});
