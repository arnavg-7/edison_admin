"use client";

import { DATE_RANGE_OPTIONS, useReportFilters, type DateRangePreset } from "@/lib/filters";
import { classesForGrade, gradesForSchool, schools } from "@/lib/data/schools";
import { currentTerm } from "@/lib/data/academicCalendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";

type ComboOption = { value: string; label: string };

const isOptionEqual = (a: ComboOption, b: ComboOption) => a.value === b.value;

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
          items={DATE_RANGE_OPTIONS}
          value={DATE_RANGE_OPTIONS.find((option) => option.value === filters.range) ?? null}
          onValueChange={(option) => setFilters({ range: (option?.value ?? "today") as DateRangePreset })}
          isItemEqualToValue={isOptionEqual}
        >
          <ComboboxInput placeholder="Select a range" />
          <ComboboxContent>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxList>
              {(option: (typeof DATE_RANGE_OPTIONS)[number]) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
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
          items={schoolOptions}
          value={schoolOptions.find((option) => option.value === (filters.school ?? "all")) ?? null}
          onValueChange={(option) =>
            setFilters({ school: !option || option.value === "all" ? null : option.value })
          }
          isItemEqualToValue={isOptionEqual}
        >
          <ComboboxInput placeholder="All schools" />
          <ComboboxContent>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxList>
              {(option: ComboOption) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </label>

      <label className="sf-field">
        <span>Grade</span>
        <Combobox
          items={gradeOptions}
          value={gradeOptions.find((option) => option.value === (filters.grade ?? "all")) ?? null}
          onValueChange={(option) =>
            setFilters({ grade: !option || option.value === "all" ? null : option.value })
          }
          isItemEqualToValue={isOptionEqual}
          disabled={!filters.school}
        >
          <ComboboxInput placeholder="All grades" disabled={!filters.school} />
          <ComboboxContent>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxList>
              {(option: ComboOption) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </label>

      {showSection ? (
        <label className="sf-field">
          <span>Class / Section</span>
          <Combobox
            items={sectionOptions}
            value={sectionOptions.find((option) => option.value === (filters.section ?? "all")) ?? null}
            onValueChange={(option) =>
              setFilters({ section: !option || option.value === "all" ? null : option.value })
            }
            isItemEqualToValue={isOptionEqual}
            disabled={!filters.grade}
          >
            <ComboboxInput placeholder="All sections" disabled={!filters.grade} />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
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
