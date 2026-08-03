import Link from "next/link";
import { schools } from "@/lib/data/schools";
import { isSchoolInScope, schoolConfigSummary } from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Step one of school → grade → content. All five Genesis schools are listed,
 * but only the two inside the committed scope carry seeded content; the rest
 * say so on their card rather than looking broken.
 */
export default function SchoolPickerPage() {
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
              <th scope="col">Configured</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => {
              const summary = schoolConfigSummary(school.id);
              const inScope = isSchoolInScope(school.id);
              return (
                <tr key={school.id}>
                  <td>
                    <Link className="sf-bar-group-link" href={`/skills-development/${school.id}`}>
                      {school.name}
                    </Link>
                  </td>
                  <td>{school.level}</td>
                  <td>{summary.grades}</td>
                  <td>{summary.configuredGrades}</td>
                  <td>
                    {inScope ? (
                      <StatusBadge tone="ok">Configured</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Out of scope</StatusBadge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="sf-panel-foot">
        Elementary and middle school are outside the committed scope (brief §8 item 6), so their
        grades open empty. That is a scope decision, not missing data.
      </p>
    </div>
  );
}
