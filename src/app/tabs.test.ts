import { describe, expect, it } from "vitest";
import { DEFAULT_TAB, TABS, tabFromHash } from "./tabs";

describe("tabs", () => {
  it("has the five tabs in order", () => {
    expect(TABS.map((tab) => tab.label)).toEqual(["Today", "Plan", "Progress", "Trails", "More"]);
  });

  it("resolves deep links and falls back to Today", () => {
    expect(tabFromHash("#/plan")).toBe("plan");
    expect(tabFromHash("#/plan/week/9")).toBe("plan");
    expect(tabFromHash("#/trails")).toBe("trails");
    expect(tabFromHash("")).toBe(DEFAULT_TAB);
    expect(tabFromHash("#/nope")).toBe(DEFAULT_TAB);
  });
});
