import type { BarGroup, DonutSlice, FunnelStage, StackRow } from "@/components/sf/charts";

/**
 * Figures transcribed from the reference Salesforce dashboards so the build can
 * be compared against them directly.
 *
 * TODO: every value here is display data, not a live Salesforce pull. Replace
 * with real report results once the API pattern is confirmed (brief open item 5).
 */

export const numberOfStudents = 1702;
export const totalFaculty = 82;
export const totalEventsHeld = 197;
export const eventParticipants = 22760;

/** Teacher-Student Ratio — stacked 100% bars per program. */
export const teacherStudentRatio: StackRow[] = [
  { label: "Elementary A-K", segments: [{ value: 4, colorIndex: 4 }, { value: 96, colorIndex: 0 }] },
  { label: "Elementary L-Z", segments: [{ value: 5, colorIndex: 4 }, { value: 95, colorIndex: 0 }] }
];

export const studentCountBySchool: DonutSlice[] = [
  { label: "Benjamin Franklin Elementary School", value: 307, colorIndex: 0 },
  { label: "James Madison Intermediate School", value: 165, colorIndex: 2 },
  { label: "James Madison Primary School", value: 85, colorIndex: 1 },
  { label: "James Monroe Elementary School", value: 235, colorIndex: 1 },
  { label: "Other", value: 34, colorIndex: 3 }
];

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

/**
 * Well-Being Trend — logged feeling over time.
 *
 * TODO: well-being is a new data domain. The Salesforce object and field
 * backing "logged feeling" are not confirmed (Portal Specs Step 5) — these
 * groupings mirror the reference screenshot rather than a known schema.
 */
export const wellBeingTrend: BarGroup[] = [
  {
    label: "—",
    rows: [
      { label: "Neutral", value: 9, colorIndex: 0 },
      { label: "Pleasant", value: 8, colorIndex: 2 },
      { label: "Unpleasant", value: 16, colorIndex: 1 }
    ]
  },
  {
    label: "26/06/2025",
    rows: [
      { label: "Neutral", value: 7, colorIndex: 0 },
      { label: "Pleasant", value: 6, colorIndex: 2 }
    ]
  },
  {
    label: "01/07/2025",
    rows: [
      { label: "Neutral", value: 6, colorIndex: 0 },
      { label: "Pleasant", value: 6, colorIndex: 2 },
      { label: "Unpleasant", value: 14, colorIndex: 1 }
    ]
  },
  { label: "04/07/2025", rows: [{ label: "Neutral", value: 1, colorIndex: 0 }] },
  { label: "08/07/2025", rows: [{ label: "Unpleasant", value: 1, colorIndex: 1 }] },
  { label: "18/07/2025", rows: [{ label: "Neutral", value: 1, colorIndex: 0 }] }
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

/** The three original core metrics, now read from Salesforce. */
export const coreMetrics = [
  { id: "attendance-rate", label: "Attendance Rate", value: "92.4%", trend: "-0.6 pts vs. last week" },
  { id: "goal-completion", label: "Goal Completion %", value: "68.1%", trend: "+2.3 pts vs. last week" },
  {
    id: "assignment-completion",
    label: "Assignment Completion Rate",
    value: "84.7%",
    trend: "+1.1 pts vs. last week"
  }
];

export const ATTENDANCE_SERIES = [
  { label: "Present", colorIndex: 0 },
  { label: "Absent", colorIndex: 1 },
  { label: "Attended half a day", colorIndex: 2 }
];

export const WELLBEING_SERIES = [
  { label: "Neutral", colorIndex: 0 },
  { label: "Pleasant", colorIndex: 2 },
  { label: "Unpleasant", colorIndex: 1 }
];

export const GRADE_SERIES = [
  { label: "Grade 10", colorIndex: 0 },
  { label: "Grade 8", colorIndex: 2 },
  { label: "Grade 9", colorIndex: 1 }
];

export const RATIO_SERIES = [
  { label: "Faculty", colorIndex: 4 },
  { label: "Student", colorIndex: 0 }
];

export const STATUS_SERIES = [
  { label: "On Track", colorIndex: 0 },
  { label: "At Risk", colorIndex: 2 },
  { label: "Other", colorIndex: 1 }
];
