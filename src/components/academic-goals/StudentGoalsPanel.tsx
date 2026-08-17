"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  STUDENT_GOAL_CATEGORIES,
  goalProgress,
  goalStatusTone,
  gradeStudentCount,
  studentGoalsFor,
  type StudentGoal
} from "@/lib/data/studentGoals";
import { usePoag } from "@/lib/poag-store";
import { useMounted } from "@/lib/use-mounted";
import { formatDateOnly } from "@/lib/format";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

const ALL = "all";

/**
 * A grade's personal student goals, one row per student.
 *
 * Rows are students rather than goals. A grade runs to a few hundred goals and
 * a flat list of them answers no question an admin actually has — the question
 * is who is working on what, and whether anyone has written nothing. So the row
 * is a summary of one student's set, and the goals themselves are behind it.
 *
 * Read-only, like the Portrait of a Graduate panel on a 360: a personal goal is
 * an agreement between a student and their teacher, and an admin editing one
 * would be rewriting a conversation they were not in.
 */
export function StudentGoalsPanel({ schoolId, grade }: { schoolId: string; grade: string }) {
  /* Pillars come from the live store rather than the seed, so the skill filter
     offers exactly what this district has configured — including any pillar an
     admin added themselves. */
  const { pillars } = usePoag();
  /* The store reads localStorage, which the server render cannot see. Without
     this the first paint lists seed pillars and React throws out the markup. */
  const mounted = useMounted();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [pillarKey, setPillarKey] = useState<string>(ALL);
  const [expanded, setExpanded] = useState<string[]>([]);

  const rows = useMemo(
    () => studentGoalsFor(schoolId, grade, pillars),
    [schoolId, grade, pillars]
  );
  const enrolled = gradeStudentCount(schoolId, grade);

  const matchesGoal = (goal: StudentGoal) =>
    (category === ALL || goal.category === category) &&
    (pillarKey === ALL || goal.pillarKey === pillarKey);

  /* Filters narrow the goals first and the students second: a student whose
     only Academic goal is filtered out should leave the table, not sit there
     as a row that opens onto nothing. */
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows
      .map((row) => ({ ...row, goals: row.goals.filter(matchesGoal) }))
      .filter((row) => row.goals.length > 0)
      .filter((row) => !term || row.studentName.toLowerCase().includes(term));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, category, pillarKey]);

  const shownGoals = visible.reduce((sum, row) => sum + row.goals.length, 0);
  const filtered = category !== ALL || pillarKey !== ALL || query.trim() !== "";

  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  const categoryOptions = [
    { value: ALL, label: "All goal types" },
    ...STUDENT_GOAL_CATEGORIES.map((entry) => ({ value: entry, label: entry }))
  ];

  const pillarOptions = [
    { value: ALL, label: "All skills" },
    ...pillars.map((pillar) => ({ value: pillar.rubricKey, label: pillar.displayTitle }))
  ];

  if (!mounted) return null;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Student goals</h2>
        <span className="sf-panel-note">
          {rows.length} of {enrolled} students have set goals
        </span>
      </div>

      {/* Set by the student or by a teacher with them — never by an admin, so
          this panel has no Add. Said once, here, rather than on every row. */}
      <p className="sf-panel-note goals-panel-intro">
        Personal goals students set for themselves, or that a teacher sets with them. Each is
        tagged with the Portrait of a Graduate skill it builds. Read-only for admins.
      </p>

      <div className="sf-filter-bar sf-filter-bar--flush">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search by student name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="sf-field">
          <span>Goal type</span>
          <Combobox options={categoryOptions} value={category} onChange={setCategory} />
        </label>

        <label className="sf-field">
          <span>POAG skill</span>
          <Combobox options={pillarOptions} value={pillarKey} onChange={setPillarKey} />
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={filtered ? "No students match these filters" : "No goals set in this grade yet"}
          message={
            filtered
              ? "Clear the search or widen the goal type and skill filters to see more students."
              : "Personal goals appear here once students or their teachers start setting them."
          }
        />
      ) : (
        <>
          <div className="sf-table-wrap">
            <table className="sf-table sf-table--expandable">
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Goals</th>
                  <th scope="col">Skills they are building</th>
                  <th scope="col">Progress</th>
                  <th scope="col">Next due</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const isOpen = expanded.includes(row.id);
                  const detailId = `${row.id}-goals`;
                  const progress = goalProgress(row.goals);
                  const academic = row.goals.filter((goal) => goal.category === "Academic").length;
                  const personal = row.goals.length - academic;
                  /* Goals are sorted soonest-first, so the first one still open
                     is the deadline that matters. */
                  const next = row.goals.find((goal) => goal.status !== "Achieved");

                  const skillNames = [...new Set(row.goals.map((goal) => goal.pillarTitle))];

                  return (
                    <Fragment key={row.id}>
                      <tr>
                        <td>
                          <div className="sf-row-expander">
                            <button
                              type="button"
                              className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                              aria-expanded={isOpen}
                              aria-controls={detailId}
                              onClick={() => toggle(row.id)}
                            >
                              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                              <span className="sf-sr-only">
                                {isOpen
                                  ? `Hide goals for ${row.studentName}`
                                  : `Show goals for ${row.studentName}`}
                              </span>
                            </button>
                            {/* Only the students with a 360 record are links —
                                the rest have nowhere to go yet. */}
                            {row.personId ? (
                              <Link
                                className="sf-bar-group-link"
                                href={`/people/student/${row.personId}`}
                              >
                                {row.studentName}
                              </Link>
                            ) : (
                              <span className="sf-term-name">{row.studentName}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="list-editor-item-title">
                            {row.goals.length} goal{row.goals.length === 1 ? "" : "s"}
                          </div>
                          <div className="list-editor-item-detail">
                            {[
                              academic > 0 ? `${academic} academic` : null,
                              personal > 0 ? `${personal} personal & social` : null
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </td>
                        <td className="goals-skill-cell">{skillNames.join(", ")}</td>
                        <td>
                          {/* Counted, not averaged: five named steps have no
                              meaningful midpoint, and "60% done" would be a
                              number the student never gave. Split over two
                              lines like the Goals cell, because all three counts
                              on one line wrapped mid-phrase at table widths. */}
                          <div className="list-editor-item-title">
                            {progress.achieved} of {row.goals.length} achieved
                          </div>
                          <div className="list-editor-item-detail">
                            {[
                              progress.underway > 0 ? `${progress.underway} underway` : null,
                              progress.notStarted > 0 ? `${progress.notStarted} not started` : null
                            ]
                              .filter(Boolean)
                              .join(" · ") || "Nothing outstanding"}
                          </div>
                        </td>
                        <td>{next ? formatDateOnly(next.due) : "All achieved"}</td>
                      </tr>

                      {isOpen ? (
                        <tr className="sf-subrow" id={detailId}>
                          <td colSpan={5}>
                            <ul className="student-goal-list">
                              {row.goals.map((goal) => (
                                <li className="student-goal" key={goal.id}>
                                  <div className="student-goal-head">
                                    <h4>{goal.title}</h4>
                                    <span className="student-goal-tag is-category">
                                      {goal.category}
                                    </span>
                                    <span className="student-goal-tag is-skill">
                                      {goal.pillarTitle}
                                    </span>
                                    <span className="student-goal-status">
                                      <StatusBadge tone={goalStatusTone(goal.status)}>
                                        {goal.status}
                                      </StatusBadge>
                                    </span>
                                  </div>
                                  <p className="student-goal-desc">{goal.description}</p>
                                  <p className="student-goal-meta">
                                    Due {formatDateOnly(goal.due)} · Set by{" "}
                                    {goal.setByRole === "Student" ? "the student" : goal.setBy}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered ? (
            <p className="sf-panel-note">
              Showing {shownGoals} goal{shownGoals === 1 ? "" : "s"} across {visible.length} student
              {visible.length === 1 ? "" : "s"}, of {rows.length} students with goals.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
