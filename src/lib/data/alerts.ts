import type { StatusTone } from "./types";
import { peopleOfKind } from "./people";

// TODO: replace with the real Admin DB alerts contract.

// ---------------------------------------------------------------------------
// Individual alerts — the live feed on the main Alerts screen. Each row is
// one alert raised for one student, with the create/resolve lifecycle and
// faculty tagging the admin needs to triage it.
// ---------------------------------------------------------------------------

export type AlertSeverity = "high" | "medium" | "low";
export type AlertLifecycleStatus = "Open" | "Resolved";

export type StudentAlert = {
  id: string;
  studentId: string;
  studentName: string;
  schoolId: string;
  grade: string;
  category: string;
  severity: AlertSeverity;
  description: string;
  status: AlertLifecycleStatus;
  loggedAt: string;
  createdBy: string;
  resolvedAt?: string;
  resolvedBy?: string;
  /** Person ids from people.ts (kind: "faculty"). */
  taggedFaculty: string[];
};

export function severityTone(severity: AlertSeverity): StatusTone {
  if (severity === "high") return "error";
  if (severity === "medium") return "warn";
  return "neutral";
}

export const studentAlerts: StudentAlert[] = [
  {
    id: "sa-1",
    studentId: "michael-andrew",
    studentName: "Michael Andrew",
    schoolId: "edison-hs",
    grade: "10",
    category: "Attendance",
    severity: "high",
    description: "Has not been attending classes for the past 3 days.",
    status: "Open",
    loggedAt: "2026-08-01T09:10:00-04:00",
    createdBy: "Kenneth Blekeski",
    taggedFaculty: ["k-blekeski", "p-nair"]
  },
  {
    id: "sa-2",
    studentId: "nick-johnson",
    studentName: "Nick Johnson",
    schoolId: "edison-hs",
    grade: "9",
    category: "Missing work",
    severity: "medium",
    description: "Two or more missing assignments in English Language Arts this week.",
    status: "Open",
    loggedAt: "2026-07-30T13:45:00-04:00",
    createdBy: "A. Chen",
    taggedFaculty: ["a-chen"]
  },
  {
    id: "sa-3",
    studentId: "rk-sharma",
    studentName: "R.K. Sharma",
    schoolId: "james-madison-intermediate",
    grade: "8",
    category: "Goal overdue",
    severity: "medium",
    description: "Missed a checkpoint on \"Submit all science lab reports on time.\"",
    status: "Open",
    loggedAt: "2026-07-29T08:00:00-04:00",
    createdBy: "Super Admin",
    taggedFaculty: ["p-nair"]
  },
  {
    id: "sa-4",
    studentId: "robert-daniel",
    studentName: "Robert Daniel",
    schoolId: "edison-hs",
    grade: "10",
    category: "Behavior",
    severity: "low",
    description: "Disruptive outburst during Computer Science; asked to step out to the hallway.",
    status: "Open",
    loggedAt: "2026-07-28T11:20:00-04:00",
    createdBy: "D. Osei",
    taggedFaculty: ["d-osei", "k-blekeski"]
  },
  {
    id: "sa-5",
    studentId: "mohd-anas-gupta",
    studentName: "Mohd.Anas Gupta",
    schoolId: "edison-hs",
    grade: "10",
    category: "Attendance",
    severity: "low",
    description: "Absent for a full day with no note on file; please alert the school nurse if attendance drops further.",
    status: "Open",
    loggedAt: "2026-07-27T07:50:00-04:00",
    createdBy: "K. Blekeski",
    taggedFaculty: ["k-blekeski"]
  },
  {
    id: "sa-6",
    studentId: "michael-andrew",
    studentName: "Michael Andrew",
    schoolId: "edison-hs",
    grade: "10",
    category: "Missing work",
    severity: "high",
    description: "Three or more missing assignments across Algebra II and US History.",
    status: "Resolved",
    loggedAt: "2026-06-20T06:00:00-04:00",
    createdBy: "K. Blekeski",
    resolvedAt: "2026-06-24T10:15:00-04:00",
    resolvedBy: "K. Blekeski",
    taggedFaculty: ["k-blekeski", "d-osei"]
  },
  {
    id: "sa-7",
    studentId: "oliver-james",
    studentName: "Oliver James",
    schoolId: "james-madison-intermediate",
    grade: "8",
    category: "Grade drop",
    severity: "medium",
    description: "Mathematics grade fell from B to C+ over the last two assessments.",
    status: "Resolved",
    loggedAt: "2026-07-10T09:30:00-04:00",
    createdBy: "P. Nair",
    resolvedAt: "2026-07-18T14:00:00-04:00",
    resolvedBy: "Super Admin",
    taggedFaculty: ["p-nair"]
  },
  {
    id: "sa-8",
    studentId: "naphisabet-lyngkhoi",
    studentName: "Naphisabet Lyngkhoi",
    schoolId: "edison-hs",
    grade: "9",
    category: "Attendance",
    severity: "low",
    description: "Arrived late to homeroom three times this week.",
    status: "Open",
    loggedAt: "2026-08-02T08:05:00-04:00",
    createdBy: "K. Blekeski",
    taggedFaculty: ["k-blekeski"]
  }
];

/** All faculty available to tag on an alert. */
export function taggableFaculty() {
  return peopleOfKind("faculty");
}
