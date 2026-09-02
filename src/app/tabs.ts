export type TabId = "today" | "plan" | "progress" | "trails" | "more";

export interface Tab {
  id: TabId;
  label: string;
  hash: string;
}

export const TABS: readonly Tab[] = [
  { id: "today", label: "Today", hash: "#/today" },
  { id: "plan", label: "Plan", hash: "#/plan" },
  { id: "progress", label: "Progress", hash: "#/progress" },
  { id: "trails", label: "Trails", hash: "#/trails" },
  { id: "more", label: "More", hash: "#/more" },
];

export const DEFAULT_TAB: TabId = "today";

/** Resolve a location hash such as "#/plan" or "#/plan/week/9" to a tab. Unknown hashes go to Today. */
export function tabFromHash(hash: string): TabId {
  const segment = hash.replace(/^#\/?/, "").split("/")[0];
  const match = TABS.find((tab) => tab.id === segment);
  return match ? match.id : DEFAULT_TAB;
}
