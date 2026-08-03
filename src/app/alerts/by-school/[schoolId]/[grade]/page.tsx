import Link from "next/link";
import { notFound } from "next/navigation";
import { schools, gradeLabel } from "@/lib/data/schools";
import { gradeAlertsFor } from "@/lib/data/alerts";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

export function generateStaticParams() {
  return schools.flatMap((school) =>
    school.grades.map((grade) => ({ schoolId: school.id, grade }))
  );
}

/** Step three: the alerts that have fired for students in one grade at one school. */
export default async function AlertsForGradePage({
  params
}: {
  params: Promise<{ schoolId: string; grade: string }>;
}) {
  const { schoolId, grade: rawGrade } = await params;
  const grade = decodeURIComponent(rawGrade);
  const school = schools.find((entry) => entry.id === schoolId);

  if (!school || !school.grades.includes(grade)) {
    notFound();
  }

  const alerts = gradeAlertsFor(schoolId, grade);

  return (
    <>
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/alerts/by-school">By school</Link>
        <span aria-hidden>/</span>
        <Link href={`/alerts/by-school/${school.id}`}>{school.name}</Link>
        <span aria-hidden>/</span>
        <span>{gradeLabel(grade)}</span>
      </nav>

      <div className="sf-scope-head">
        <h2>
          {gradeLabel(grade)} · {school.name}
        </h2>
        <p className="sf-page-sub">Alert rules that have fired for students in this grade.</p>
      </div>

      <div className="sf-panel">
        {alerts.length === 0 ? (
          <EmptyState
            title="No alerts for this grade yet"
            message="Alerts appear here once a rule fires for a student in this grade."
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">Rule</th>
                  <th scope="col">Triggered (30d)</th>
                  <th scope="col">Last triggered</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>{alert.rule}</td>
                    <td>{alert.triggered30d}</td>
                    <td>{alert.lastTriggered}</td>
                    <td>
                      <StatusBadge tone={alert.status.tone}>{alert.status.label}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
