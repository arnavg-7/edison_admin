"use client";

import { DATE_RANGE_OPTIONS, useReportFilters, type DateRangePreset } from "@/lib/filters";
import { classesForGrade, gradesForSchool, schools } from "@/lib/data/schools";
import { currentTerm } from "@/lib/data/academicCalendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Base UI's Select treats value="" as "nothing selected" and never renders
    its label, so the "All X" item — a real, persistent filter state, not a
    placeholder — needs a non-empty sentinel instead. */
const ALL = "__all__";

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
    <div className="sf-filter-bar">
      <label className="sf-field">
        <span>Date Range</span>
        <Select
          value={filters.range}
          onValueChange={(value) => setFilters({ range: value as DateRangePreset })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          {/* alignItemWithTrigger off: the default anchors the popup to the
              selected item (matching native <select>), which is exactly what
              made this open upward whenever a mid-list option was selected.
              Anchoring to the trigger instead makes it always open below. */}
          <SelectContent alignItemWithTrigger={false}>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select
          value={filters.school ?? ALL}
          onValueChange={(value) => setFilters({ school: value === ALL ? null : (value ?? null) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={ALL}>All schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="sf-field">
        <span>Grade</span>
        <Select
          value={filters.grade ?? ALL}
          onValueChange={(value) => setFilters({ grade: value === ALL ? null : (value ?? null) })}
          disabled={!filters.school}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value={ALL}>
              {filters.school ? "All grades" : "Select a school first"}
            </SelectItem>
            {grades.map((grade) => (
              <SelectItem key={grade} value={grade}>
                Grade {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {showSection ? (
        <label className="sf-field">
          <span>Class / Section</span>
          <Select
            value={filters.section ?? ALL}
            onValueChange={(value) => setFilters({ section: value === ALL ? null : (value ?? null) })}
            disabled={!filters.grade}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value={ALL}>
                {filters.grade ? "All sections" : "Select a grade first"}
              </SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
