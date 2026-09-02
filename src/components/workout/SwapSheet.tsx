import { useState } from "react";
import type { Backup } from "../../data/program";
import { Sheet } from "./Sheet";

export const SWAP_REASONS = ["Busy rack", "Pain", "Missing gear", "Other"] as const;
export type SwapReason = (typeof SWAP_REASONS)[number];

export interface SwapSheetProps {
  backup: Backup;
  onConfirm: (reason: SwapReason) => void;
  onClose: () => void;
}

/** Confirms swapping to the plan's backup substitute for the rest of this exercise, with an honest reason. */
export function SwapSheet({ backup, onConfirm, onClose }: SwapSheetProps) {
  const [reason, setReason] = useState<SwapReason>(SWAP_REASONS[0]);

  return (
    <Sheet title="Swap exercise" onClose={onClose}>
      <p>
        Substitute: <strong>{backup.substituteName}</strong>
      </p>
      <p className="muted">{backup.rule}</p>
      {backup.secondChoice && <p className="muted">Second choice: {backup.secondChoice}</p>}

      <div className="segmented wrap" role="group" aria-label="Reason">
        {SWAP_REASONS.map((option) => (
          <button key={option} type="button" aria-pressed={reason === option} onClick={() => setReason(option)}>
            {option}
          </button>
        ))}
      </div>

      <button type="button" className="button-primary" onClick={() => onConfirm(reason)}>
        Confirm swap
      </button>
    </Sheet>
  );
}
