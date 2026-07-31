"use client";

import { Suspense } from "react";
import { SectionGuard } from "@/components/shell/SectionGuard";
import { SectionTabs } from "@/components/shared/SectionTabs";
import { useRole } from "@/lib/role/RoleContext";
import { settingsScreensForRole } from "@/lib/role/systemSettingsAccess";

export default function SystemSettingsLayout({ children }: { children: React.ReactNode }) {
  const { role } = useRole();
  const screens = settingsScreensForRole(role);

  return (
    <SectionGuard section="system-settings">
      <section className="admin-main">
        <h1>System Settings</h1>
        <p className="admin-subtitle">
          {role === "it_admin"
            ? "User provisioning, permissions, and audit history."
            : "Grade levels, subjects, calendar, and announcements."}
        </p>

        <Suspense fallback={null}>
          <SectionTabs tabs={screens.map(({ label, href }) => ({ label, href }))} />
        </Suspense>
        {children}
      </section>
    </SectionGuard>
  );
}
