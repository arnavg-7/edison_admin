"use client";

import Link from "next/link";
import { gradeGoalsFor, isPastSemester } from "@/lib/data/academicGoals";
import {
  gradeGoalStatusTone,
  isAchieved,
  studentGoalStatus,
  targetSentence
} from "@/lib/data/gradeGoalProgress";
import { gradeLabel } from "@/lib/data/schools";
import { formatDateRangeOnly, formatSalesforceStamp } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * The goals this student's grade was set, and where the student says they are
 * with each one.
 *
 * The student level of the overview on the grade's own screen: that one shows
 * the spread across a grade, this one shows one student down the list of goals.
 * An admin looking at a student who is behind wants to see which goals, not a
 * count.
 *
 * Read-only. An admin sets the goal for the grade; the status on it belongs to
 * the student who reported it. Distinct from the individual goals below, which
 * are this student's alone.
 */
export function StudentGradeGoalsPanel({
  schoolId,
  grade,
  studentName
}: {
  schoolId: string;
  grade: string;
  studentName: string;
}) {
  // Current semester only — a past semester's goals are history, and the grade
  // screen keeps them under its own Goal History tab.
  const goals = gradeGoalsFor(schoolId, grade).filter((goal) => !isPastSemester(goal));

  const done = goals.filter((goal) =>
    isAchieved(studentGoalStatus(schoolId, grade, goal, studentName)?.status)
  ).length;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>{gradeLabel(grade)} goals</h2>
        {goals.length > 0 ? (
          <span className="sf-panel-note">
            {done} of {goals.length} achieved
          </span>
        ) : null}
      </div>

      <p className="sf-panel-note goals-panel-intro">
        Set for the whole grade in{" "}
        <Link className="sf-inline-link" href={`/academic-goals/${schoolId}/${grade}`}>
          Goals
        </Link>
        . {studentName} reports their own progress on the manual ones; the auto ones are measured
        from their Portrait of a Graduate rating. Read-only here either way.
      </p>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals set for this grade"
          message="Once an admin sets a goal for this grade's semester, it appears here with this student's progress against it."
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Goal</th>
                <th scope="col">Category</th>
                <th scope="col">Semester</th>
                <th scope="col">Measured</th>
                <th scope="col">Status</th>
                <th scope="col">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => {
                const record = studentGoalStatus(schoolId, grade, goal, studentName);
                const status = record?.status ?? "Not started";

                return (
                  <tr key={goal.id}>
                    <td>
                      <div className="list-editor-item-title">{goal.title}</div>
                      <div className="list-editor-item-detail">{goal.description}</div>
                    </td>
                    <td>{goal.category}</td>
                    <td>
                      <div className="list-editor-item-title">{goal.semester.name}</div>
                      <div className="list-editor-item-detail">
                        {formatDateRangeOnly(goal.semester.from, goal.semester.to)}
                      </div>
                    </td>
                    <td>
                      <StatusBadge tone={goal.measurement.type === "auto" ? "ok" : "neutral"}>
                        {goal.measurement.type === "auto" ? "Auto" : "Manual"}
                      </StatusBadge>
                      {goal.measurement.type === "auto" ? (
                        <div className="list-editor-item-detail">{targetSentence(goal)}</div>
                      ) : null}
                    </td>
                    <td>
                      <StatusBadge tone={gradeGoalStatusTone(status)}>{status}</StatusBadge>
                      {/* The reading behind an auto status, so "At risk" is a
                          fact about a level rather than a verdict with no cause. */}
                      {record?.level ? (
                        <div className="list-editor-item-detail">
                          At {record.level}
                          {record.levelSubject ? ` · ${record.levelSubject}` : ""}
                        </div>
                      ) : null}
                    </td>
                    {/* Nothing reported yet is said in words — an empty cell
                        reads as missing data rather than as "not started". */}
                    <td>
                      {record?.updatedAt
                        ? formatSalesforceStamp(record.updatedAt)
                        : goal.measurement.type === "auto"
                          ? "Not rated yet"
                          : "Not reported yet"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
