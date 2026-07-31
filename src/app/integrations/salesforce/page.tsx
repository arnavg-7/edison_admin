"use client";

import { useState } from "react";
import { REPORTS, salesforceHealth } from "@/lib/data/salesforce";
import { TIME_WINDOWS, type TimeWindow } from "@/lib/data/integrations";
import { SectionFilterBar } from "@/components/shared/SectionFilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatSalesforceStamp } from "@/lib/format";

/**
 * Salesforce API connection health. Every dashboard in the app reads through
 * this connection, so a failure here explains stale numbers everywhere else —
 * which is why the per-report pull times are listed rather than a single
 * connection timestamp.
 */
export default function SalesforceHealthPage() {
  const [window, setWindow] = useState<TimeWindow>("24h");

  /* Deduped by report name: more than one card can read the same Salesforce
     report (the donut and the grouped bars both use Students By Grade), but
     this table is one row per report, not per card. */
  const reports = Array.from(
    new Map(Object.values(REPORTS).map((report) => [report.name, report])).values()
  );
  const oldest = reports.reduce(
    (acc, report) => (report.asOf < acc.asOf ? report : acc),
    reports[0]
  );

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
            value: "salesforce",
            options: [{ value: "salesforce", label: "Salesforce API log" }],
            onChange: () => {}
          }
        ]}
      />

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Connection</h2>
          <StatusBadge tone={salesforceHealth.status}>{salesforceHealth.statusLabel}</StatusBadge>
        </div>

        <div className="sf-stat-row">
          <div>
            <dt>Last successful pull</dt>
            <dd className="sf-stat-small">
              {formatSalesforceStamp(salesforceHealth.lastSuccessfulPull)}
            </dd>
          </div>
          <div>
            <dt>Error rate</dt>
            <dd>{salesforceHealth.errorRate}</dd>
          </div>
          <div>
            <dt>Reports tracked</dt>
            <dd>{salesforceHealth.reportsTracked}</dd>
          </div>
          <div>
            <dt>Slowest report</dt>
            <dd className="sf-stat-small">
              {salesforceHealth.slowestReport.name} · {salesforceHealth.slowestReport.seconds}s
            </dd>
          </div>
        </div>

        <p className="sf-card-hint">API limit: {salesforceHealth.rateLimit}</p>
      </div>

      <div className="sf-panel sf-callout">
        <h2>Refresh behaviour is unconfirmed</h2>
        <p>
          Whether Admin may trigger an on-demand Salesforce refresh, or only display cached report
          state, is still open — so the refresh control on every metric card is deliberately inert.
          The report cadence below is observed from the mock data, not a documented schedule.
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Last pull per report</h2>
          <span className="sf-panel-note">
            Oldest: {oldest.name} at {formatSalesforceStamp(oldest.asOf)}
          </span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Report</th>
                <th scope="col">Last refreshed</th>
                <th scope="col">Freshness</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const stale = report.asOf === oldest.asOf;
                return (
                  <tr key={report.name}>
                    <td>{report.name}</td>
                    <td>{formatSalesforceStamp(report.asOf)}</td>
                    <td>
                      <StatusBadge tone={stale ? "warn" : "ok"}>
                        {stale ? "Oldest pull" : "Current"}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
