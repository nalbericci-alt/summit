export interface ControlBarProps {
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

/**
 * The fixed bottom control bar for the exercise pager. Order mirrors via the "left-handed" class on
 * the screen root (see styles.css), not here, so it stays correct regardless of which buttons this
 * bar ever grows.
 */
export function ControlBar({ canPrevious, canNext, onPrevious, onNext }: ControlBarProps) {
  return (
    <div className="workout-control-bar">
      <button type="button" className="button-secondary" onClick={onPrevious} disabled={!canPrevious}>
        Previous
      </button>
      <button type="button" className="button-primary" onClick={onNext} disabled={!canNext}>
        Next
      </button>
    </div>
  );
}
