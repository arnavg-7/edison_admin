"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
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
import { addedGoalsFor, removeStudentGoal } from "@/lib/student-goals-store";
import { gradeRoster } from "@/lib/data/studentRoster";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { StudentGoalDrawer } from "./StudentGoalDrawer";
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
 * An admin may set a goal for one student here, and may withdraw one they set.
 * They may never move a status: a personal goal's progress is what the student or
 * their teacher reports, and a status an admin typed would be a claim about work
 * they did not see. So there is an Add on this panel and no status control on any
 * row — including the rows an admin wrote.
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
  const [adding, setAdding] = useState<string | null>(null);
  /* Bumped after a write so the merge below re-reads the store, which is a plain
     module map rather than React state. */
  const [writeCount, setWriteCount] = useState(0);

  /* The row id for a student, derived the one way so the merge below and the
     expander agree. */
  const rowIdFor = (studentName: string) =>
    gradeRoster(schoolId, grade).find((entry) => entry.name === studentName)?.id ??
    `student-${studentName.replace(/\s+/g, "-").toLowerCase()}`;

  const rows = useMemo(() => {
    const seeded = studentGoalsFor(schoolId, grade, pillars);
    const added = addedGoalsFor(schoolId, grade);
    if (added.size === 0) return seeded;

    /* Merged on top of what the students and their teachers wrote, not instead of
       it. A student the admin has just set a goal for may not have written one, so
       they need a row of their own — the list is "students with goals", and they
       now have one. */
    const roster = gradeRoster(schoolId, grade);
    const merged = seeded.map((row) =>
      added.has(row.studentName)
        ? { ...row, goals: [...(added.get(row.studentName) ?? []), ...row.goals] }
        : row
    );

    for (const [studentName, goals] of added) {
      if (merged.some((row) => row.studentName === studentName)) continue;
      const student = roster.find((entry) => entry.name === studentName);
      merged.push({
        id: rowIdFor(studentName),
        studentName,
        personId: student?.personId ?? null,
        goals
      });
    }
    return merged;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, grade, pillars, writeCount]);
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
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {rows.length} of {enrolled} students have goals
          </span>
          <Button
            size="sm"
            onClick={() => setAdding("")}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
          >
            Set a goal for a student
          </Button>
        </div>
      </div>

      {/* The split this panel turns on, said once here rather than on every row:
          an admin may write an individual goal, and never a status. */}
      <p className="sf-panel-note goals-panel-intro">
        Goals belonging to one student — written by the student, by a teacher with them, or by an
        admin for that student alone. Each is tagged with the Portrait of a Graduate skill it
        builds. Progress is reported by the student or their teacher; setting a goal here does not
        set its status.
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
                  /* The nearest deadline still open. Prefers a dated goal over an
                     undated one, since the column is about when something is due. */
                  const open = row.goals.filter((goal) => goal.status !== "Achieved");
                  const next = open.find((goal) => goal.due !== "") ?? open[0];

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
                        {/* Three states, not two: a date, a goal that has none
                            yet, and nothing left open. Handing "" to the date
                            formatter threw and took the panel down with it. */}
                        <td>
                          {!next
                            ? "All achieved"
                            : next.due === ""
                              ? "No date set"
                              : formatDateOnly(next.due)}
                        </td>
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
                                    {goal.due ? `Due ${formatDateOnly(goal.due)} · ` : ""}Set by{" "}
                                    {goal.setByRole === "Student" ? "the student" : goal.setBy}
                                    {/* Withdrawable, because an admin who set the
                                        wrong goal should be able to take it back —
                                        which is not the same as changing how far
                                        along the student says they are. */}
                                    {goal.setByRole === "Admin" ? (
                                      <>
                                        {" · "}
                                        <button
                                          type="button"
                                          className="sf-inline-btn"
                                          onClick={() => {
                                            removeStudentGoal(
                                              schoolId,
                                              grade,
                                              row.studentName,
                                              goal.id
                                            );
                                            setWriteCount((count) => count + 1);
                                          }}
                                        >
                                          Withdraw
                                        </button>
                                      </>
                                    ) : null}
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

      {adding !== null ? (
        <StudentGoalDrawer
          schoolId={schoolId}
          grade={grade}
          student={adding}
          onClose={() => setAdding(null)}
          onSaved={(studentName) => {
            setWriteCount((count) => count + 1);
            /* Opened straight away: an admin who just set a goal wants to see it
               land, and it is one row in a list of two dozen. Keyed by row id, the
               same value the expander uses — a student's name is not it. */
            const rowId = rowIdFor(studentName);
            setExpanded((current) =>
              current.includes(rowId) ? current : [...current, rowId]
            );
          }}
        />
      ) : null}
    </div>
  );
}
