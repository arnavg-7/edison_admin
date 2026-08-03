"use client";

import { DATE_RANGE_OPTIONS, useReportFilters, type DateRangePreset } from "@/lib/filters";
import { classesForGrade, gradesForSchool, schools } from "@/lib/data/schools";
import { currentTerm } from "@/lib/data/academicCalendar";
import { Combobox } from "@/components/shared/Combobox";

type ComboOption = { value: string; label: string };

/**
 * Shared by every Reporting screen. Grade appears once a school is picked and
 * Class/Section once a grade is picked, matching the drill-down hierarchy.
 */
export function GlobalFilterBar({ showSection = false }: { showSection?: boolean }) {
  const { filters, setFilters } = useReportFilters();
  const grades = gradesForSchool(filters.school);
  const sections = classesForGrade(filters.grade);
  const term = currentTerm();

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
    <div className="sf-filter-bar">
      <label className="sf-field">
        <span>Date Range</span>
        <Combobox
          options={DATE_RANGE_OPTIONS}
          value={filters.range}
          onChange={(range) => setFilters({ range: range as DateRangePreset })}
          placeholder="Select a range"
        />
      </label>

      {filters.range === "custom" ? (
        <>
          <label className="sf-field">
            <span>From</span>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(event) => setFilters({ from: event.target.value || null })}
            />
          </label>
          <label className="sf-field">
            <span>To</span>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(event) => setFilters({ to: event.target.value || null })}
            />
          </label>
        </>
      ) : null}

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

      {filters.range === "term" ? (
        <p className="sf-filter-note">
          {/* TODO: validate against the real academic calendar. */}
          This Term = {term.label} ({term.start} to {term.end})
        </p>
      ) : null}
    </div>
  );
}
