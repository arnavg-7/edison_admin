import type { StatusTone } from "./types";

// TODO: replace with the real Genesis OneRoster ingestion log and the
// Classroom/Calendar API sync contracts.

/** OneRoster file types Genesis delivers in the daily drop. */
export type GenesisFileType =
  | "orgs"
  | "users"
  | "enrollments"
  | "classes"
  | "courses"
  | "academicSessions"
  | "demographics"
  | "attendance";

export type GenesisFileResult = {
  file: GenesisFileType;
  rows: number;
  status: StatusTone;
  note?: string;
};

export type GenesisIngest = {
  /** Whether today's file landed at all — the first thing IT needs to know. */
  arrived: boolean;
  expectedBy: string;
  lastSuccessfulIngest: string;
  status: StatusTone;
  statusLabel: string;
  files: GenesisFileResult[];
  validationErrors: { file: GenesisFileType; message: string; count: number }[];
};

// TODO: the failure taxonomy here (partial / missing / validation error) is a
// placeholder. IT still needs to define the real file-arrival window and what
// counts as a failure vs. a warning.
export const genesisIngest: GenesisIngest = {
  arrived: true,
  expectedBy: "2026-07-17T05:00:00-04:00",
  lastSuccessfulIngest: "2026-07-17T05:12:00-04:00",
  status: "warn",
  statusLabel: "Processed with validation errors",
  files: [
    { file: "orgs", rows: 5, status: "ok" },
    { file: "users", rows: 14208, status: "ok" },
    { file: "enrollments", rows: 51884, status: "ok" },
    { file: "classes", rows: 1932, status: "ok" },
    { file: "courses", rows: 486, status: "ok" },
    { file: "academicSessions", rows: 24, status: "ok" },
    { file: "demographics", rows: 13744, status: "warn", note: "464 rows missing optional fields" },
    { file: "attendance", rows: 12905, status: "ok" }
  ],
  validationErrors: [
    { file: "demographics", message: "Missing optional field: race/ethnicity", count: 464 },
    { file: "users", message: "Duplicate sourcedId skipped", count: 12 }
  ]
};

/**
 * Real production gap, not a synthetic-data artifact: Genesis has homeroom
 * courses for only 1 of 5 schools and zero homeroom enrollments anywhere.
 */
export const homeroomMapping = {
  schoolsWithHomeroomCourses: 1,
  totalSchools: 5,
  enrollments: 0
};

export type ApiSyncStatus = {
  id: "classroom" | "calendar";
  label: string;
  status: StatusTone;
  statusLabel: string;
  lastSuccessfulSync: string;
  uptime: string;
  errorRate: string;
  rateLimit: string;
  recordsSynced: number;
};

export type TimeWindow = "24h" | "7d" | "30d";

export const TIME_WINDOWS: { value: TimeWindow; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" }
];

/**
 * Genesis file history. One row per daily drop — a file-per-day shape, unlike
 * the continuous API logs, which is why the two are kept as separate views.
 */
export type GenesisHistoryEntry = {
  date: string;
  arrivedAt: string | null;
  status: StatusTone;
  statusLabel: string;
  rows: number;
  errors: number;
};

export const genesisHistory: GenesisHistoryEntry[] = [
  {
    date: "2026-07-17",
    arrivedAt: "2026-07-17T05:12:00-04:00",
    status: "warn",
    statusLabel: "Validation errors",
    rows: 95188,
    errors: 476
  },
  {
    date: "2026-07-16",
    arrivedAt: "2026-07-16T05:04:00-04:00",
    status: "ok",
    statusLabel: "Success",
    rows: 95102,
    errors: 0
  },
  {
    date: "2026-07-15",
    arrivedAt: null,
    status: "error",
    statusLabel: "File not received",
    rows: 0,
    errors: 0
  },
  {
    date: "2026-07-14",
    arrivedAt: "2026-07-14T05:09:00-04:00",
    status: "ok",
    statusLabel: "Success",
    rows: 94980,
    errors: 0
  },
  {
    date: "2026-07-13",
    arrivedAt: "2026-07-13T05:18:00-04:00",
    status: "ok",
    statusLabel: "Success",
    rows: 94874,
    errors: 0
  }
];

export const apiSyncStatuses: ApiSyncStatus[] = [
  {
    id: "classroom",
    label: "Google Classroom",
    status: "ok",
    statusLabel: "Healthy",
    lastSuccessfulSync: "2026-07-17T12:47:00-04:00",
    uptime: "99.94%",
    errorRate: "0.06%",
    rateLimit: "412 / 1,000 per min",
    recordsSynced: 38412
  },
  {
    id: "calendar",
    label: "Google Calendar",
    status: "warn",
    statusLabel: "Degraded — elevated errors",
    lastSuccessfulSync: "2026-07-17T12:31:00-04:00",
    uptime: "98.20%",
    errorRate: "1.80%",
    rateLimit: "889 / 1,000 per min",
    recordsSynced: 9044
  }
];

/**
 * Combined sync/error log across both patterns. `source` is what the Source
 * filter narrows on; file-ingest and API entries are interleaved here but stay
 * separately filterable.
 */
export type SyncLogEntry = {
  id: string;
  at: string;
  source: "genesis" | "classroom" | "calendar" | "salesforce";
  level: StatusTone;
  message: string;
};

export const syncLog: SyncLogEntry[] = [
  {
    id: "sl-sf-1",
    at: "2026-07-17T12:12:00-04:00",
    source: "salesforce",
    level: "ok",
    message: "Dashboard pull completed — 15 reports refreshed"
  },
  {
    id: "sl-sf-2",
    at: "2026-07-17T06:18:00-04:00",
    source: "salesforce",
    level: "warn",
    message: "Attendance YTD Report took 8.4s — approaching report timeout"
  },
  {
    id: "sl-1",
    at: "2026-07-17T12:47:00-04:00",
    source: "classroom",
    level: "ok",
    message: "Sync completed — 38,412 records"
  },
  {
    id: "sl-2",
    at: "2026-07-17T12:31:00-04:00",
    source: "calendar",
    level: "warn",
    message: "Sync completed with 163 retried requests (rate limit pressure)"
  },
  {
    id: "sl-3",
    at: "2026-07-17T11:58:00-04:00",
    source: "calendar",
    level: "error",
    message: "429 Too Many Requests — backing off for 60s"
  },
  {
    id: "sl-4",
    at: "2026-07-17T05:12:00-04:00",
    source: "genesis",
    level: "warn",
    message: "Daily file processed — 476 validation errors across 2 file types"
  },
  {
    id: "sl-5",
    at: "2026-07-17T05:00:00-04:00",
    source: "genesis",
    level: "ok",
    message: "Daily file detected — beginning ingest"
  },
  {
    id: "sl-6",
    at: "2026-07-16T08:07:00-04:00",
    source: "genesis",
    level: "ok",
    message: "Manual re-run of 2026-07-16 daily file completed"
  },
  {
    id: "sl-7",
    at: "2026-07-15T06:30:00-04:00",
    source: "genesis",
    level: "error",
    message: "Daily file not received by 06:30 cutoff"
  }
];
