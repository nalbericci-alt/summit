/** Plates available per side, heaviest first; greedy loading tries them in this order. */
export const DEFAULT_PLATES: number[] = [45, 35, 25, 10, 5, 2.5];

/** Standard Olympic bar weight in pounds. */
export const DEFAULT_BAR = 45;

const EPS = 1e-9;

/** Greedy largest-first plate breakdown for one side of the bar to hit a target total load. */
export function platesPerSide(
  targetLb: number,
  barLb: number = DEFAULT_BAR,
  plates: number[] = DEFAULT_PLATES,
): { perSide: number[]; loaded: number; shortBy: number } {
  const perSideTarget = Math.max(0, (targetLb - barLb) / 2);
  const descending = [...plates].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideTarget;
  for (const plate of descending) {
    while (remaining + EPS >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }
  const loaded = barLb + 2 * perSide.reduce((sum, p) => sum + p, 0);
  const shortBy = targetLb - loaded;
  return { perSide, loaded, shortBy };
}
