import Link from "next/link";
import { schools } from "@/lib/data/schools";
import { schoolGoalsSummary } from "@/lib/data/academicGoals";
import { StatusBadge } from "@/components/shared/StatusBadge";

/** Step one of school → grade → goals. */
export default function GoalsSchoolPickerPage() {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Schools</h2>
        <span className="sf-panel-note">Pick a school, then a grade</span>
      </div>

      <div className="sf-table-wrap">
        <table className="sf-table">
          <thead>
            <tr>
              <th scope="col">School</th>
              <th scope="col">Level</th>
              <th scope="col">Grades</th>
              <th scope="col">Active goals</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => {
              const summary = schoolGoalsSummary(school.id);
              return (
                <tr key={school.id}>
                  <td>
                    <Link className="sf-bar-group-link" href={`/academic-goals/${school.id}`}>
                      {school.name}
                    </Link>
                  </td>
                  <td>{school.level}</td>
                  <td>{summary.grades}</td>
                  <td>{summary.goals}</td>
                  <td>
                    {summary.configuredGrades > 0 ? (
                      <StatusBadge tone="ok">
                        {summary.configuredGrades} of {summary.grades} grades
                      </StatusBadge>
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
  );
}
