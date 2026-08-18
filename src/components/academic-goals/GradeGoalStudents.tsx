"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  statusesForGoal,
  gradeGoalStatusTone,
  gradeGoalStatuses
} from "@/lib/data/gradeGoalProgress";
import type { GradeGoal } from "@/lib/data/academicGoals";
import { usePoag } from "@/lib/poag-store";
import { formatSalesforceStamp } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { StatusBadge } from "@/components/shared/StatusBadge";

const ALL = "all";
/** Enough to read the shape of a grade without a 110-row wall inside a table row. */
const FIRST_PAGE = 20;

/**
 * Who in the grade has got where with one goal an admin set.
 *
 * The student level of the same overview the row above it summarises: a tally
 * says half the grade has not started, and this says which half. Search and the
 * status filter are the point of it — an admin opening this is usually looking
 * for the students who have not started, not reading 110 names.
 *
 * Read-only. The status belongs to the student who reported it.
 */
export function GradeGoalStudents({
  schoolId,
  grade,
  goal,
  studentQuery = ""
}: {
  schoolId: string;
  grade: string;
  goal: GradeGoal;
  /** Set on the screen's filter bar; this panel's own box narrows further. */
  studentQuery?: string;
}) {
  const { levels } = usePoag();
  const levelLabels = useMemo(() => levels.map((level) => level.label), [levels]);

  const auto = goal.measurement.type === "auto";

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(
    () => gradeGoalStatuses(schoolId, grade, goal, levelLabels),
    [schoolId, grade, goal, levelLabels]
  );

  const matching = useMemo(() => {
    const term = query.trim().toLowerCase();
    const outer = studentQuery.trim().toLowerCase();
    return rows
      .filter((row) => status === ALL || row.status === status)
      /* Both narrow: the bar's name applies to every goal on the screen, this
         panel's box narrows within one of them. */
      .filter((row) => !outer || row.student.name.toLowerCase().includes(outer))
      .filter((row) => !term || row.student.name.toLowerCase().includes(term));
  }, [rows, query, status, studentQuery]);

  const shown = showAll ? matching : matching.slice(0, FIRST_PAGE);
  const hidden = matching.length - shown.length;

  const statusOptions = [
    { value: ALL, label: "All statuses" },
    ...statusesForGoal(goal).map((entry) => ({ value: entry, label: entry }))
  ];

  return (
    <div className="goal-students">
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
            options={statusOptions}
            value={status}
            onChange={(next) => {
              setStatus(next);
              setShowAll(false);
            }}
            ariaLabel={`Filter ${goal.title} by student status`}
          />
        </label>
      </div>

      {matching.length === 0 ? (
        <p className="sf-subrow-empty">No students in this grade match those filters.</p>
      ) : (
        <>
          <table className="sf-subtable">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Status</th>
                {/* Who moved it depends on the type, so the column says which —
                    "updated by the student" on an auto goal would be wrong. */}
                <th scope="col">
                  {auto ? "Current level" : "Last updated by the student"}
                </th>
                {auto ? <th scope="col">Last evaluated</th> : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.student.id}>
                  <td>
                    {/* Only the students with a 360 record are links, and the link
                        opens their Goals tab rather than Personal details — you
                        clicked a name in a goal's student list, so their goals are
                        what you came for. */}
                    {row.student.personId ? (
                      <Link
                        className="sf-bar-group-link"
                        href={`/people/student/${row.student.personId}?tab=goals`}
                      >
                        {row.student.name}
                      </Link>
                    ) : (
                      row.student.name
                    )}
                  </td>
                  <td>
                    <StatusBadge tone={gradeGoalStatusTone(row.status)}>{row.status}</StatusBadge>
                  </td>
                  {auto ? (
                    <>
                      {/* The reading the status came from: "At risk" is then a
                          fact about a level, not a verdict with no cause. */}
                      <td>
                        <div className="list-editor-item-title">{row.level ?? "Not rated"}</div>
                        {row.levelSubject ? (
                          <div className="list-editor-item-detail">{row.levelSubject}</div>
                        ) : null}
                      </td>
                      <td>
                        {row.updatedAt ? formatSalesforceStamp(row.updatedAt) : "Not rated yet"}
                      </td>
                    </>
                  ) : (
                    /* Never started means never reported, so there is no date to
                       show — said in words rather than left as an empty cell. */
                    <td>
                      {row.updatedAt ? formatSalesforceStamp(row.updatedAt) : "Not reported yet"}
                    </td>
                  )}
                </tr>
              ))}
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
    </div>
  );
}
