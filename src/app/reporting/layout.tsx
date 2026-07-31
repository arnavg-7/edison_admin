"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { GlobalFilterBar } from "@/components/shared/GlobalFilterBar";
import { REPORT_ENTRIES } from "@/lib/data/reportIndex";

// Shared with the Leadership home cards so the two lists can't drift apart.
const TABS = REPORT_ENTRIES.map(({ label, href }) => ({ label, href }));

/** Class/Section only applies to the faculty report, per the screen inventory. */
const SECTION_FILTER_ROUTES = ["/reporting/faculty-performance", "/reporting/custom"];

export default function ReportingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SectionGuard section="reporting">
      <section className="admin-main">
        <h1>Reporting &amp; Analytics</h1>
        <p className="admin-subtitle">Read-only. Scope applies to every report below.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
          <GlobalFilterBar showSection={SECTION_FILTER_ROUTES.includes(pathname)} />
          {children}
        </Suspense>
      </section>
    </SectionGuard>
  );
}
