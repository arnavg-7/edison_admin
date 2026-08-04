import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { schools } from "@/lib/data/schools";
import { gradeGoalsSummary, schoolGoalsSummary } from "@/lib/data/academicGoals";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ExpandableSchoolTable,
  GradeDetailTable,
  type SchoolTableRow
} from "@/components/shared/ExpandableSchoolTable";

/** Step one of school → grade → goals. Rows expand to their grades in place. */
export default function GoalsSchoolPickerPage() {
  const rows: SchoolTableRow[] = schools.map((school) => {
    const summary = schoolGoalsSummary(school.id);

    return {
      id: school.id,
      name: school.name,
      href: `/academic-goals/${school.id}`,
      cells: [
        school.level,
        summary.grades,
        summary.goals,
        summary.configuredGrades > 0 ? (
          <StatusBadge key="status" tone="ok">
            {summary.configuredGrades} of {summary.grades} grades
          </StatusBadge>
        ) : (
          <StatusBadge key="status" tone="neutral">
            No goals yet
          </StatusBadge>
        )
        // No school-level action: the school name opens its grade list, and goals
        // are only ever set per grade.
      ],
      detail: (
        <GradeDetailTable
          head={["Grade", "Active goals", "Status", "Actions"]}
          rows={school.grades.map((grade) => {
            const gradeSummary = gradeGoalsSummary(school.id, grade);
            return {
              key: grade,
              cells: [
                <Link
                  key="grade"
                  className="sf-bar-group-link"
                  href={`/academic-goals/${school.id}/${grade}`}
                >
                  Grade {grade}
                </Link>,
                gradeSummary.goals,
                gradeSummary.configured ? (
                  <StatusBadge key="status" tone="ok">
                    Configured
                  </StatusBadge>
                ) : (
                  <StatusBadge key="status" tone="neutral">
                    No goals yet
                  </StatusBadge>
                ),
                // The grade page holds the goals editor.
                <div className="sf-row-actions" key="actions">
                  <Link
                    className="sf-btn sf-btn--sm sf-btn--primary"
                    href={`/academic-goals/${school.id}/${grade}`}
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={2} />
                    Edit
                  </Link>
                </div>
              ]
            };
          })}
        />
      )
    };
  });

  return (
    <>
      <h1 className="sf-page-title">Academic Goals</h1>
      <p className="sf-page-sub">
        Goals set for students, configured per grade. Pick a school, then a grade.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Schools</h2>
          <span className="sf-panel-note">Expand a school, or open it to pick a grade</span>
        </div>

        <ExpandableSchoolTable
          head={["School", "Level", "Grades", "Active goals", "Status"]}
          rows={rows}
        />
      </div>
    </>
  );
}
