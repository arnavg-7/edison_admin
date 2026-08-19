"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { schools, gradeLabel } from "@/lib/data/schools";
import { gradeConfigSummary, schoolConfigSummary } from "@/lib/data/skillsDevelopment";
import { useAdminScope } from "@/lib/admin-scope";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ExpandableSchoolTable,
  GradeDetailTable,
  type SchoolTableRow
} from "@/components/shared/ExpandableSchoolTable";

/**
 * What students and faculty see, counted rather than edited.
 *
 * The Portal / Program Administrator's opening screen: their job is keeping the
 * portal current, and the first question that job asks every morning is which
 * grades have been configured and which are still empty. That is a read across
 * every school at once, which is exactly what the section it links into cannot
 * give — Skills & Development is a drill-down, one grade at a time, because
 * that is the right shape for editing.
 *
 * So this counts and links; the editing stays where it already lives. Nothing is
 * authored here, which is why there is no "add" anywhere on the screen.
 */
export default function PortalConfigurationPage() {
  const { schoolId, school } = useAdminScope();

  /* One school's admin sees their school, not a district table with their row
     in it — the same rule every other section follows. */
  const visible = schoolId ? schools.filter((entry) => entry.id === schoolId) : schools;

  const rows: SchoolTableRow[] = visible.map((entry) => {
    const summary = schoolConfigSummary(entry.id);
    const totals = entry.grades.reduce(
      (sum, grade) => {
        const grade_ = gradeConfigSummary(entry.id, grade);
        return {
          areas: sum.areas + grade_.areas,
          groups: sum.groups + grade_.groups,
          published: sum.published + grade_.published
        };
      },
      { areas: 0, groups: 0, published: 0 }
    );

    return {
      id: entry.id,
      name: entry.name,
      href: `/skills-development/${entry.id}`,
      cells: [
        entry.level,
        totals.areas,
        totals.groups,
        summary.configuredGrades > 0 ? (
          <StatusBadge key="status" tone={summary.configuredGrades === summary.grades ? "ok" : "warn"}>
            {summary.configuredGrades} of {summary.grades} grades
          </StatusBadge>
        ) : (
          <StatusBadge key="status" tone="error">
            Nothing configured
          </StatusBadge>
        )
      ],
      detail: (
        <GradeDetailTable
          head={["Grade", "Development areas", "Skills profile", "Published", "Actions"]}
          rows={entry.grades.map((grade) => {
            const summaryFor = gradeConfigSummary(entry.id, grade);
            return {
              key: grade,
              cells: [
                <Link
                  key="grade"
                  className="sf-bar-group-link"
                  href={`/skills-development/${entry.id}/${grade}`}
                >
                  {gradeLabel(grade)}
                </Link>,
                /* Items and their children, because "3 areas" and "3 areas
                   holding 19 skills" are different amounts of work done. */
                `${summaryFor.areas} · ${summaryFor.skills} skills`,
                `${summaryFor.groups} · ${summaryFor.subSkills} sub-skills`,
                summaryFor.configured ? (
                  <StatusBadge key="published" tone={summaryFor.published > 0 ? "ok" : "warn"}>
                    {summaryFor.published} published
                  </StatusBadge>
                ) : (
                  <StatusBadge key="published" tone="neutral">
                    Not configured
                  </StatusBadge>
                ),
                <div className="sf-row-actions" key="actions">
                  <Button
                    color="secondary"
                    size="xs"
                    href={`/skills-development/${entry.id}/${grade}`}
                    iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
                  >
                    Configure
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
    <section className="sf-main">
      <h1 className="sf-page-title">Portal Configuration</h1>
      <p className="sf-page-sub">
        What is configured for students and faculty, across{" "}
        {school ? school.name : "every school"} — and where the gaps are. Expand a school to see
        its grades; editing happens in Skills &amp; Development.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Development areas &amp; skills profile</h2>
          <span className="sf-panel-note">Counted per grade, published and draft</span>
        </div>

        <ExpandableSchoolTable
          head={["School", "Level", "Development areas", "Skill groups", "Grades configured"]}
          rows={rows}
        />
      </div>

      {/* The two things the brief asks for that this portal has no data behind.
          Named rather than left out: a screen that silently answers half the
          question reads as complete, and the gap is then found in review. */}
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Not yet in this portal</h2>
        </div>
        <p className="sf-card-hint">
          <strong>HS and KG layout &amp; branding.</strong> No layout or branding settings exist in
          this portal, so there is no completion status to report.
        </p>
        <p className="sf-card-hint">
          <strong>Faculty dashboard components.</strong> Configured in the faculty build rather
          than here, so there is nothing on this side to count.
        </p>
      </div>
    </section>
  );
}
