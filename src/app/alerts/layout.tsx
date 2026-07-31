"use client";

import { Suspense } from "react";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Alert Rules", href: "/alerts" },
  { label: "Notification Templates", href: "/alerts/templates" }
];

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SectionGuard section="alerts">
      <section className="admin-main">
        <h1>Alerts &amp; Notifications</h1>
        <p className="admin-subtitle">Alert rules and the templates used to notify people.</p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
    </SectionGuard>
  );
}
