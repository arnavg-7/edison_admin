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

      <ul className="scope-grid">
        {schools.map((school) => {
          const summary = schoolConfigSummary(school.id);
          const inScope = isSchoolInScope(school.id);
          return (
            <li key={school.id}>
              <Link className="scope-card" href={`/skills-development/${school.id}`}>
                <span className="scope-card-top">
                  <span className="scope-card-kicker">{school.level}</span>
                  {inScope ? (
                    <StatusBadge tone="ok">Configured</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Out of scope</StatusBadge>
                  )}
                </span>
                <span className="scope-card-title">{school.name}</span>
                <span className="scope-card-meta">
                  {summary.grades} {summary.grades === 1 ? "grade" : "grades"} ·{" "}
                  {summary.configuredGrades} configured
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="sf-panel-foot">
        Elementary and middle school are outside the committed scope (brief §8 item 6), so their
        grades open empty. That is a scope decision, not missing data.
      </p>
    </div>
  );
}
