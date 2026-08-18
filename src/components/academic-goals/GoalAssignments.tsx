"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  canSetStatus,
  statusTone,
  statusesFor,
  whyReadOnly,
  type Goal,
  type GoalAssignment,
  type GoalStatus
} from "@/lib/data/goals";
import { useGoals } from "@/lib/goals-store";
import { useAdminActor, useAdminScope } from "@/lib/admin-scope";
import { formatSalesforceStamp } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { StatusBadge } from "@/components/shared/StatusBadge";

const ALL = "all";
/** Enough to read the shape of a cohort without a 4,800-row wall in a table row. */
const FIRST_PAGE = 20;

/**
 * Every student a goal resolved to, and where each of them has got.
 *
 * The student level of the same picture the row above summarises. Search and the
 * status filter are the point of it — an admin opening this is usually looking
 * for who has not started, not reading a whole district.
 *
 * A status change appends to the history; it never overwrites. Where the admin
 * may not write, the reason is on the panel rather than left as a dead control:
 * auto goals are the engine's to move, and a student's own goal is theirs.
 */
export function GoalAssignments({ goal, rows }: { goal: Goal; rows: GoalAssignment[] }) {
  const { progress, setStatus } = useGoals();
  const actor = useAdminActor();
  const { roleLabel } = useAdminScope();

  const [query, setQuery] = useState("");
  const [status, setStatus_] = useState<string>(ALL);
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<GoalStatus | "">("");
  const [note, setNote] = useState("");

  const writable = canSetStatus(actor, goal);
  const statuses = statusesFor(goal.measurementType);

  const matching = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows
      .filter((row) => status === ALL || row.currentStatus === status)
      .filter((row) => !term || row.studentName.toLowerCase().includes(term));
  }, [rows, query, status]);

  const shown = showAll ? matching : matching.slice(0, FIRST_PAGE);
  const hidden = matching.length - shown.length;

  const openRow = (row: GoalAssignment) => {
    const next = open === row.id ? null : row.id;
    setOpen(next);
    setDraftStatus(next ? row.currentStatus : "");
    setNote("");
  };

  const commit = (row: GoalAssignment) => {
    if (!draftStatus || draftStatus === row.currentStatus) return;
    setStatus({ goal, assignment: row, status: draftStatus, note, actor: roleLabel });
    setNote("");
  };

  return (
    <section className="goal-students">
      <div className="goal-rollup-head">
        <h3>Students</h3>
        <span className="sf-panel-note">
          {rows.length} assigned
          {writable ? "" : ` · read-only (${whyReadOnly(actor, goal) ?? "computed by the system"})`}
        </span>
      </div>

      <div className="sf-filter-bar sf-filter-bar--flush">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by student name"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setShowAll(false);
            }}
          />
        </label>

        <label className="sf-field">
          <span>Status</span>
          <Combobox
            options={[
              { value: ALL, label: "All statuses" },
              ...statuses.map((entry) => ({ value: entry, label: entry }))
            ]}
            value={status}
            onChange={(next) => {
              setStatus_(next);
              setShowAll(false);
            }}
            ariaLabel={`Filter ${goal.title} by student status`}
          />
        </label>
      </div>

      {matching.length === 0 ? (
        <p className="sf-subrow-empty">No assigned students match those filters.</p>
      ) : (
        <>
          <table className="sf-subtable sf-table--expandable">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Grade</th>
                <th scope="col">Status</th>
                <th scope="col">Last change</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => {
                const history = progress(goal, row);
                const latest = history[0];
                const isOpen = open === row.id;

                return (
                  <Fragment key={row.id}>
                    <tr data-inactive={row.isActive ? undefined : true}>
                      <td>
                        <div className="sf-row-expander">
                          <button
                            type="button"
                            className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                            aria-expanded={isOpen}
                            onClick={() => openRow(row)}
                          >
                            <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                            <span className="sf-sr-only">
                              {isOpen
                                ? `Hide history for ${row.studentName}`
                                : `Show history for ${row.studentName}`}
                            </span>
                          </button>
                          {/* Only students with a 360 record are links. */}
                          {row.personId ? (
                            <Link
                              className="sf-bar-group-link"
                              href={`/people/student/${row.personId}`}
                            >
                              {row.studentName}
                            </Link>
                          ) : (
                            <span>{row.studentName}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        Grade {row.grade}
                        {/* Said in words: an inactive assignment is not missing
                            data, it is a student who left the scope and whose
                            history is kept out of the live figures. */}
                        {row.isActive ? null : (
                          <div className="list-editor-item-detail">Left the scope</div>
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(row.currentStatus)}>
                          {row.currentStatus}
                        </StatusBadge>
                      </td>
                      <td>
                        {latest ? (
                          <>
                            <div>{formatSalesforceStamp(latest.changedAt)}</div>
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
                        <td colSpan={4}>
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
                                    ariaLabel={`Set status for ${row.studentName}`}
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
                                  onClick={() => commit(row)}
                                  isDisabled={!draftStatus || draftStatus === row.currentStatus}
                                >
                                  Record change
                                </Button>
                              </div>
                            ) : null}

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

                            <p className="sf-panel-note">
                              Append-only: a change adds a row and never edits one, which is what
                              makes progress-over-time reporting possible later.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>

          {hidden > 0 ? (
            <div className="goal-students-more">
              <Button color="secondary" size="xs" onClick={() => setShowAll(true)}>
                Show all {matching.length} students
              </Button>
              <span className="sf-panel-note">
                {hidden} more not shown. Search or filter to narrow instead.
              </span>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
