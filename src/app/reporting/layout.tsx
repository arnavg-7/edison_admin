"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { ExportReportDrawer } from "@/components/reporting/ExportReportDrawer";
import { REPORT_ENTRIES } from "@/lib/data/reportIndex";

const TABS = REPORT_ENTRIES.map(({ label, href }) => ({ label, href }));

/** Class/Section narrows only the reports that go that deep. */
const SECTION_FILTER_ROUTES = ["/reporting/faculty-performance"];

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
          actions={<ExportReportDrawer />}
        />
        {children}
      </Suspense>
    </section>
  );
}
