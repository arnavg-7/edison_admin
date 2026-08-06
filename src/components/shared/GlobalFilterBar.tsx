"use client";

import { useReportFilters } from "@/lib/filters";
import { classesForGrade, gradesForSchool, schools } from "@/lib/data/schools";
import { Combobox } from "@/components/shared/Combobox";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

type ComboOption = { value: string; label: string };

/**
 * Shared by every Reporting screen. Grade appears once a school is picked and
 * Class/Section once a grade is picked, matching the drill-down hierarchy.
 */
export function GlobalFilterBar({
  showSection = false,
  className
}: {
  showSection?: boolean;
  /** Extra modifier, e.g. --top-spaced where only a title sits above the bar. */
  className?: string;
}) {
  const { filters, setFilters } = useReportFilters();
  const grades = gradesForSchool(filters.school);
  const sections = classesForGrade(filters.grade);

  const schoolOptions: ComboOption[] = [
    { value: "all", label: "All schools" },
    ...schools.map((school) => ({ value: school.id, label: school.name }))
  ];

  const gradeOptions: ComboOption[] = [
    { value: "all", label: filters.school ? "All grades" : "Select a school first" },
    ...grades.map((grade) => ({ value: grade, label: `Grade ${grade}` }))
  ];

  const sectionOptions: ComboOption[] = [
    { value: "all", label: filters.grade ? "All sections" : "Select a grade first" },
    ...sections.map((section) => ({ value: section.id, label: section.name }))
  ];

  return (
    <div className={`sf-filter-bar sf-filter-bar--flush${className ? ` ${className}` : ""}`}>
      {/* Scope first, date last. School → Grade → Section is one drill-down
          the reader moves through left to right; the date range is a separate
          axis and sits apart at the far right rather than in the middle of
          that sequence. */}
      <label className="sf-field">
        <span>School</span>
        <Combobox
          options={schoolOptions}
          value={filters.school ?? "all"}
          onChange={(school) => setFilters({ school: school === "all" ? null : school })}
          placeholder="All schools"
        />
      </label>

      <label className="sf-field">
        <span>Grade</span>
        <Combobox
          options={gradeOptions}
          value={filters.grade ?? "all"}
          onChange={(grade) => setFilters({ grade: grade === "all" ? null : grade })}
          placeholder="All grades"
          disabled={!filters.school}
        />
      </label>

      {showSection ? (
        <label className="sf-field">
          <span>Class / Section</span>
          <Combobox
            options={sectionOptions}
            value={filters.section ?? "all"}
            onChange={(section) => setFilters({ section: section === "all" ? null : section })}
            placeholder="All sections"
            disabled={!filters.grade}
          />
        </label>
      ) : null}

      <label className="sf-field sf-field--end">
        <span>Date Range</span>
        <DateRangePicker
          range={filters.range}
          from={filters.from}
          to={filters.to}
          onChange={setFilters}
        />
      </label>
    </div>
  );
}
