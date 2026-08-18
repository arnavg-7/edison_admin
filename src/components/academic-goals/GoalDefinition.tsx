"use client";

import {
  AUTO_METRICS,
  TARGET_OPERATOR_LABELS,
  aggregates,
  metricPillar,
  sessionLabel,
  type Goal
} from "@/lib/data/goals";
import { formatDateRangeOnly } from "@/lib/format";

/**
 * What the list row deliberately leaves out.
 *
 * The evaluation window and the full auto-metric contract are useful context and
 * poor scanning material — an admin reading down the table is looking for scope
 * and progress, not comparing date ranges. So they live here, one click in, where
 * there is room to state them properly: the metric key as stored, the operator in
 * words, the window, and which system the value comes from.
 *
 * The rulebook asks for auto metrics to be definable as configuration rather than
 * code — metric_key, operator, target, window, source — so this reads back exactly
 * those five things.
 */
export function GoalDefinition({ goal }: { goal: Goal }) {
  const metric = AUTO_METRICS.find((entry) => entry.key === goal.metricKey);
  const pillar = metricPillar(goal.metricKey);

  return (
    <section className="goal-definition">
      <dl>
        <div>
          <dt>Window</dt>
          <dd>
            {sessionLabel(goal.academicSessionId)}
            <span className="goal-definition-sub">
              {formatDateRangeOnly(goal.startDate, goal.endDate)}
            </span>
          </dd>
        </div>

        <div>
          <dt>Measured</dt>
          <dd>
            {goal.measurementType === "auto" ? "Automatically" : "By hand"}
            <span className="goal-definition-sub">
              {goal.measurementType === "auto"
                ? "Recalculated on every rating change"
                : "A person sets each student's status"}
            </span>
          </dd>
        </div>

        {goal.measurementType === "auto" ? (
          <>
            <div>
              <dt>Metric</dt>
              <dd>
                {pillar ?? goal.metricKey}
                {/* The stored key, not just the friendly name: this is the value
                    an integration is configured against. */}
                <span className="goal-definition-sub">
                  <code>{goal.metricKey}</code>
                </span>
              </dd>
            </div>

            <div>
              <dt>Target</dt>
              <dd>
                Reaches{" "}
                {goal.targetOperator ? TARGET_OPERATOR_LABELS[goal.targetOperator] : "at least"}{" "}
                {goal.targetValue}
                <span className="goal-definition-sub">
                  Scale: {(metric?.values ?? []).join(" → ")}
                </span>
              </dd>
            </div>

            <div>
              <dt>Source</dt>
              <dd>
                Portrait of a Graduate
                <span className="goal-definition-sub">
                  Originates inside the platform, so it needs no external feed
                </span>
              </dd>
            </div>
          </>
        ) : null}

        {/* Said on the goal itself, not only in the rollup panel: an admin
            looking at a faculty goal should know it is absent from reporting
            before they go looking for it in a district figure. */}
        {aggregates(goal) ? null : (
          <div>
            <dt>Reporting</dt>
            <dd>
              Excluded from rollups
              <span className="goal-definition-sub">
                Only admin-created goals aggregate in R1
              </span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
