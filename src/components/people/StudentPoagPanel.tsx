"use client";

import { useState } from "react";
import Link from "next/link";
import { pillarsForSubject } from "@/lib/data/poag";
import { poagStudentChanges, poagStudentRecord } from "@/lib/data/poagStudent";
import { subjectsForGrade } from "@/lib/data/poagCoverage";
import { usePoag } from "@/lib/poag-store";
import { formatSalesforceStamp } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { PoagLevelTrack } from "@/components/skills-development/PoagLevelTrack";
import { Combobox } from "@/components/shared/Combobox";

/**
 * A student's Portrait of a Graduate, as the admin sees it on their 360.
 *
 * Read-only, and not a smaller copy of the faculty screen: only a class's
 * principal teacher may set a level, and an admin is never one. What an admin
 * needs here is the record — where this student stands, who said so, and how
 * they got there — which is exactly what the append-only rating table is for.
 *
 * Per subject, because a rating is one teacher's judgement in one class. There
 * is no combined view: a student's Critical Thinking in Calculus is a separate
 * record from the same pillar in Geology, and v1 defines no rule for merging
 * them.
 */
export function StudentPoagPanel({
  studentId,
  studentName,
  grade
}: {
  studentId: string;
  studentName: string;
  /** Bare grade, e.g. "9" — decides which subjects the student is taught. */
  grade: string;
}) {
  const { pillars, levels } = usePoag();
  const gradeSubjects = subjectsForGrade(grade);
  const [subjectId, setSubjectId] = useState(gradeSubjects[0]?.id ?? "");

  const subject = gradeSubjects.find((entry) => entry.id === subjectId) ?? gradeSubjects[0] ?? null;

  if (!subject) {
    return (
      <EmptyState
        title="No subjects mapped to this grade"
        message="Portrait of a Graduate ratings are held per subject, so a grade with no mapped subject has nothing to show. Map a subject to this grade in System Settings first."
      />
    );
  }

  const subjectPillars = pillarsForSubject(pillars, subject.id);
  const record = poagStudentRecord(studentId, subject.id, subjectPillars, levels.length);
  const changes = poagStudentChanges(record);

  return (
    <>
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Edison Portrait of a Graduate</h2>
          <div className="sf-panel-head-end">
            <span className="sf-panel-note">
              {subjectPillars.length} of {pillars.length} pillars
            </span>
            {/* A scope, not a filter, and so no "All subjects" option: a rating
                is one teacher's judgement in one class, and v1 defines no rule
                for merging Critical Thinking in Calculus with the same pillar
                in Geology. The same dropdown the Development areas tab uses. */}
            {gradeSubjects.length > 1 ? (
              <label className="sf-field sf-field--inline">
                <span>Subject</span>
                <Combobox
                  value={subject.id}
                  options={gradeSubjects.map((entry) => ({
                    value: entry.id,
                    label: entry.name
                  }))}
                  onChange={setSubjectId}
                  ariaLabel="Subject to show ratings for"
                />
              </label>
            ) : null}
          </div>
        </div>

        {subjectPillars.length === 0 ? (
          <EmptyState
            title={`No pillars rated in ${subject.name}`}
            message="Every pillar is scoped to other subjects, so this subject's teacher is not asked for any of them."
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Pillar</th>
                  <th scope="col">Progress</th>
                  {/* The level in words as well as on the track — never colour
                      or position alone (WCAG 1.4.1). */}
                  <th scope="col">Now at</th>
                  <th scope="col">Rated by</th>
                </tr>
              </thead>
              <tbody>
                {record.map((row) => {
                  const current = row.entries[0];
                  return (
                    <tr key={row.rubricKey}>
                      <td>{row.displayTitle}</td>
                      <td>
                        <PoagLevelTrack level={current.level} label={row.displayTitle} />
                      </td>
                      <td>{levels[current.level]?.label ?? "—"}</td>
                      <td>
                        <span className="poag-rater">
                          {current.ratedBy}
                          {/* Period as well as the date: a rating belongs to a
                              marking period, and the date is only when it was
                              filed. The subject is not repeated — the
                              dropdown above already scopes the whole table. */}
                          <span className="poag-rater-when">
                            {current.period} · {formatSalesforceStamp(current.ratedAt)}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="sf-panel-note poag-coverage-note">
          Set by the principal teacher of {studentName}&rsquo;s {subject.name} class, once per
          marking period. Read-only here — an admin has no write access to a rating. The wording
          behind each level is configured in{" "}
          <Link className="sf-inline-link" href="/skills-development">
            Skills &amp; Development
          </Link>
          .
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Rating history</h2>
          <span className="sf-panel-note">
            {changes.length} change{changes.length === 1 ? "" : "s"} in {subject.name}
          </span>
        </div>

        {changes.length === 0 ? (
          <EmptyState
            title="No changes yet"
            message={`${studentName} has held the same level on every ${subject.name} pillar since the first rating. Ratings carry forward each marking period unless a teacher moves them.`}
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Pillar</th>
                  <th scope="col">Moved</th>
                  <th scope="col">Marking period</th>
                  <th scope="col">Rated by</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change, index) => (
                  <tr key={`${change.displayTitle}-${change.period}-${index}`}>
                    <td>{change.displayTitle}</td>
                    <td>
                      {levels[change.from]?.label ?? "—"} → <strong>
                        {levels[change.to]?.label ?? "—"}
                      </strong>
                    </td>
                    <td>{change.period}</td>
                    <td>
                      <span className="poag-rater">
                        {change.ratedBy}
                        <span className="poag-rater-when">
                          {formatSalesforceStamp(change.ratedAt)}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Why a flat record is the normal one, so an empty history does not
            read as missing data. */}
        <p className="sf-panel-note poag-coverage-note">
          Only the periods where a level actually moved. Ratings are append-only and pre-filled
          with the previous period&rsquo;s level, so a pillar a teacher confirmed unchanged leaves
          no entry here — and the record follows {studentName} across years and schools.
        </p>
      </div>
    </>
  );
}
