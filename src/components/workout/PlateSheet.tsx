import { platesPerSide } from "../../engine/plates";
import { Sheet } from "./Sheet";

export interface PlateSheetProps {
  targetLb: number;
  barLb: number;
  plateSet: number[];
  onClose: () => void;
}

/** Greedy per-side plate breakdown for one target weight, using the owner's bar and plate set. */
export function PlateSheet({ targetLb, barLb, plateSet, onClose }: PlateSheetProps) {
  const { perSide, loaded, shortBy } = platesPerSide(targetLb, barLb, plateSet);
  return (
    <Sheet title="Plate calculator" onClose={onClose}>
      <p className="plate-target">{targetLb} lb target</p>
      <p className="plate-breakdown">{perSide.length > 0 ? perSide.join(" · ") : "Bar only"} per side</p>
      <p className="muted">
        Bar {barLb} lb · Loaded {loaded} lb
      </p>
      {shortBy > 0 && <p className="muted">Short by {shortBy} lb</p>}
    </Sheet>
  );
}
