"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

const TABS = [
  { label: "Genesis / SIS", href: "/integrations" },
  // v2: the layer every other screen now depends on, so it sits first among
  // the API panels rather than last.
  { label: "Salesforce API", href: "/integrations/salesforce" },
  { label: "Google Classroom", href: "/integrations/classroom" },
  { label: "Google Calendar", href: "/integrations/calendar" },
  { label: "Sync & Error Log", href: "/integrations/sync-log" }
];

export default function IntegrationsLayout({ children }: { children: React.ReactNode }) {
  return (
      <section className="sf-main">
        <h1>Integrations</h1>
        <p className="sf-page-sub">
          Salesforce API health plus the upstream feeds into it: Genesis file ingest, Classroom and Calendar.
        </p>

        <Suspense fallback={null}>
          <SectionTabs tabs={TABS} />
        </Suspense>
        {children}
      </section>
  );
}
