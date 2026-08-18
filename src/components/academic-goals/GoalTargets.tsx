"use client";

import { useMemo } from "react";
import type { GradeGoal } from "@/lib/data/academicGoals";
import {
  evaluateThresholds,
  gradeGoalStatuses,
  levelDistribution
} from "@/lib/data/gradeGoalProgress";
import { usePoag } from "@/lib/poag-store";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Whether the grade as a whole is where the goal says it should be.
 *
 * Separate from the student list below it, because it answers a different
 * question. The list is "who needs help"; this is "is this grade acceptable" —
 * and a grade can be full of individuals making progress and still be failing a
 * ceiling, or clear a floor while leaving a tail behind.
 *
 * Each target shows the actual figure against the required one, and the spread it
 * was read from, so a Not met is a fact an admin can act on rather than a verdict.
 */
export function GoalTargets({
  schoolId,
  grade,
  goal
}: {
  schoolId: string;
  grade: string;
  goal: GradeGoal;
}) {
  const { levels } = usePoag();
  const levelLabels = useMemo(() => levels.map((level) => level.label), [levels]);

  const { results, spread, total } = useMemo(() => {
    const rows = gradeGoalStatuses(schoolId, grade, goal, levelLabels);
    return {
      results: evaluateThresholds(goal, rows, levelLabels),
      spread: levelDistribution(goal, rows, levelLabels),
      total: rows.length
    };
  }, [schoolId, grade, goal, levelLabels]);

  if (goal.thresholds.length === 0) return null;

  const met = results.filter((result) => result.met).length;

  return (
    <section className="goal-targets">
      <div className="goal-targets-head">
        <h4>Targets for the grade</h4>
        <StatusBadge tone={met === results.length ? "ok" : "error"}>
          {met} of {results.length} met
        </StatusBadge>
      </div>

      <table className="sf-subtable">
        <thead>
          <tr>
            <th scope="col">Target</th>
            <th scope="col">Required</th>
            <th scope="col">Actual</th>
            <th scope="col">Students</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.threshold.id}>
              <td>{result.sentence}</td>
              <td>
                {result.threshold.kind === "floor" ? "≥ " : "≤ "}
                {result.threshold.percent}%
              </td>
              <td>
                <strong>{Math.round(result.actual)}%</strong>
              </td>
              <td className="list-editor-item-detail">
                {result.count} of {result.total}
              </td>
              <td>
                <StatusBadge tone={result.met ? "ok" : "error"}>
                  {result.met ? "Met" : "Not met"}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* The distribution the figures above were read from. Without it a failed
          ceiling says a share is too big but not where the students actually are. */}
      <div className="goal-spread">
        <span className="sf-panel-note">Spread across {total} students</span>
        <ul>
          {spread.map((bucket) => (
            <li key={bucket.level}>
              <span className="goal-spread-level">{bucket.level}</span>
              <span className="goal-spread-bar" aria-hidden>
                <span style={{ width: `${bucket.percent}%` }} />
              </span>
              <span className="goal-spread-figure">
                {Math.round(bucket.percent)}%
                <span className="list-editor-item-detail"> {bucket.count}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
