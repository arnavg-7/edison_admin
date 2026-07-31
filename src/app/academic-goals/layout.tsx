"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Goal Templates", href: "/academic-goals" },
  { label: "Goal Categories", href: "/academic-goals/categories" },
  { label: "Progress Tracking", href: "/academic-goals/progress-tracking" }
];

export default function AcademicGoalsLayout({ children }: { children: React.ReactNode }) {
  return (
      <section className="sf-main">
        <h1>Academic Goals</h1>
        <p className="sf-page-sub">Goal templates, categories, and progress tracking.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
  );
}
