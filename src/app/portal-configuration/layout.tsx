"use client";

import { Suspense } from "react";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "HS Layout & Branding", href: "/portal-configuration" },
  { label: "KG Layout & Branding", href: "/portal-configuration/kg-layout" },
  { label: "Development Areas", href: "/portal-configuration/development-areas" },
  { label: "Skills Profile", href: "/portal-configuration/skills-profile" },
  { label: "Faculty Dashboard", href: "/portal-configuration/faculty-dashboard" }
];

export default function PortalConfigurationLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionGuard section="portal-configuration">
      <section className="admin-main">
        <h1>Portal Configuration</h1>
        <p className="admin-subtitle">
          Student and faculty portal layout, branding, and content configuration. Configured for
          high school and kindergarten only — elementary and middle school are out of scope for
          this phase, not missing.
        </p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
    </SectionGuard>
  );
}
