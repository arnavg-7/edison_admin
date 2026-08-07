"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { REPORT_ENTRIES } from "@/lib/data/reportIndex";
import { REPORTS } from "@/lib/data/salesforce";
import { numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import { formatSalesforceStamp } from "@/lib/format";

const TABS = REPORT_ENTRIES.map(({ label, href }) => ({ label, href }));

/** Class/Section narrows only the reports that go that deep. */
const SECTION_FILTER_ROUTES = ["/reporting/faculty-performance"];

/** Metrics Catalog is the one report with a download control — the other
    reporting screens are tables/drill-downs a school might filter and re-view,
    not a fixed set of figures worth exporting as a snapshot. */
const DOWNLOAD_ROUTE = "/reporting";

/** Not a report timestamp — there is no report yet for these two figures.
    Matches the same constant in page.tsx (kept separate rather than shared:
    one string literal isn't worth a module of its own). */
const UNAVAILABLE_CHECKED_AT = "2026-07-17T12:00:00-04:00";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Exports exactly the six KPI figures on screen, each with its own report's
    freshness stamp — same "figure traces to a named report" honesty the cards
    themselves carry, not a bare number. */
function downloadKpiReportCsv() {
  const rows: [string, string, string][] = [
    ["Number of Students", String(numberOfStudents), formatSalesforceStamp(REPORTS.numberOfStudents.asOf)],
    ["Total Faculty", String(totalFaculty), formatSalesforceStamp(REPORTS.totalFaculty.asOf)],
    ["Attendance Rate", "92.4%", formatSalesforceStamp(REPORTS.attendanceRate.asOf)],
    [
      "Assignment Completion Rate",
      "84.7%",
      formatSalesforceStamp(REPORTS.assignmentCompletion.asOf)
    ],
    ["Homeroom coverage", "71%", formatSalesforceStamp(UNAVAILABLE_CHECKED_AT)],
    ["Gen ed / special ed split", "82% / 18%", formatSalesforceStamp(UNAVAILABLE_CHECKED_AT)]
  ];
  const csv = [["Metric", "Value", "As of"], ...rows]
    .map((row) => row.map(toCsvValue).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporting-and-analytics.csv";
  link.click();
  URL.revokeObjectURL(url);
}

/** No PDF library in the project — this is the browser's own print dialog
    ("Save as PDF"), not a generated file. The print stylesheet (theme.css)
    hides the sidebar, tabs/filter bar, and this control itself, so the saved
    PDF is just the title and the figures below it. */
function downloadReportPdf() {
  window.print();
}

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">Reporting &amp; Analytics</h1>
      <p className="sf-page-sub">
        Read-only, sourced from Salesforce reports. Scope applies to every report below.
      </p>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
        <GlobalFilterBar
          showSection={SECTION_FILTER_ROUTES.includes(pathname)}
          actions={
            pathname === DOWNLOAD_ROUTE ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="sf-print-hide"
                  render={<Button variant="outline" size="sm" />}
                >
                  <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={2} />
                  Download report
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={downloadKpiReportCsv}>Download as CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadReportPdf}>Download as PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null
          }
        />
        {children}
      </Suspense>
    </section>
  );
}
