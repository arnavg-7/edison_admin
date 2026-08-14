"use client";

import { useReportFilters } from "@/lib/filters";
import { classesForGrade, schools } from "@/lib/data/schools";

/**
 * District → School → Grade → Class. Clicking a crumb widens the scope by
 * clearing everything below it. Deliberately stops at class — there are no
 * individual student or faculty profile pages.
 */
export function ScopeBreadcrumb() {
  const { filters, setFilters } = useReportFilters();

  const school = schools.find((item) => item.id === filters.school);
  const section = classesForGrade(filters.grade).find((item) => item.id === filters.section);

  const crumbs: { label: string; onClick?: () => void }[] = [
    {
      label: "District",
      onClick: filters.school ? () => setFilters({ school: null }) : undefined
    }
  ];

  if (school) {
    crumbs.push({
      label: school.name,
      onClick: filters.grades.length > 0 ? () => setFilters({ grades: [] }) : undefined
    });
  }
  // Reporting's Grade filter is single-select, so `grade` is the whole story
  // here. A multi-grade selection can only arrive from Home's filter bar via a
  // shared URL; it widens this crumb trail to the school rather than inventing a
  // crumb for a scope this screen can't drill through.
  if (filters.grade) {
    crumbs.push({
      label: `Grade ${filters.grade}`,
      onClick: filters.section ? () => setFilters({ section: null }) : undefined
    });
  }
  if (section) {
    crumbs.push({ label: section.name });
  }

  return (
    <nav className="scope-breadcrumb" aria-label="Report scope">
      {crumbs.map((crumb, index) => (
        <span key={crumb.label} className="scope-crumb-wrap">
          {index > 0 ? <span className="scope-crumb-sep">/</span> : null}
          {crumb.onClick ? (
            <button type="button" className="scope-crumb-link" onClick={crumb.onClick}>
              {crumb.label}
            </button>
          ) : (
            <span className="scope-crumb-current">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
