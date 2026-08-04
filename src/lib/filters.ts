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
  grade: string | null;
  section: string | null;
};

export const DEFAULT_FILTERS: ReportFilters = {
  range: "today",
  from: null,
  to: null,
  school: null,
  grade: null,
  section: null
};

/**
 * Reporting's global filter state lives in the URL, not component state, so it
 * survives drill-down, tab changes, refresh, and sharing a link.
 */
export function useReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<ReportFilters>(
    () => ({
      range: (searchParams.get("range") as DateRangePreset | null) ?? DEFAULT_FILTERS.range,
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      school: searchParams.get("school"),
      grade: searchParams.get("grade"),
      section: searchParams.get("section")
    }),
    [searchParams]
  );

  const setFilters = useCallback(
    (patch: Partial<ReportFilters>) => {
      const next = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      // Narrowing the scope invalidates anything below it in the hierarchy.
      if ("school" in patch) {
        next.delete("grade");
        next.delete("section");
      }
      if ("grade" in patch) {
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
  if (filters.grade) return "grade";
  if (filters.school) return "school";
  return "district";
}
