"use client";

import { announcements } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function AnnouncementsPage() {
  return (
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Announcements</h2>
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
