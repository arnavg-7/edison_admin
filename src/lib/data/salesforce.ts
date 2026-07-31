/**
 * Salesforce is the unified source for every metric in v2. Genesis and
 * Classroom/Calendar still feed data upstream, but Admin reads reports from
 * Salesforce rather than querying those systems directly.
 *
 * TODO — API pattern unconfirmed (brief open item 5, Portal Specs Step 3). The
 * shape below assumes named saved reports with their own last-refresh time,
 * which fits the Reports API. If the team picks the Analytics REST API or a
 * SOQL layer instead, this module is the only place that changes: screens read
 * report metadata from here, never a raw endpoint.
 *
 * TODO — refresh cadence unconfirmed, and whether Admin may trigger an
 * on-demand refresh or only display cached report state. The refresh control on
 * each card is wired to a no-op until that's settled.
 */

/** When the dashboard as a whole last pulled — shown in the context strip. */
export const SALESFORCE_LAST_REFRESH = "2026-07-17T12:12:00-04:00";

export type SalesforceReport = {
  /** Report name as it appears in Salesforce, shown in the card footer. */
  name: string;
  /** When this specific report last refreshed. Per-card, never shared. */
  asOf: string;
};

/**
 * Report registry. Names match the reference dashboards so the footer text is
 * traceable to a real Salesforce report.
 */
export const REPORTS = {
  numberOfStudents: { name: "Number of Students", asOf: "2026-07-17T12:12:00-04:00" },
  totalFaculty: { name: "Total Faculty", asOf: "2026-07-17T12:12:00-04:00" },
  teacherStudentRatio: { name: "Student-Teacher Ratio", asOf: "2026-07-17T12:12:00-04:00" },
  studentCountBySchool: { name: "Students By Grade", asOf: "2026-07-17T12:12:00-04:00" },
  studentsByGrade: { name: "Students By Grade", asOf: "2026-07-17T12:12:00-04:00" },
  studentAttendance: { name: "Attendance YTD Report", asOf: "2026-07-17T12:12:00-04:00" },
  studentAttendanceBySchool: {
    name: "Student Attendance By School",
    asOf: "2026-07-17T12:12:00-04:00"
  },
  wellBeingTrend: { name: "Well-Being Trend", asOf: "2026-07-17T12:12:00-04:00" },
  studentsStatus: { name: "Students' Status", asOf: "2026-07-17T12:12:00-04:00" },
  assignmentSubmissions: { name: "Assignment Submissions", asOf: "2026-07-17T12:12:00-04:00" },
  totalEventsHeld: { name: "Total Events Held", asOf: "2026-07-17T12:12:00-04:00" },
  eventParticipants: { name: "Fees And Participation", asOf: "2026-07-17T12:12:00-04:00" },

  // The three original core metrics, now Salesforce-sourced. Their timestamps
  // differ from the dashboard pull because the underlying reports refresh on
  // their own schedules — which is exactly what the per-card stamp exists to
  // show.
  attendanceRate: { name: "Attendance Rate YTD", asOf: "2026-07-17T06:15:00-04:00" },
  goalCompletion: { name: "Goal Completion %", asOf: "2026-07-17T12:02:00-04:00" },
  assignmentCompletion: { name: "Assignment Completion Rate", asOf: "2026-07-17T11:47:00-04:00" }
} as const satisfies Record<string, SalesforceReport>;

/** Salesforce API connection health — the Integrations panel in v2. */
export const salesforceHealth = {
  status: "ok" as "ok" | "warn" | "error",
  statusLabel: "Connected",
  lastSuccessfulPull: "2026-07-17T12:12:00-04:00",
  errorRate: "0.04%",
  rateLimit: "18,204 / 100,000 API calls today",
  reportsTracked: Object.keys(REPORTS).length,
  slowestReport: { name: "Attendance YTD Report", seconds: 8.4 }
};
