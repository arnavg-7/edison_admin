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
  expectedBy: "2026-07-31T05:00:00-04:00",
  lastSuccessfulIngest: "2026-07-31T05:12:00-04:00",
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

export const apiSyncStatuses: ApiSyncStatus[] = [
  {
    id: "classroom",
    label: "Google Classroom",
    status: "ok",
    statusLabel: "Healthy",
    lastSuccessfulSync: "2026-07-31T12:47:00-04:00",
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
    lastSuccessfulSync: "2026-07-31T12:31:00-04:00",
    uptime: "98.20%",
    errorRate: "1.80%",
    rateLimit: "889 / 1,000 per min",
    recordsSynced: 9044
  }
];
