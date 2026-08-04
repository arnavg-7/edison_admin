"use client";

import { useReportFilters } from "@/lib/filters";
import { DateRangePicker } from "@/components/shared/DateRangePicker";

/**
 * Home's date scope. Deliberately just the range — the school/grade/section
 * drill-down belongs to Reporting, where a narrowed scope has reports to apply
 * itself to; Home is the district-wide overview.
 *
 * State lives in the URL through the same `useReportFilters` hook Reporting
 * uses, so the range survives a reload, is shareable, and reads the same on
 * both screens instead of Home inventing a second filter mechanism.
 *
 * Rendered inline in the page head, top-right of the title — a single
 * unlabeled control reads fine there without the "Date Range" span a denser,
 * multi-field bar (like Reporting's) needs to stay legible.
 *
 * Two explanatory lines used to sit under the head and were removed as clutter:
 * which term the old "This Term" preset resolved to, and the caveat that the range currently
 * only scopes Needs Attention (the one dataset carrying a date, `flaggedAt`) —
 * the metric cards are fixed snapshots with their own refresh stamps and have no
 * date field to filter on. That limitation is still true; it just isn't worth a
 * paragraph on the dashboard. Noted here so it isn't lost.
 */
export function HomeFilterBar() {
  const { filters, setFilters } = useReportFilters();

  return (
    <div className="sf-filter-bar sf-filter-bar--compact">
      <DateRangePicker
        range={filters.range}
        from={filters.from}
        to={filters.to}
        onChange={setFilters}
      />
    </div>
  );
}
