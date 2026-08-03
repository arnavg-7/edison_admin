import Link from "next/link";
import { notFound } from "next/navigation";
import { schools, gradeLabel } from "@/lib/data/schools";
import { gradeAlertsSummary } from "@/lib/data/alerts";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function generateStaticParams() {
  return schools.map((school) => ({ schoolId: school.id }));
}

/** Step two: the grades within one school, and how many alerts have fired in each. */
export default async function AlertsGradePickerPage({
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
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/alerts/by-school">By school</Link>
        <span aria-hidden>/</span>
        <span>{school.name}</span>
      </nav>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>{school.name}</h2>
          <span className="sf-panel-note">Pick a grade to view its alerts</span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Grade</th>
                <th scope="col">Rules fired</th>
                <th scope="col">Triggered (30d)</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {school.grades.map((grade) => {
                const summary = gradeAlertsSummary(school.id, grade);
                return (
                  <tr key={grade}>
                    <td>
                      <Link
                        className="sf-bar-group-link"
                        href={`/alerts/by-school/${school.id}/${grade}`}
                      >
                        {gradeLabel(grade)}
                      </Link>
                    </td>
                    <td>{summary.rules}</td>
                    <td>{summary.triggered30d}</td>
                    <td>
                      {summary.configured ? (
                        <StatusBadge tone={summary.active > 0 ? "warn" : "ok"}>
                          {summary.active} active
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">No alerts yet</StatusBadge>
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
