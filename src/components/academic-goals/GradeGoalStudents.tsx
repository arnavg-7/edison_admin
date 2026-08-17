"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  GRADE_GOAL_STATUSES,
  gradeGoalStatusTone,
  gradeGoalStatuses
} from "@/lib/data/gradeGoalProgress";
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
  goalId,
  goalTitle
}: {
  schoolId: string;
  grade: string;
  goalId: string;
  goalTitle: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(
    () => gradeGoalStatuses(schoolId, grade, goalId),
    [schoolId, grade, goalId]
  );

  const matching = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows
      .filter((row) => status === ALL || row.status === status)
      .filter((row) => !term || row.student.name.toLowerCase().includes(term));
  }, [rows, query, status]);

  const shown = showAll ? matching : matching.slice(0, FIRST_PAGE);
  const hidden = matching.length - shown.length;

  const statusOptions = [
    { value: ALL, label: "All statuses" },
    ...GRADE_GOAL_STATUSES.map((entry) => ({ value: entry, label: entry }))
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
            ariaLabel={`Filter ${goalTitle} by student status`}
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
                <th scope="col">Last updated by the student</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.student.id}>
                  <td>
                    {/* Only the students with a 360 record are links. */}
                    {row.student.personId ? (
                      <Link
                        className="sf-bar-group-link"
                        href={`/people/student/${row.student.personId}`}
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
                  {/* Never started means never reported, so there is no date to
                      show — said in words rather than left as an empty cell. */}
                  <td>
                    {row.updatedAt ? formatSalesforceStamp(row.updatedAt) : "Not reported yet"}
                  </td>
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
