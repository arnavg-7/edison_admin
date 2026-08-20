"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { ExportReportDrawer } from "@/components/reporting/ExportReportDrawer";
import { REPORT_ENTRIES } from "@/lib/data/reportIndex";
import { useAdminScope } from "@/lib/admin-scope";

const TABS = REPORT_ENTRIES.map(({ label, href }) => ({ label, href }));

/** Class/Section narrows only the reports that go that deep. */
const SECTION_FILTER_ROUTES = ["/reporting/faculty-performance"];

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { persona } = useAdminScope();

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">Reporting &amp; Analytics</h1>
      <p className="sf-page-sub">
        Read-only, sourced from Salesforce reports. Scope applies to every report below.
      </p>

      {/* Leadership's whole portal is this section, so the boundary is stated
          once here rather than left to be inferred from a short nav. Every other
          persona has the rest of the nav to tell them the same thing. */}
      {persona === "leadership" ? (
        <div className="sf-notice">
          <p className="sf-notice-title">Reporting is your whole view</p>
          <p className="sf-notice-detail">
            Read-only throughout, and nothing here is configured by you: goal setup, portal
            configuration, alerts, resources, system settings and integrations belong to other
            roles and are not shown.
          </p>
        </div>
      ) : null}

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
