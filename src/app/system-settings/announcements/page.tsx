"use client";

import { announcements } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function AnnouncementsPage() {
  const active = announcements.filter((item) => item.status?.label === "Active").length;

  return (
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Announcements</h2>
          <span className="sf-panel-note">
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
  );
}
