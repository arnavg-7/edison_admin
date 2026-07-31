"use client";

import { useState } from "react";
import { TIME_WINDOWS, syncLog, type TimeWindow } from "@/lib/data/integrations";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { SyncLogTable } from "@/components/integrations/SyncLogTable";

type SourceFilter = "all" | "genesis" | "classroom" | "calendar";

const SOURCE_OPTIONS: { value: SourceFilter; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "genesis", label: "Genesis file history" },
  { value: "classroom", label: "Classroom API log" },
  { value: "calendar", label: "Calendar API log" }
];

const WINDOW_CUTOFF: Record<TimeWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000
};

/** Fixed "now" so filtering is deterministic against the mock timestamps. */
const NOW = new Date("2026-07-31T13:00:00-04:00").getTime();

export default function SyncLogPage() {
  const [window, setWindow] = useState<TimeWindow>("7d");
  const [source, setSource] = useState<SourceFilter>("all");

  const entries = syncLog.filter((entry) => {
    const inWindow = NOW - new Date(entry.at).getTime() <= WINDOW_CUTOFF[window];
    const matchesSource = source === "all" || entry.source === source;
    return inWindow && matchesSource;
  });

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
            value: source,
            options: SOURCE_OPTIONS,
            onChange: (value) => setSource(value as SourceFilter)
          }
        ]}
      />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Sync &amp; error log</h2>
          <span className="config-status-summary">
            {entries.length} of {syncLog.length} entries
          </span>
        </div>

        <SyncLogTable entries={entries} showSource />
      </div>
    </>
  );
}
