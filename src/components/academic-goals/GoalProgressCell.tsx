"use client";

import { useMemo } from "react";
import { gradeGoalStatuses, gradeGoalTally } from "@/lib/data/gradeGoalProgress";

/**
 * How a grade is getting on with one goal, in a table cell.
 *
 * A count and a bar rather than a single percentage. "62% complete" hides the
 * shape an admin is actually looking for: a goal nobody has started reads very
 * differently from one everybody has started and nobody has finished, and both
 * can average out to the same number.
 *
 * The bar is decoration — every figure it encodes is written out beside it, so
 * nothing here depends on telling three colours apart (WCAG 1.4.1).
 */
export function GoalProgressCell({
  schoolId,
  grade,
  goalId
}: {
  schoolId: string;
  grade: string;
  goalId: string;
}) {
  const tally = useMemo(
    () => gradeGoalTally(gradeGoalStatuses(schoolId, grade, goalId)),
    [schoolId, grade, goalId]
  );

  if (tally.total === 0) {
    return <span className="sf-panel-note">No students enrolled</span>;
  }

  const pct = (value: number) => `${(value / tally.total) * 100}%`;

  return (
    <div className="goal-progress">
      <div className="list-editor-item-title">
        {tally.completed} of {tally.total} completed
      </div>

      <div className="goal-progress-bar" aria-hidden>
        <span className="is-completed" style={{ width: pct(tally.completed) }} />
        <span className="is-progress" style={{ width: pct(tally.inProgress) }} />
        <span className="is-none" style={{ width: pct(tally.notStarted) }} />
      </div>

      <div className="list-editor-item-detail">
        {tally.inProgress} in progress · {tally.notStarted} not started
      </div>
    </div>
  );
}
