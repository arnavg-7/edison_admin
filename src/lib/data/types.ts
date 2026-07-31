// Shared shapes for the mocked data layer.
//
// NOTE: none of these are confirmed contracts. No Genesis/OneRoster ingestion,
// Classroom/Calendar API client, or Admin DB model exists in the repo yet, so
// every shape below is a placeholder inferred from the Build Brief and must be
// reconciled with the real contracts when they land.

export type DataSource = "genesis" | "classroom" | "calendar" | "admin_db";

export const SOURCE_LABELS: Record<DataSource, string> = {
  genesis: "Genesis",
  classroom: "Google Classroom",
  calendar: "Google Calendar",
  admin_db: "Admin DB"
};

/**
 * A single metric value carrying its own freshness. Every metric stamps itself:
 * Genesis is a once-daily file, Classroom is near-real-time, and Admin DB
 * updates on write, so a shared dashboard-wide timestamp would misreport at
 * least two of the three.
 */
export type Metric = {
  id: string;
  label: string;
  value: string;
  source: DataSource;
  /** ISO 8601. Fixed in mocks so server and client render identically. */
  asOf: string;
  /** Cadence description shown alongside the stamp. */
  cadence: string;
  trend?: { direction: "up" | "down" | "flat"; delta: string };
};

export type StatusTone = "ok" | "warn" | "error" | "neutral";
