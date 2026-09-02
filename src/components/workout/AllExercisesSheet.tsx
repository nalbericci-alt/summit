import { exerciseName } from "../../data/program";
import { Sheet } from "./Sheet";
import type { ExerciseGroup } from "./types";

export interface AllExercisesSheetProps {
  groups: ExerciseGroup[];
  currentIndex: number;
  onJump: (index: number) => void;
  onClose: () => void;
}

/** Jump list for the exercise pager: every exercise in this workout with its completed/planned count. */
export function AllExercisesSheet({ groups, currentIndex, onJump, onClose }: AllExercisesSheetProps) {
  return (
    <Sheet title="All exercises" onClose={onClose}>
      <ul className="exercise-jump-list">
        {groups.map((group, index) => {
          const completed = group.sets.filter((s) => s.completed).length;
          const name = group.planned?.name ?? exerciseName(group.exerciseId);
          return (
            <li key={group.lineId}>
              <button
                type="button"
                className={index === currentIndex ? "exercise-jump-item active" : "exercise-jump-item"}
                onClick={() => {
                  onJump(index);
                  onClose();
                }}
              >
                <span>{name}</span>
                <span className="muted">
                  {completed} / {group.sets.length}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
