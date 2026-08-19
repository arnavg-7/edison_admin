"use client";

import { Suspense } from "react";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { useAdminScope } from "@/lib/admin-scope";
import { canReachPath } from "@/lib/nav";

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
  const { persona } = useAdminScope();
  /* The audit log is IT's, and the Portal Administrator holds the rest of this
     section — so the tab goes rather than being shown and refused. Asked of the
     same access map the route gate reads, so the tab row and the gate cannot
     disagree. */
  const tabs = TABS.filter((tab) => canReachPath(persona, tab.href));

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">System Settings</h1>
      <p className="sf-page-sub">
        Grade levels, subjects, calendar, announcements and audit history.
      </p>

      <Suspense fallback={null}>
        <SectionTabs tabs={tabs} />
      </Suspense>
      {children}
    </section>
  );
}
