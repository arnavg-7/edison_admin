"use client";

import { announcements } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";
import { SettingsScreenGuard } from "@/components/settings/SettingsScreenGuard";

export default function AnnouncementsPage() {
  const active = announcements.filter((item) => item.status?.label === "Active").length;

  return (
    <SettingsScreenGuard screen="announcements">
      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Announcements</h2>
          <span className="config-status-summary">
            {active} of {announcements.length} active
          </span>
        </div>

        <ListEditor
          items={announcements}
          addLabel="Add announcement"
          emptyTitle="No announcements"
          emptyMessage="Add an announcement to surface it in the portals."
        />
      </div>
    </SettingsScreenGuard>
  );
}
