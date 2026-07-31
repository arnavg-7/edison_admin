"use client";

import { Suspense } from "react";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Goal Templates", href: "/academic-goals" },
  { label: "Goal Categories", href: "/academic-goals/categories" },
  { label: "Progress Tracking", href: "/academic-goals/progress-tracking" }
];

export default function AcademicGoalsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionGuard section="academic-goals">
      <section className="admin-main">
        <h1>Academic Goals</h1>
        <p className="admin-subtitle">Goal templates, categories, and progress tracking.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
    </SectionGuard>
  );
}
