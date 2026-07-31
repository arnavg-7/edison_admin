"use client";

import { notificationTemplates } from "@/lib/data/alerts";
import { ListEditor } from "@/components/shared/ListEditor";

export default function NotificationTemplatesPage() {
  const active = notificationTemplates.filter((item) => item.status?.label === "Active").length;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Notification templates</h2>
        <span className="sf-panel-note">
          {active} of {notificationTemplates.length} active
        </span>
      </div>

      <ListEditor
        items={notificationTemplates}
        addLabel="Add template"
        emptyTitle="No notification templates yet"
        emptyMessage="Add a template so alert rules have something to send."
      />
    </div>
  );
}
