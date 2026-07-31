"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Genesis / SIS", href: "/integrations" },
  { label: "Google Classroom", href: "/integrations/classroom" },
  { label: "Google Calendar", href: "/integrations/calendar" },
  { label: "Sync & Error Log", href: "/integrations/sync-log" }
];

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return (
      <section className="sf-main">
        <h1>Integrations</h1>
        <p className="sf-page-sub">
          Genesis file ingest and the Classroom/Calendar API connections.
        </p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
  );
}
