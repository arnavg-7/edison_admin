"use client";

import { announcements } from "@/lib/data/systemSettings";
import { ListEditor } from "@/components/shared/ListEditor";

export default function AnnouncementsPage() {
  return (
      <div className="sf-panel">
        <ListEditor
          heading="Announcements"
          items={announcements}
          addLabel="Add announcement"
          emptyTitle="No announcements"
          emptyMessage="Add an announcement to surface it in the portals."
        />
      </div>
  );
}
