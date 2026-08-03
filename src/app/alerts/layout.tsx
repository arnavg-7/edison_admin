"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Alerts", href: "/alerts" },
  { label: "By School", href: "/alerts/by-school" }
];

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return (
      <section className="sf-main">
        <h1>Alerts &amp; Notifications</h1>
        <p className="sf-page-sub">Current alerts raised for students, by school and grade.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
  );
}
