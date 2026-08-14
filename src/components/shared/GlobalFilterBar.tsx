"use client";

import { useReportFilters } from "@/lib/filters";
import { classesForGrade, gradeLabel, gradesForSchool, schools } from "@/lib/data/schools";
import { Combobox } from "@/components/shared/Combobox";
import { MultiCombobox } from "@/components/shared/MultiCombobox";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

type ComboOption = { value: string; label: string };

/**
 * Shared by Home and every Reporting screen. Grade appears once a school is
 * picked and Class/Section once a grade is picked, matching the drill-down
 * hierarchy.
 */
export function GlobalFilterBar({
  showSection = false,
  multiGrade = false,
  className,
  actions
}: {
  showSection?: boolean;
  /**
   * Let Grade take several values at once. On for Home, where the cards are a
   * comparison surface and "grades 9 and 10" is a question an admin actually
   * asks; off for Reporting, whose drill-down and Class/Section filter only
   * mean anything one grade at a time.
   */
  multiGrade?: boolean;
  /** Extra modifier, e.g. --top-spaced where only a title sits above the bar. */
  className?: string;
  /** A trailing control (e.g. Metrics Catalog's "Download report" menu),
      pushed to the row's right edge and bottom-aligned with the fields —
      not a separate row below the filter bar, which read as unrelated to it. */
  actions?: React.ReactNode;
}) {
  const { filters, setFilters } = useReportFilters();
  const grades = gradesForSchool(filters.school);
  const sections = classesForGrade(filters.grade);

  const schoolOptions: ComboOption[] = [
    { value: "all", label: "All schools" },
    ...schools.map((school) => ({ value: school.id, label: school.name }))
  ];

  const gradeOptions: ComboOption[] = grades.map((grade) => ({
    value: grade,
    label: gradeLabel(grade)
  }));

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
        {multiGrade ? (
          <MultiCombobox
            options={gradeOptions}
            values={filters.grades}
            onChange={(picked) => setFilters({ grades: picked })}
            resetLabel="All grades"
            placeholder="Select a school first"
            /* Names two grades outright and counts from three up: "Grade 9,
               Grade 10" still reads at a glance, "Grade 1, Grade 2, Grade 4,
               Grade 5" does not and would just ellipsis away in the trigger. */
            summarize={(picked) =>
              picked.length === 2
                ? picked.map(gradeLabel).join(", ")
                : `${picked.length} grades`
            }
            ariaLabel="Grade"
            disabled={!filters.school}
          />
        ) : (
          <Combobox
            options={[
              { value: "all", label: filters.school ? "All grades" : "Select a school first" },
              ...gradeOptions
            ]}
            value={filters.grade ?? "all"}
            onChange={(grade) => setFilters({ grades: grade === "all" ? [] : [grade] })}
            placeholder="All grades"
            disabled={!filters.school}
          />
        )}
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

      {actions ? <div className="sf-filter-bar-actions">{actions}</div> : null}
    </div>
  );
}
