"use client";

import { useState } from "react";
import {
  TIME_WINDOWS,
  genesisHistory,
  homeroomMapping,
  type TimeWindow
} from "@/lib/data/integrations";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { FileIngestStatusPanel } from "@/components/shared/FileIngestStatusPanel";
import { AwaitingGenesisData } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, formatNumber } from "@/lib/format";

const WINDOW_DAYS: Record<TimeWindow, number> = { "24h": 1, "7d": 7, "30d": 30 };

export default function GenesisIntegrationPage() {
  const [window, setWindow] = useState<TimeWindow>("7d");

  const history = genesisHistory.slice(0, WINDOW_DAYS[window]);

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
            value: "genesis",
            options: [{ value: "genesis", label: "Genesis file history" }],
            onChange: () => {}
          }
        ]}
      />

      <FileIngestStatusPanel />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Homeroom mapping</h2>
          <StatusBadge tone="warn">Incomplete source data</StatusBadge>
        </div>
        <AwaitingGenesisData
          detail={`Genesis has homeroom courses for ${homeroomMapping.schoolsWithHomeroomCourses} of ${homeroomMapping.totalSchools} schools and ${homeroomMapping.enrollments} homeroom enrollments in any school. Homeroom-based views stay empty until the district's Genesis export includes this data — this is a source-data gap, not an ingest failure.`}
        />
      </div>

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>File history</h2>
          <span className="config-status-summary">
            {history.length} {history.length === 1 ? "day" : "days"} shown
          </span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Arrived</th>
              <th scope="col">Rows</th>
              <th scope="col">Errors</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.date}>
                <td>{entry.date}</td>
                <td>{entry.arrivedAt ? formatDateTime(entry.arrivedAt) : "—"}</td>
                <td>{entry.rows > 0 ? formatNumber(entry.rows) : "—"}</td>
                <td>{entry.errors > 0 ? formatNumber(entry.errors) : "—"}</td>
                <td>
                  <StatusBadge tone={entry.status}>{entry.statusLabel}</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
