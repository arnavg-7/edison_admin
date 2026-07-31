import type { Metric } from "./types";

// TODO: replace with real contracts — Genesis OneRoster attendance rollup,
// Classroom API assignment completion, Admin DB goal completion.
//
// The three timestamps below are intentionally different: Attendance comes from
// the once-daily Genesis file, Assignment Completion from a near-real-time
// Classroom poll, and Goal Completion from the Admin DB on write.

export const platformPulse: Metric[] = [
  {
    id: "attendance-rate",
    label: "Attendance Rate",
    value: "92.4%",
    source: "genesis",
    asOf: "2026-07-31T06:15:00-04:00",
    cadence: "Once daily from Genesis file",
    trend: { direction: "down", delta: "0.6 pts vs. last week" }
  },
  {
    id: "goal-completion",
    label: "Goal Completion",
    value: "68.1%",
    source: "admin_db",
    asOf: "2026-07-31T13:02:00-04:00",
    cadence: "Immediate on status change",
    trend: { direction: "up", delta: "2.3 pts vs. last week" }
  },
  {
    id: "assignment-completion",
    label: "Assignment Completion Rate",
    value: "84.7%",
    source: "classroom",
    asOf: "2026-07-31T12:47:00-04:00",
    cadence: "Near real-time from Classroom API",
    trend: { direction: "up", delta: "1.1 pts vs. last week" }
  }
];
