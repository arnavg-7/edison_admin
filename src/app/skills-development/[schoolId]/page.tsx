import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { schools } from "@/lib/data/schools";
import { gradeConfigSummary, isSchoolInScope } from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function generateStaticParams() {
  return schools.map((school) => ({ schoolId: school.id }));
}

/** Step two: the grades within one school. */
export default async function GradePickerPage({
  params
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const school = schools.find((entry) => entry.id === schoolId);

  if (!school) {
    notFound();
  }

  const inScope = isSchoolInScope(school.id);

  return (
    <>
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/skills-development">Skills &amp; Development</Link>
        <span aria-hidden>/</span>
        <span>{school.name}</span>
      </nav>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2 className="sf-page-title--with-back">
            <Link href="/skills-development" className="sf-back-btn" aria-label="Back to Schools">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
            </Link>
            {school.name}
          </h2>
          <span className="sf-panel-note">
            Pick a grade to view and edit its development areas and skills profile
          </span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Grade</th>
                <th scope="col">Areas</th>
                <th scope="col">Skills</th>
                <th scope="col">Skill groups</th>
                <th scope="col">Sub-skills</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {school.grades.map((grade) => {
                const summary = gradeConfigSummary(school.id, grade);
                return (
                  <tr key={grade}>
                    <td>
                      <Link
                        className="sf-bar-group-link"
                        href={`/skills-development/${school.id}/${grade}`}
                      >
                        Grade {grade}
                      </Link>
                    </td>
                    <td>{summary.areas}</td>
                    <td>{summary.skills}</td>
                    <td>{summary.groups}</td>
                    <td>{summary.subSkills}</td>
                    <td>
                      {summary.configured ? (
                        <StatusBadge tone="ok">{summary.published} published</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Not configured</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!inScope ? (
          <p className="sf-panel-foot">
            {school.name} is outside the committed HS-only scope, so no content has been seeded for
            its grades. The editors still work — anything added here is a scope extension.
          </p>
        ) : null}
      </div>
    </>
  );
}
