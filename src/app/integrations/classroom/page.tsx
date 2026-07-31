"use client";

import { useState } from "react";
import { TIME_WINDOWS, apiSyncStatuses, syncLog, type TimeWindow } from "@/lib/data/integrations";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { ApiSyncStatusTile } from "@/components/shared/ApiSyncStatusTile";
import { SyncLogTable } from "@/components/integrations/SyncLogTable";

export default function ClassroomIntegrationPage() {
  const [window, setWindow] = useState<TimeWindow>("24h");
  const api = apiSyncStatuses.find((item) => item.id === "classroom");

  if (!api) {
    return null;
  }

  return (
    <>
      <SectionFilterBar
        filters={[
          {
            id: "window",
            label: "Time Window",
            value: window,
            options: TIME_WINDOWS,
            onChange: (value) => setWindow(value as TimeWindow)
          },
          {
            id: "source",
            label: "Source",
            value: "classroom",
            options: [{ value: "classroom", label: "Classroom API log" }],
            onChange: () => {}
          }
        ]}
      />

      <ApiSyncStatusTile api={api} />

      <div className="sf-panel">
        <h2>Recent activity</h2>
        <SyncLogTable entries={syncLog.filter((entry) => entry.source === "classroom")} />
      </div>
    </>
  );
}
