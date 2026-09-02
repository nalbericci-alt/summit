import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getCheckin, recentCheckins, saveCheckin } from "./checkins";
import { resetSummitDbForTests } from "./db";
import type { CheckinRecord } from "./schema";

beforeEach(async () => {
  await resetSummitDbForTests();
});

function checkin(overrides: Partial<CheckinRecord> & Pick<CheckinRecord, "date">): CheckinRecord {
  return {
    sleep: 2,
    soreness: 2,
    energy: 2,
    symptoms: false,
    note: "",
    createdAt: "2026-09-02T07:00:00.000Z",
    ...overrides,
  };
}

describe("getCheckin / saveCheckin", () => {
  it("returns undefined for a date with no saved check-in", async () => {
    expect(await getCheckin("2026-09-02")).toBeUndefined();
  });

  it("round-trips a saved check-in by date", async () => {
    const record = checkin({ date: "2026-09-02", sleep: 1, soreness: 3, energy: 2, symptoms: false });
    await saveCheckin(record);
    expect(await getCheckin("2026-09-02")).toEqual(record);
  });

  it("overwrites the same date on a second save (idempotent by date key)", async () => {
    await saveCheckin(checkin({ date: "2026-09-02", sleep: 1 }));
    await saveCheckin(checkin({ date: "2026-09-02", sleep: 3 }));
    expect((await getCheckin("2026-09-02"))?.sleep).toBe(3);
  });
});

describe("recentCheckins", () => {
  it("returns check-ins newest date first, capped at the given limit", async () => {
    await saveCheckin(checkin({ date: "2026-08-30" }));
    await saveCheckin(checkin({ date: "2026-09-02" }));
    await saveCheckin(checkin({ date: "2026-08-31" }));

    const all = await recentCheckins(10);
    expect(all.map((c) => c.date)).toEqual(["2026-09-02", "2026-08-31", "2026-08-30"]);

    const capped = await recentCheckins(2);
    expect(capped.map((c) => c.date)).toEqual(["2026-09-02", "2026-08-31"]);
  });

  it("returns an empty array when nothing is saved", async () => {
    expect(await recentCheckins(5)).toEqual([]);
  });
});
