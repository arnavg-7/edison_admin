"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last-week"
  | "last-month"
  | "last-year"
  | "custom";

/** Order is the order they appear in the picker's preset rail. */
export const DATE_RANGE_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last-week", label: "Last week" },
  { value: "last-month", label: "Last month" },
  { value: "last-year", label: "Last year" },
  { value: "custom", label: "Custom range" }
];

export function dateRangeLabel(range: DateRangePreset): string {
  return DATE_RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Today";
}

export type ReportFilters = {
  range: DateRangePreset;
  from: string | null;
  to: string | null;
  school: string | null;
  /**
   * Every grade picked. Empty means "no grade narrowing", i.e. all of the
   * school's grades — Home lets an admin compare a few grades at once, so the
   * scope below a school is a set rather than a single value.
   */
  grades: string[];
  /**
   * Derived, read-only: the one grade picked, or null when none or several are.
   * Class/Section only exists beneath a single grade and Reporting's Scope is
   * one-grade-deep, so those read this instead of the list and a multi-grade
   * selection widens them to the school rather than showing rows the filter
   * has excluded.
   */
  grade: string | null;
  section: string | null;
};

/** `grade` is derived from `grades`, so it isn't writable. */
export type ReportFiltersPatch = Partial<Omit<ReportFilters, "grade">>;

export const DEFAULT_FILTERS: ReportFilters = {
  range: "today",
  from: null,
  to: null,
  school: null,
  grades: [],
  grade: null,
  section: null
};

/**
 * Grades travel in the existing singular `grade` param as a comma-separated
 * list, so links and bookmarks written before the filter went multi-select
 * (`?grade=10`) still resolve to exactly what they used to mean.
 */
const GRADE_PARAM = "grade";

function parseGrades(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Reporting's global filter state lives in the URL, not component state, so it
 * survives drill-down, tab changes, refresh, and sharing a link.
 */
export function useReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<ReportFilters>(() => {
    const grades = parseGrades(searchParams.get(GRADE_PARAM));

    return {
      range: (searchParams.get("range") as DateRangePreset | null) ?? DEFAULT_FILTERS.range,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      school: searchParams.get("school"),
      grades,
      grade: grades.length === 1 ? grades[0] : null,
      section: searchParams.get("section")
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: ReportFiltersPatch) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (Array.isArray(value)) {
          // An empty set is the absence of narrowing, so it drops the param
          // rather than writing `grade=`.
          if (value.length === 0) next.delete(GRADE_PARAM);
          else next.set(GRADE_PARAM, value.join(","));
        } else if (value === null || value === "" || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      // Narrowing the scope invalidates anything below it in the hierarchy.
      if ("school" in patch) {
        next.delete(GRADE_PARAM);
        next.delete("section");
      }
      if ("grades" in patch) {
        next.delete("section");
      }
      if ("range" in patch && patch.range !== "custom") {
        next.delete("from");
        next.delete("to");
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { filters, setFilters };
}

/** District → School → Grade → Class. Stops at class, per the brief. */
export function drillDownLevel(filters: ReportFilters): "district" | "school" | "grade" | "class" {
  if (filters.section) return "class";
  if (filters.grades.length > 0) return "grade";
  if (filters.school) return "school";
  return "district";
}
