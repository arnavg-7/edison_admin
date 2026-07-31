"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Alert Rules", href: "/alerts" },
  { label: "Notification Templates", href: "/alerts/templates" }
];

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return (
      <section className="sf-main">
        <h1>Alerts &amp; Notifications</h1>
        <p className="sf-page-sub">Alert rules and the templates used to notify people.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
  );
}
