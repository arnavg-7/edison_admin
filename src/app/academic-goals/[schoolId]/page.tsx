import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { schools, gradeLabel } from "@/lib/data/schools";
import { gradeGoalsSummary } from "@/lib/data/academicGoals";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function generateStaticParams() {
  return schools.map((school) => ({ schoolId: school.id }));
}

/** Step two: the grades within one school, and how many goals are active in each. */
export default async function GoalsGradePickerPage({
  params
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const school = schools.find((entry) => entry.id === schoolId);

  if (!school) {
    notFound();
  }

  return (
    <>
      <h1 className="sf-page-title sf-page-title--with-back">
        <Link href="/academic-goals" className="sf-back-btn" aria-label="Back to Schools">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
        </Link>
        {school.name}
      </h1>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Grades</h2>
          <span className="sf-panel-note">Pick a grade to set its goals</span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Grade</th>
                <th scope="col">Active goals</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {school.grades.map((grade) => {
                const summary = gradeGoalsSummary(school.id, grade);
                return (
                  <tr key={grade}>
                    <td>
                      <Link
                        className="sf-bar-group-link"
                        href={`/academic-goals/${school.id}/${grade}`}
                      >
                        {gradeLabel(grade)}
                      </Link>
                    </td>
                    <td>{summary.goals}</td>
                    <td>
                      {summary.configured ? (
                        <StatusBadge tone="ok">{summary.goals} active</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">No goals yet</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
