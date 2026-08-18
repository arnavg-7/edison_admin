"use client";

import {
  breakdownFor,
  breakdownLevelFor,
  meanLevelLabel,
  rollup,
  type Goal,
  type GoalAssignment
} from "@/lib/data/goals";

/**
 * A goal's rollup, and the level below it broken out.
 *
 * Every figure here is aggregated from individual student assignments, including
 * the ones in the breakdown — the rulebook's critical rule is never to average
 * the level below, because a 12-student class and a 30-student class would then
 * carry equal weight in a school figure. So each row calls the same rollup over
 * its own students rather than combining percentages.
 *
 * Read-only aggregation, computed rather than stored.
 */
export function GoalRollup({ goal, rows }: { goal: Goal; rows: GoalAssignment[] }) {
  const totals = rollup(goal, rows);
  const level = breakdownLevelFor(goal);
  const breakdown = level ? breakdownFor(goal, level) : [];

  return (
    <section className="goal-rollup">
      <div className="goal-rollup-head">
        <h3>Rollup</h3>
        <span className="sf-panel-note">
          {totals.met} of {totals.total} students met
          {totals.inactive > 0
            ? ` · ${totals.inactive} left the scope and are excluded`
            : ""}
        </span>
      </div>

      <p className="goal-rollup-figure">
        {Math.round(totals.pct)}%
        {/* Decoration: the two figures it encodes are both written out here. */}
        <span className="goal-progress-bar" aria-hidden>
          <span className="is-met" style={{ width: `${totals.pct}%` }} />
        </span>
        {/* The mean only exists for auto goals: a manual status has no magnitude
            to average. The % answers how many, the mean answers by how much. */}
        {totals.mean !== null ? (
          <span className="goal-rollup-mean">
            mean level &asymp; {meanLevelLabel(totals.mean)} ({totals.mean.toFixed(1)})
          </span>
        ) : null}
      </p>

      {breakdown.length > 1 ? (
        <table className="sf-subtable">
          <thead>
            <tr>
              <th scope="col">{level === "school" ? "School" : "Grade"}</th>
              <th scope="col">Met</th>
              <th scope="col">Students</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((entry) => (
              <tr key={entry.key}>
                <td>{entry.label}</td>
                <td>{entry.rollup.met}</td>
                <td>{entry.rollup.total}</td>
                <td>{Math.round(entry.rollup.pct)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <p className="sf-panel-note">
        Aggregated from individual student records, not averaged from the level below. Faculty- and
        student-created goals are excluded from district reporting in R1.
      </p>
    </section>
  );
}
