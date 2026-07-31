"use client";

import Link from "next/link";
import { platformPulse } from "@/lib/data/metrics";
import { REPORT_ENTRIES } from "@/lib/data/reportIndex";
import { schools } from "@/lib/data/schools";
import { MetricStrip } from "@/components/shared/MetricTile";
import { currentTerm } from "@/lib/data/academicCalendar";

/**
 * Leadership landing screen. Read-only by design — the five Reporting screens
 * are surfaced as entry points so this is a way in rather than a dead end.
 */
export function LeadershipHome() {
  const term = currentTerm();

  return (
    <section className="admin-main">
      <h1>District Overview</h1>
      <p className="admin-subtitle">
        All schools · {term.label}. Reporting is read-only; use the reports below to narrow by
        school, grade and class.
      </p>

      <MetricStrip metrics={platformPulse} />

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Reports</h2>
          <span className="config-status-summary">
            {schools.length} schools · filters carry across every report
          </span>
        </div>

        <div className="report-grid">
          {REPORT_ENTRIES.map((entry) => (
            <Link className="report-card" href={entry.href} key={entry.id}>
              <span className="report-card-highlight">{entry.highlight}</span>
              <span className="report-card-title">{entry.label}</span>
              <span className="report-card-desc">{entry.description}</span>
              <span className="report-card-go" aria-hidden>
                View report →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
