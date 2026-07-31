"use client";

import { DATE_RANGE_OPTIONS, useReportFilters, type DateRangePreset } from "@/lib/filters";
import { classesForGrade, gradesForSchool, schools } from "@/lib/data/schools";
import { currentTerm } from "@/lib/data/academicCalendar";

/**
 * Shared by every Reporting screen. Grade appears once a school is picked and
 * Class/Section once a grade is picked, matching the drill-down hierarchy.
 */
export function GlobalFilterBar({ showSection = false }: { showSection?: boolean }) {
  const { filters, setFilters } = useReportFilters();
  const grades = gradesForSchool(filters.school);
  const sections = classesForGrade(filters.grade);
  const term = currentTerm();

  return (
    <div className="filter-bar">
      <label className="filter-field">
        <span>Date Range</span>
        <select
          value={filters.range}
          onChange={(event) => setFilters({ range: event.target.value as DateRangePreset })}
        >
          {DATE_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {filters.range === "custom" ? (
        <>
          <label className="filter-field">
            <span>From</span>
            <input
              type="date"
              value={filters.from ?? ""}
              onChange={(event) => setFilters({ from: event.target.value || null })}
            />
          </label>
          <label className="filter-field">
            <span>To</span>
            <input
              type="date"
              value={filters.to ?? ""}
              onChange={(event) => setFilters({ to: event.target.value || null })}
            />
          </label>
        </>
      ) : null}

      <label className="filter-field">
        <span>School</span>
        <select
          value={filters.school ?? ""}
          onChange={(event) => setFilters({ school: event.target.value || null })}
        >
          <option value="">All schools</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-field">
        <span>Grade</span>
        <select
          value={filters.grade ?? ""}
          onChange={(event) => setFilters({ grade: event.target.value || null })}
          disabled={!filters.school}
        >
          <option value="">{filters.school ? "All grades" : "Select a school first"}</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
      </label>

      {showSection ? (
        <label className="filter-field">
          <span>Class / Section</span>
          <select
            value={filters.section ?? ""}
            onChange={(event) => setFilters({ section: event.target.value || null })}
            disabled={!filters.grade}
          >
            <option value="">{filters.grade ? "All sections" : "Select a grade first"}</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {filters.range === "term" ? (
        <p className="filter-note">
          {/* TODO: validate against the real academic calendar. */}
          This Term = {term.label} ({term.start} to {term.end})
        </p>
      ) : null}
    </div>
  );
}
