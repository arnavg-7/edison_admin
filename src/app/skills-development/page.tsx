import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { schools } from "@/lib/data/schools";
import { gradeConfigSummary, isSchoolInScope, schoolConfigSummary } from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SchoolPickerGate } from "@/components/shell/SchoolPickerGate";
import {
  ExpandableSchoolTable,
  GradeDetailTable,
  type SchoolTableRow
} from "@/components/shared/ExpandableSchoolTable";

/**
 * Step one of school → grade → content. All five Genesis schools are listed,
 * but only the two inside the committed scope carry seeded content; the rest
 * say so on their card rather than looking broken.
 *
 * Each row expands to its grades in place, so "what still needs configuring"
 * is answerable without opening every school in turn.
 */
export default function SchoolPickerPage() {
  const rows: SchoolTableRow[] = schools.map((school) => {
    const summary = schoolConfigSummary(school.id);
    const inScope = isSchoolInScope(school.id);

    return {
      id: school.id,
      name: school.name,
      href: `/skills-development/${school.id}`,
      cells: [
        school.level,
        summary.grades,
        summary.configuredGrades,
        inScope ? (
          <StatusBadge key="status" tone="ok">
            Configured
          </StatusBadge>
        ) : (
          <StatusBadge key="status" tone="neutral">
            Out of scope
          </StatusBadge>
        )
        // A school itself holds nothing editable — its grades do — so there is
        // no separate row action here. The school name link (and row expander)
        // already open the grade list.
      ],
      detail: (
        <GradeDetailTable
          head={["Grade", "Areas", "Skills", "Skill groups", "Sub-skills", "Status", "Actions"]}
          rows={school.grades.map((grade) => {
            const gradeSummary = gradeConfigSummary(school.id, grade);
            return {
              key: grade,
              cells: [
                <Link
                  key="grade"
                  className="sf-bar-group-link"
                  href={`/skills-development/${school.id}/${grade}`}
                >
                  Grade {grade}
                </Link>,
                gradeSummary.areas,
                gradeSummary.skills,
                gradeSummary.groups,
                gradeSummary.subSkills,
                gradeSummary.configured ? (
                  <StatusBadge key="status" tone="ok">
                    {gradeSummary.published} published
                  </StatusBadge>
                ) : (
                  <StatusBadge key="status" tone="neutral">
                    Not configured
                  </StatusBadge>
                ),
                // The grade page is where the editors live, so this is the real
                // edit entry point.
                <div className="sf-row-actions" key="actions">
                  {/* secondary + a 16px icon, matching every other table's row
                      actions. As the default solid variant with a 14px icon this
                      measured 32px against the 34px used everywhere else. */}
                  <Button
                    color="secondary"
                    size="xs"
                    href={`/skills-development/${school.id}/${grade}`}
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
    <SchoolPickerGate section="/skills-development">
      <h1 className="sf-page-title">Skills &amp; Development</h1>
      <p className="sf-page-sub">
        Development areas and skills profiles, configured per grade. Pick a school, then a grade.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Schools</h2>
          <span className="sf-panel-note">Expand a school, or open it to pick a grade</span>
        </div>

        <ExpandableSchoolTable
          head={["School", "Level", "Grades", "Configured", "Status"]}
          rows={rows}
        />
      </div>
    </SchoolPickerGate>
  );
}
