import Link from "next/link";
import { notFound } from "next/navigation";
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
          <h2>{school.name}</h2>
          <span className="sf-panel-note">
            Pick a grade to view and edit its development areas and skills profile
          </span>
        </div>

        <ul className="scope-grid scope-grid--tight">
          {school.grades.map((grade) => {
            const summary = gradeConfigSummary(school.id, grade);
            return (
              <li key={grade}>
                <Link
                  className="scope-card"
                  href={`/skills-development/${school.id}/${grade}`}
                >
                  <span className="scope-card-top">
                    <span className="scope-card-kicker">
                      {grade === "K" ? "Kindergarten" : `Grade ${grade}`}
                    </span>
                    {summary.configured ? (
                      <StatusBadge tone="ok">{summary.published} published</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Not configured</StatusBadge>
                    )}
                  </span>
                  <span className="scope-card-meta">
                    {summary.areas} areas · {summary.skills} skills
                  </span>
                  <span className="scope-card-meta">
                    {summary.groups} skill groups · {summary.subSkills} sub-skills
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {!inScope ? (
          <p className="sf-panel-foot">
            {school.name} is outside the committed HS/KG scope, so no content has been seeded for
            its grades. The editors still work — anything added here is a scope extension.
          </p>
        ) : null}
      </div>
    </>
  );
}
