"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";

/**
 * v2 merges what v1 split by persona (academic config vs. users/audit) into one
 * unified section — Super Admin manages all of it.
 */
const TABS = [
  { label: "Grade Levels", href: "/system-settings" },
  { label: "Subjects", href: "/system-settings/subjects" },
  { label: "Academic Calendar", href: "/system-settings/calendar" },
  { label: "Announcements", href: "/system-settings/announcements" },
  { label: "Data Privacy & Audit Log", href: "/system-settings/audit-log" }
];

export default function SystemSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="sf-main">
      <h1 className="sf-page-title">System Settings</h1>
      <p className="sf-page-sub">
        Grade levels, subjects, calendar, announcements and audit history.
      </p>

      <Suspense fallback={null}>
        <SectionTabs tabs={TABS} />
      </Suspense>
      {children}
    </section>
  );
}
