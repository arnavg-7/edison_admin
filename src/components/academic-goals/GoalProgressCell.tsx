"use client";

import { useMemo } from "react";
import { gradeGoalStatuses, gradeGoalTally } from "@/lib/data/gradeGoalProgress";
import type { GradeGoal } from "@/lib/data/academicGoals";
import { usePoag } from "@/lib/poag-store";

/**
 * How a grade is getting on with one goal, in a table cell.
 *
 * A count and a bar rather than a single percentage. "62% complete" hides the
 * shape an admin is actually looking for: a goal nobody has started reads very
 * differently from one everybody has started and nobody has finished, and both
 * can average out to the same number.
 *
 * The wording follows the goal's type, because the two mean different things. On
 * a manual goal the students reported it; on an auto goal the system computed it
 * from their ratings, and the third bucket is not "not started" but "short of the
 * level" — nobody can fail to start a goal that measures itself.
 *
 * The bar is decoration — every figure it encodes is written out beside it, so
 * nothing here depends on telling three colours apart (WCAG 1.4.1).
 */
export function GoalProgressCell({
  schoolId,
  grade,
  goal
}: {
  schoolId: string;
  grade: string;
  goal: GradeGoal;
}) {
  /* The live scale, so a renamed level is respected rather than the seed being
     assumed — the required level on the goal is one of these labels. */
  const { levels } = usePoag();
  const levelLabels = useMemo(() => levels.map((level) => level.label), [levels]);

  const tally = useMemo(
    () => gradeGoalTally(gradeGoalStatuses(schoolId, grade, goal, levelLabels)),
    [schoolId, grade, goal, levelLabels]
  );

  if (tally.total === 0) {
    return <span className="sf-panel-note">No students enrolled</span>;
  }

  const auto = goal.measurement.type === "auto";
  const pct = (value: number) => `${(value / tally.total) * 100}%`;

  return (
    <div className="goal-progress">
      <div className="list-editor-item-title">
        {tally.achieved} of {tally.total} {auto ? "met" : "completed"}
      </div>

      <div className="goal-progress-bar" aria-hidden>
        <span className="is-completed" style={{ width: pct(tally.achieved) }} />
        <span className="is-progress" style={{ width: pct(tally.underway) }} />
        <span className="is-none" style={{ width: pct(tally.behind) }} />
      </div>

      <div className="list-editor-item-detail">
        {auto
          ? `${tally.underway} on track · ${tally.behind} short`
          : `${tally.underway} in progress · ${tally.behind} not started`}
      </div>
    </div>
  );
}
