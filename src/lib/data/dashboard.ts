import type { BarGroup, FunnelStage } from "@/components/sf/charts";

/**
 * District metric figures.
 *
 * The reference Salesforce dashboards were a *visual* reference only. Metrics
 * kept here all map onto data Edison actually has — enrollment and attendance
 * from Genesis, assignments from Classroom, goals from the Admin DB.
 *
 * Deliberately removed: Total Events Held, Event Participants and Well-Being
 * Trend. Those appeared only in the screenshots, are absent from Edison's scope
 * docs, and have no source system — the Portal Specs flag them as new data
 * domains. Re-adding them is a scope decision, not a gap to fill.
 *
 * TODO: every value here is display data, not a live Salesforce pull. Replace
 * with real report results once the API pattern is confirmed (brief open item 5).
 */

export const numberOfStudents = 1702;
export const totalFaculty = 82;

export const studentsByGrade: BarGroup[] = [
  {
    label: "Benjamin Franklin Elementary",
    rows: [
      { label: "Grade 10", value: 153, colorIndex: 0 },
      { label: "Grade 8", value: 150, colorIndex: 2 },
      { label: "Grade 9", value: 4, colorIndex: 1 }
    ]
  },
  {
    label: "Edison High School",
    rows: [
      { label: "—", value: 9, colorIndex: 1 },
      { label: "Grade 10", value: 1, colorIndex: 0 }
    ]
  },
  {
    label: "James Madison Intermediate",
    rows: [
      { label: "—", value: 3, colorIndex: 1 },
      { label: "Grade 10", value: 2, colorIndex: 0 },
      { label: "Grade 8", value: 38, colorIndex: 2 },
      { label: "Grade 9", value: 122, colorIndex: 1 }
    ]
  },
  {
    label: "James Madison Primary",
    rows: [
      { label: "Grade 10", value: 74, colorIndex: 0 },
      { label: "Grade 8", value: 10, colorIndex: 2 },
      { label: "Grade 9", value: 1, colorIndex: 1 }
    ]
  },
  {
    label: "John Marshall Elementary",
    rows: [
      { label: "Grade 10", value: 150, colorIndex: 0 },
      { label: "Grade 8", value: 58, colorIndex: 2 },
      { label: "Grade 9", value: 52, colorIndex: 1 }
    ]
  },
  {
    label: "John P. Stevens High School",
    rows: [
      { label: "Grade 10", value: 98, colorIndex: 0 },
      { label: "Grade 8", value: 180, colorIndex: 2 },
      { label: "Grade 9", value: 171, colorIndex: 1 }
    ]
  },
  {
    label: "Lincoln Elementary School",
    rows: [
      { label: "Grade 8", value: 77, colorIndex: 2 },
      { label: "Grade 9", value: 84, colorIndex: 1 }
    ]
  }
];

/** Individual-level attendance — links through to Student 360. */
export type AttendanceRow = {
  contactId: string;
  contact: string;
  present: number;
  absent: number;
  halfDay: number;
};

export const studentAttendance: AttendanceRow[] = [
  { contactId: "michael-andrew", contact: "Michael Andrew", present: 6, absent: 18, halfDay: 0 },
  { contactId: "mohd-anas-gupta", contact: "Mohd.Anas Gupta", present: 1, absent: 1, halfDay: 0 },
  { contactId: "naphisabet-lyngkhoi", contact: "Naphisabet Lyngkhoi", present: 1, absent: 0, halfDay: 0 },
  { contactId: "nick-johnson", contact: "Nick Johnson", present: 14, absent: 3, halfDay: 1 },
  { contactId: "oliver-james", contact: "Oliver James", present: 1, absent: 1, halfDay: 0 },
  { contactId: "rk-sharma", contact: "R.K. Sharma", present: 2, absent: 2, halfDay: 0 },
  { contactId: "robert-daniel", contact: "Robert Daniel", present: 6, absent: 0, halfDay: 0 }
];

export const studentAttendanceBySchool: BarGroup[] = [
  {
    label: "Benjamin Franklin Elementary School",
    rows: [
      { label: "Present", value: 129, colorIndex: 0 },
      { label: "Absent", value: 68, colorIndex: 1 },
      { label: "Attended half a day", value: 1, colorIndex: 2 }
    ]
  },
  {
    label: "Edison High School",
    rows: [
      { label: "Present", value: 16, colorIndex: 0 },
      { label: "Absent", value: 6, colorIndex: 1 },
      { label: "Attended half a day", value: 1, colorIndex: 2 }
    ]
  },
  {
    label: "Edison Township Public Schools",
    rows: [
      { label: "Present", value: 19, colorIndex: 0 },
      { label: "Absent", value: 8, colorIndex: 1 },
      { label: "Attended half a day", value: 3, colorIndex: 2 }
    ]
  },
  {
    label: "James Madison Intermediate School",
    rows: [
      { label: "Present", value: 62, colorIndex: 0 },
      { label: "Absent", value: 24, colorIndex: 1 }
    ]
  }
];

export const studentsStatus: FunnelStage[] = [
  { label: "On Track", value: 1201, colorIndex: 0 },
  { label: "At Risk", value: 460, colorIndex: 2 },
  { label: "Other", value: 41, colorIndex: 1 }
];

export const assignmentSubmissions: BarGroup[] = [
  { label: "Grade 10", rows: [{ label: "Submissions", value: 11, colorIndex: 0 }] },
  { label: "Grade 8", rows: [{ label: "Submissions", value: 35, colorIndex: 0 }] },
  { label: "Grade 9", rows: [{ label: "Submissions", value: 16, colorIndex: 0 }] }
];

/*
 * `coreMetrics` — the three fixed figures with their week-over-week trend
 * strings — lived here and is gone. Home reads the same three from
 * `coreMetricsForScope` in reporting.ts now, so they respond to the page's
 * school/grade filter, and the trend strings had no reader left once the
 * delta badge was dropped from both dashboards (2026-08-06).
 */

export const ATTENDANCE_SERIES = [
  { label: "Present", colorIndex: 0 },
  { label: "Absent", colorIndex: 1 },
  { label: "Attended half a day", colorIndex: 2 }
];

export const GRADE_SERIES = [
  { label: "Grade 10", colorIndex: 0 },
  { label: "Grade 8", colorIndex: 2 },
  { label: "Grade 9", colorIndex: 1 }
];
