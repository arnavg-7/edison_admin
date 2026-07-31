"use client";

import { Suspense } from "react";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Development Areas", href: "/portal-configuration" },
  { label: "Skills Profile", href: "/portal-configuration/skills-profile" },
  { label: "Faculty Dashboard", href: "/portal-configuration/faculty-dashboard" }
];

export default function PortalConfigurationLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionGuard section="portal-configuration">
      <section className="admin-main">
        <h1>Portal Configuration</h1>
        <p className="admin-subtitle">
          Content shown in the student and faculty portals. Configured for high school and
          kindergarten only — elementary and middle school are out of scope for this phase, not
          missing.
        </p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
    </SectionGuard>
  );
}
