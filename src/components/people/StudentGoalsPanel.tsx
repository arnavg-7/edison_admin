"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  CREATOR_ROLE_LABELS,
  SCOPE_TYPE_LABELS,
  assignmentFor,
  canSetStatus,
  scopeLabel,
  sessionLabel,
  statusTone,
  statusesFor,
  targetSentence,
  whyReadOnly,
  type Goal,
  type GoalAssignment,
  type GoalStatus
} from "@/lib/data/goals";
import { useGoals } from "@/lib/goals-store";
import { useAdminActor, useAdminScope } from "@/lib/admin-scope";
import { useMounted } from "@/lib/use-mounted";
import { formatDateRangeOnly, formatSalesforceStamp } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Every goal one student is working to, whoever set it.
 *
 * The rulebook's point is that these are one kind of record: a district goal
 * cascaded to this student, a goal their teacher set for their class, and a goal
 * they wrote themselves all sit in the same table and differ by who created them
 * and what they are scoped to. So this is one list, labelled — not a panel per
 * creator, which would imply three different things are being tracked.
 *
 * What an admin may do varies by row, and the row says so: status is theirs to
 * move on admin- and faculty-created goals, the engine's on auto goals, and the
 * student's alone on anything the student wrote.
 */
export function StudentGoalsPanel({ studentName }: { studentName: string }) {
  const { goals, assignments, progress, setStatus } = useGoals();
  const actor = useAdminActor();
  const { roleLabel } = useAdminScope();
  const mounted = useMounted();

  const [open, setOpen] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<GoalStatus | "">("");
  const [note, setNote] = useState("");

  /* Assignment rather than scope: a student is on a district goal without the
     goal naming them, and reading the scope would miss every cascade. */
  const mine = useMemo(() => {
    const rows: { goal: Goal; assignment: GoalAssignment }[] = [];
    for (const goal of goals) {
      const assignment = assignments(goal).find((row) => row.studentName === studentName)
        ?? assignmentFor(goal, studentName);
      if (assignment) rows.push({ goal, assignment });
    }
    // Live goals first, then archived; within each, the widest scope first.
    const order = ["district", "school", "grade", "class", "student"];
    return rows.sort((a, b) => {
      if (a.goal.isActive !== b.goal.isActive) return a.goal.isActive ? -1 : 1;
      return order.indexOf(a.goal.scopeType) - order.indexOf(b.goal.scopeType);
    });
  }, [goals, assignments, studentName]);

  const met = mine.filter(
    ({ assignment }) =>
      assignment.currentStatus === "Completed" || assignment.currentStatus === "Met"
  ).length;

  const openRow = (id: string, current: GoalStatus) => {
    const next = open === id ? null : id;
    setOpen(next);
    setDraftStatus(next ? current : "");
    setNote("");
  };

  if (!mounted) return null;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Goals</h2>
        <span className="sf-panel-note">
          {mine.length} assigned · {met} met
        </span>
      </div>

      <p className="sf-panel-note goals-panel-intro">
        Every goal {studentName} is working to — set by the district, their school, a teacher, or by
        themselves. Set and edited in{" "}
        <Link className="sf-inline-link" href="/academic-goals">
          Academic Goals
        </Link>
        ; progress can be recorded here.
      </p>

      {mine.length === 0 ? (
        <EmptyState
          title="No goals assigned"
          message="Goals appear here once one is set at this student's district, school, grade or class, or for them individually."
          action={
            <Button size="sm" href="/academic-goals">
              Open Academic Goals
            </Button>
          }
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table sf-table--expandable">
            <thead>
              <tr>
                <th scope="col">Goal</th>
                <th scope="col">Set by</th>
                <th scope="col">Window</th>
                <th scope="col">Status</th>
                <th scope="col">Last change</th>
              </tr>
            </thead>
            <tbody>
              {mine.map(({ goal, assignment }) => {
                const history = progress(goal, assignment);
                const latest = history[0];
                const isOpen = open === assignment.id;
                const writable = canSetStatus(actor, goal);
                const statuses = statusesFor(goal.measurementType);
                const target = targetSentence(goal);

                return (
                  <Fragment key={assignment.id}>
                    <tr>
                      <td>
                        <div className="sf-row-expander">
                          <button
                            type="button"
                            className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                            aria-expanded={isOpen}
                            onClick={() => openRow(assignment.id, assignment.currentStatus)}
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                            <span className="sf-sr-only">
                              {isOpen
                                ? `Hide history for ${goal.title}`
                                : `Show history for ${goal.title}`}
                            </span>
                          </button>
                          <div>
                            <div className="list-editor-item-title">
                              {goal.title}
                              {goal.isActive ? null : (
                                <StatusBadge tone="neutral">Archived</StatusBadge>
                              )}
                            </div>
                            <div className="list-editor-item-detail">{goal.description}</div>
                            {/* Scope, and the target when the system computes it —
                                between them they say why this student has the
                                goal at all and what would satisfy it. */}
                            <div className="goal-row-tags">
                              <span className="student-goal-tag is-category">
                                {SCOPE_TYPE_LABELS[goal.scopeType]} · {scopeLabel(goal)}
                              </span>
                              {target ? (
                                <span className="student-goal-tag is-skill">{target}</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="list-editor-item-title">{goal.createdBy}</div>
                        <div className="list-editor-item-detail">
                          {CREATOR_ROLE_LABELS[goal.creatorRole]}
                        </div>
                      </td>
                      <td>
                        <div className="list-editor-item-title">
                          {sessionLabel(goal.academicSessionId)}
                        </div>
                        <div className="list-editor-item-detail">
                          {formatDateRangeOnly(goal.startDate, goal.endDate)}
                        </div>
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(assignment.currentStatus)}>
                          {assignment.currentStatus}
                        </StatusBadge>
                      </td>
                      <td>
                        {latest ? (
                          <>
                            <div className="list-editor-item-title">
                              {formatSalesforceStamp(latest.changedAt)}
                            </div>
                            <div className="list-editor-item-detail">
                              {latest.changedBy === "system" ? "System" : latest.changedBy}
                            </div>
                          </>
                        ) : (
                          "Not reported yet"
                        )}
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="sf-subrow">
                        <td colSpan={5}>
                          <div className="goal-history">
                            {writable ? (
                              <div className="goal-history-write">
                                <label className="sf-field">
                                  <span>Move to</span>
                                  <Combobox
                                    options={statuses.map((entry) => ({
                                      value: entry,
                                      label: entry
                                    }))}
                                    value={draftStatus}
                                    onChange={(next) => setDraftStatus(next as GoalStatus)}
                                    ariaLabel={`Set status for ${goal.title}`}
                                  />
                                </label>
                                <label className="sf-field sf-field--search">
                                  <span>Progress note (optional)</span>
                                  <input
                                    type="text"
                                    value={note}
                                    placeholder="What changed, and how you know"
                                    onChange={(event) => setNote(event.target.value)}
                                  />
                                </label>
                                <Button
                                  size="sm"
                                  isDisabled={
                                    !draftStatus || draftStatus === assignment.currentStatus
                                  }
                                  onClick={() => {
                                    if (!draftStatus) return;
                                    setStatus({
                                      goal,
                                      assignment,
                                      status: draftStatus,
                                      note,
                                      actor: roleLabel
                                    });
                                    setNote("");
                                  }}
                                >
                                  Record change
                                </Button>
                              </div>
                            ) : (
                              <p className="sf-panel-note">
                                {goal.measurementType === "auto"
                                  ? "Computed from the POAG rating — recalculated on every rating change, so a hand-set value would be overwritten."
                                  : whyReadOnly(actor, goal)}
                              </p>
                            )}

                            <table className="sf-subtable">
                              <thead>
                                <tr>
                                  <th scope="col">Change</th>
                                  <th scope="col">By</th>
                                  <th scope="col">When</th>
                                  <th scope="col">Note</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map((entry) => (
                                  <tr key={entry.id}>
                                    <td>
                                      {entry.previousStatus ? `${entry.previousStatus} → ` : ""}
                                      <strong>{entry.newStatus}</strong>
                                    </td>
                                    <td>
                                      {entry.changedBy === "system" ? "System" : entry.changedBy}
                                    </td>
                                    <td>{formatSalesforceStamp(entry.changedAt)}</td>
                                    <td>{entry.note ?? "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Says the two rules that explain everything above: the vocabulary is
          fixed, and history is appended rather than edited. */}
      <p className="sf-panel-note">
        Statuses follow the fixed R1 vocabulary — no custom labels. Every change is appended with
        who made it and when; nothing is overwritten.
      </p>
    </div>
  );
}
