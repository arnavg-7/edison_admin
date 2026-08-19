import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { schools } from "@/lib/data/schools";
import { goalCategories, gradeGoalsSummary, schoolGoalsSummary } from "@/lib/data/academicGoals";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SchoolPickerGate } from "@/components/shell/SchoolPickerGate";
import {
  ExpandableSchoolTable,
  GradeDetailTable,
  type SchoolTableRow
} from "@/components/shared/ExpandableSchoolTable";

/** Step one of school → grade → goals. Rows expand to their grades in place. */
export default function GoalsSchoolPickerPage() {
  /* The health read the Portal Administrator's brief asks for, on the screen
     that already opens this section rather than as a dashboard of its own —
     these are three numbers, and a screen holding three numbers is a screen
     nobody opens twice. */
  const activeCategories = goalCategories.filter(
    (category) => category.status?.label === "Active"
  ).length;
  const districtGoals = schools.reduce(
    (sum, school) => sum + schoolGoalsSummary(school.id).goals,
    0
  );
  const configuredGrades = schools.reduce((sum, school) => {
    const summary = schoolGoalsSummary(school.id);
    return sum + summary.configuredGrades;
  }, 0);
  const totalGrades = schools.reduce((sum, school) => sum + school.grades.length, 0);

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
                  {/* secondary + a 16px icon, matching every other table's row
                      actions. As the default solid variant with a 14px icon this
                      measured 32px against the 34px used everywhere else. */}
                  <Button
                    color="secondary"
                    size="xs"
                    href={`/academic-goals/${school.id}/${grade}`}
                    iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
                  >
                    Edit
                  </Button>
                </div>
              ]
            };
          })}
        />
      )
    };
  });

  return (
    <SchoolPickerGate section="/academic-goals">
      <h1 className="sf-page-title">Goals</h1>
      <p className="sf-page-sub">
        Goals set for students, configured per grade. Pick a school, then a grade.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Across the district</h2>
          <span className="sf-panel-note">Goal configuration at a glance</span>
        </div>

        <dl className="sf-stat-row">
          <div>
            <dt>Active goals</dt>
            <dd>{districtGoals}</dd>
          </div>
          <div>
            <dt>Grades with goals set</dt>
            <dd>
              {configuredGrades} of {totalGrades}
            </dd>
          </div>
          <div>
            <dt>Goal categories</dt>
            <dd>
              {activeCategories} of {goalCategories.length}
            </dd>
          </div>
        </dl>

        {/* Two figures the brief asks for that this build cannot honestly
            produce, named here rather than shown as zero. */}
        <p className="sf-card-hint">
          Goal templates are not counted: the template list was removed when goals became
          per-grade, so there is nothing published to count. &ldquo;% of goals updated in the last
          30 days&rdquo; needs a last-changed stamp per goal, which arrives with the goal_progress
          history the Admin DB contract defines — no goal carries one yet.
        </p>
      </div>

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
    </SchoolPickerGate>
  );
}
