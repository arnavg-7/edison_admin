/**
 * Student & Faculty 360 — individual-level profiles.
 *
 * Content is grounded in Edison's own documented feature set, not the reference
 * screenshots. The Salesforce dashboards were a *visual* reference only; the
 * sections here mirror what the Student and Faculty portals actually cover:
 * academics/grades, attendance, goals (POAG), skills profile, development
 * areas, classes and schedule, and student alerts.
 *
 * Deliberately absent: events and well-being. Both came from the reference
 * screenshots and are flagged in the Portal Specs as data domains not covered by
 * Edison's scope docs, with no known source system.
 *
 * TODO: all values are mocked. There is no external system of record — this
 * product owns its own data, so every section here (personal details,
 * enrollment, grades, attendance included) is directly editable by the Super
 * Admin rather than deferring to an outside source.
 *
 * TODO — the exact editable-field list is an open item (brief §8 / open item 9).
 */

export type PersonKind = "student" | "faculty";

export type ReadOnlyField = { label: string; value: string };

/** Current-term grade per subject. */
export type GradeRecord = {
  subject: string;
  teacher: string;
  grade: string;
  percent: number;
  assignmentsComplete: number;
  assignmentsSet: number;
};

/** One prior term, for grade history. */
export type GradeHistoryTerm = {
  term: string;
  gpa: string;
  subjects: { subject: string; grade: string }[];
};

export type AttendanceRecord = {
  date: string;
  status: "Present" | "Absent" | "Attended half a day";
  classPeriod?: string;
  note?: string;
};

export type AttendanceSummary = {
  present: number;
  absent: number;
  halfDay: number;
  rate: string;
  /** Per-term history so a trend is visible, not just a single figure. */
  byTerm: { term: string; rate: string; absences: number }[];
};

export type GoalRecord = {
  id: string;
  title: string;
  category: string;
  status: "On track" | "At risk" | "Complete" | "Overdue";
  target: string;
  lastUpdated: string;
  /** Checkpoint progress, since POAG goals are reviewed at intervals. */
  checkpointsMet: number;
  checkpointsTotal: number;
};

export type AlertRecord = {
  id: string;
  rule: string;
  raised: string;
  status: "Open" | "Acknowledged" | "Resolved";
  raisedBy?: string;
  overdue?: boolean;
};

/** Skills profile — group with level-rated sub-skills, as configured in Portal Config. */
export type SkillAssessment = {
  group: string;
  subSkills: { label: string; level: "High" | "Middle" | "Elementary" }[];
};

/** Development areas — the coloured groupings students see in their portal. */
export type DevelopmentAreaEntry = {
  area: string;
  skills: string[];
};

export type ClassEnrolment = {
  className: string;
  teacher: string;
  period: string;
  room: string;
};

/** Faculty: whether attendance was submitted for each class, by day. */
export type AttendanceComplianceRow = {
  date: string;
  submitted: number;
  expected: number;
  missing: string[];
};

/** Faculty: per-class performance rollup. */
export type ClassPerformanceRow = {
  className: string;
  roster: number;
  avgAttendance: string;
  assignmentCompletion: string;
  openAlerts: number;
};

/**
 * Profile completeness, derived from the record itself rather than stored — see
 * `deriveProfileStatus`. Admin is the source of truth for these accounts, so
 * the only thing gating an account is whether its own required fields are
 * filled in.
 */
export type ProfileStatus = "Draft" | "Profile Incomplete" | "Active";

/**
 * Personal-details fields a profile must have filled before it counts as
 * Active. Deliberately the Personal details tab only: those are the fields an
 * admin owns outright, so completeness never waits on a roster import.
 */
export const REQUIRED_PERSONAL_FIELDS: Record<PersonKind, string[]> = {
  student: [
    "Preferred name",
    "Date of birth",
    "Guardian",
    "Guardian contact",
    "Home language"
  ],
  faculty: ["Staff ID", "Email", "Room", "Employment type"]
};

/** Academic-tab labels a new profile starts with, so the tab isn't empty. */
const BLANK_ACADEMIC_FIELDS: Record<PersonKind, string[]> = {
  student: [
    "Primary academic program",
    "Enrolled since",
    "Homeroom",
    "Counselor",
    "Current GPA",
    "Credits earned"
  ],
  faculty: ["Department", "Classes assigned", "Total roster", "Joined", "Subjects taught"]
};

/** Blank Personal details fields for a newly created profile. */
export function blankPersonalFields(kind: PersonKind): ReadOnlyField[] {
  return REQUIRED_PERSONAL_FIELDS[kind].map((label) => ({ label, value: "" }));
}

/** Blank Enrollment / Assignment summary fields for a newly created profile. */
export function blankAcademicFields(kind: PersonKind): ReadOnlyField[] {
  return BLANK_ACADEMIC_FIELDS[kind].map((label) => ({ label, value: "" }));
}

/**
 * Draft until the admin fills anything in, Active once every required field is
 * filled, Profile Incomplete in between. Derived rather than stored so the
 * badge can never drift from the record it describes.
 */
export function deriveProfileStatus(person: {
  kind: PersonKind;
  personal: ReadOnlyField[];
}): ProfileStatus {
  const required = REQUIRED_PERSONAL_FIELDS[person.kind];
  const byLabel = new Map(person.personal.map((field) => [field.label, field.value]));
  const filled = required.filter((label) => (byLabel.get(label) ?? "").trim() !== "").length;

  if (filled === 0) return "Draft";
  return filled === required.length ? "Active" : "Profile Incomplete";
}

/** Status pill tone, matching the app-wide three-way status scale. */
export const PROFILE_STATUS_TONE: Record<ProfileStatus, "ok" | "warn" | "neutral"> = {
  Active: "ok",
  "Profile Incomplete": "warn",
  Draft: "neutral"
};

/**
 * Builds a profile id from a name: "Priya Nair" -> "priya-nair-k3f2". The short
 * suffix keeps two people with the same name on distinct profile URLs.
 */
export function newPersonId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "user";

  return `${slug}-${Date.now().toString(36).slice(-4)}`;
}

export type Person = {
  id: string;
  kind: PersonKind;
  name: string;
  school: string;
  /** Grade for students, department for faculty. */
  group: string;
  status: "On Track" | "At Risk" | "Other";
  /** Account state for the login/portal account — distinct from `status`,
      which tracks academic standing, not whether the account is in use. */
  active: boolean;
  /** ISO timestamp of the account's most recent sign-in, if it has ever logged in. */
  lastLogin: string | null;
  personal: ReadOnlyField[];
  academic: ReadOnlyField[];

  // Student sections
  grades?: GradeRecord[];
  gradeHistory?: GradeHistoryTerm[];
  attendance?: AttendanceRecord[];
  attendanceSummary?: AttendanceSummary;
  goals?: GoalRecord[];
  skills?: SkillAssessment[];
  developmentAreas?: DevelopmentAreaEntry[];
  classes?: ClassEnrolment[];

  // Faculty sections
  teachingClasses?: ClassPerformanceRow[];
  schedule?: ClassEnrolment[];
  attendanceCompliance?: AttendanceComplianceRow[];

  alerts: AlertRecord[];
};

export const people: Person[] = [
  {
    id: "michael-andrew",
    kind: "student",
    name: "Michael Andrew",
    school: "Edison High School",
    group: "Grade 10",
    status: "At Risk",
    active: true,
    lastLogin: "2026-07-17T08:12:00-04:00",
    personal: [
      { label: "Preferred name", value: "Mike" },
      { label: "Date of birth", value: "14 Mar 2010" },
      { label: "Guardian", value: "Sandra Andrew" },
      { label: "Guardian contact", value: "sandra.andrew@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 10 — General" },
      { label: "Enrolled since", value: "02 Sep 2024" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Counselor", value: "K. Blekeski" },
      { label: "Current GPA", value: "2.4" },
      { label: "Credits earned", value: "18 of 24" }
    ],
    grades: [
      { subject: "Algebra II", teacher: "K. Blekeski", grade: "D+", percent: 68, assignmentsComplete: 14, assignmentsSet: 22 },
      { subject: "Biology", teacher: "P. Nair", grade: "C", percent: 74, assignmentsComplete: 18, assignmentsSet: 21 },
      { subject: "English Language Arts", teacher: "A. Chen", grade: "B-", percent: 81, assignmentsComplete: 19, assignmentsSet: 20 },
      { subject: "US History", teacher: "M. Alvarez", grade: "C+", percent: 78, assignmentsComplete: 16, assignmentsSet: 20 },
      { subject: "Computer Science", teacher: "D. Osei", grade: "B", percent: 84, assignmentsComplete: 17, assignmentsSet: 18 }
    ],
    gradeHistory: [
      {
        term: "Term 3 2025–26",
        gpa: "2.6",
        subjects: [
          { subject: "Algebra II", grade: "C-" },
          { subject: "Biology", grade: "C+" },
          { subject: "English Language Arts", grade: "B" },
          { subject: "US History", grade: "C+" }
        ]
      },
      {
        term: "Term 2 2025–26",
        gpa: "2.9",
        subjects: [
          { subject: "Algebra II", grade: "C" },
          { subject: "Biology", grade: "B-" },
          { subject: "English Language Arts", grade: "B+" },
          { subject: "US History", grade: "B-" }
        ]
      },
      {
        term: "Term 1 2025–26",
        gpa: "3.1",
        subjects: [
          { subject: "Algebra I", grade: "B" },
          { subject: "Biology", grade: "B+" },
          { subject: "English Language Arts", grade: "B+" },
          { subject: "US History", grade: "B" }
        ]
      }
    ],
    attendanceSummary: {
      present: 6,
      absent: 18,
      halfDay: 0,
      rate: "25.0%",
      byTerm: [
        { term: "Term 4 2025–26", rate: "25.0%", absences: 18 },
        { term: "Term 3 2025–26", rate: "78.0%", absences: 11 },
        { term: "Term 2 2025–26", rate: "91.0%", absences: 5 },
        { term: "Term 1 2025–26", rate: "96.0%", absences: 2 }
      ]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Absent", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Absent", classPeriod: "Full day" },
      { date: "15 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "14 Jul 2026", status: "Absent", classPeriod: "Full day", note: "Guardian notified" },
      { date: "13 Jul 2026", status: "Absent", classPeriod: "Full day" },
      { date: "10 Jul 2026", status: "Present", classPeriod: "Full day" }
    ],
    goals: [
      {
        id: "g-1",
        title: "Raise Algebra II assessment average to 75%",
        category: "Academic achievement",
        status: "At risk",
        target: "12 Aug 2026",
        lastUpdated: "2026-07-02T10:20:00-04:00",
        checkpointsMet: 1,
        checkpointsTotal: 4
      },
      {
        id: "g-2",
        title: "Attend 90% of scheduled classes",
        category: "Attendance & engagement",
        status: "Overdue",
        target: "30 Jun 2026",
        lastUpdated: "2026-06-28T09:05:00-04:00",
        checkpointsMet: 0,
        checkpointsTotal: 3
      },
      {
        id: "g-3",
        title: "Complete all Biology lab reports on time",
        category: "Academic achievement",
        status: "Complete",
        target: "15 May 2026",
        lastUpdated: "2026-05-14T15:40:00-04:00",
        checkpointsMet: 3,
        checkpointsTotal: 3
      }
    ],
    skills: [
      {
        group: "Resilience",
        subSkills: [
          { label: "Perseverance", level: "Elementary" },
          { label: "Flexibility", level: "Middle" },
          { label: "Adaptability", level: "Middle" }
        ]
      },
      {
        group: "Critical Thinking",
        subSkills: [
          { label: "Analysis", level: "High" },
          { label: "Reasoning", level: "Middle" },
          { label: "Innovation", level: "Middle" }
        ]
      },
      {
        group: "Effective Communication",
        subSkills: [
          { label: "Clarity", level: "Middle" },
          { label: "Active Listening", level: "Elementary" }
        ]
      }
    ],
    developmentAreas: [
      { area: "Strengths", skills: ["Analytical Thinker", "Problem Solver", "Detail-Oriented"] },
      { area: "Room To Grow", skills: ["Speed in Tests", "Time Management"] },
      { area: "Interests", skills: ["Mathematics", "Computer Science"] },
      { area: "Future Goals", skills: ["Engineering School", "STEM Career"] }
    ],
    classes: [
      { className: "Algebra II · Section C", teacher: "K. Blekeski", period: "Period 1", room: "RM-204" },
      { className: "Biology · Section B", teacher: "P. Nair", period: "Period 2", room: "RM-302" },
      { className: "English Language Arts · Section A", teacher: "A. Chen", period: "Period 4", room: "RM-118" },
      { className: "US History · Section A", teacher: "M. Alvarez", period: "Period 5", room: "RM-210" },
      { className: "Computer Science · Section A", teacher: "D. Osei", period: "Period 7", room: "RM-115" }
    ],
    alerts: [
      { id: "a-1", rule: "Attendance below 80%", raised: "2026-07-15T06:00:00-04:00", status: "Open", raisedBy: "K. Blekeski", overdue: true },
      { id: "a-2", rule: "Goal overdue by 14 days", raised: "2026-07-14T06:00:00-04:00", status: "Open", raisedBy: "System", overdue: true },
      { id: "a-3", rule: "Three or more missing assignments", raised: "2026-06-20T06:00:00-04:00", status: "Resolved", raisedBy: "K. Blekeski" },
      { id: "a-4", rule: "Grade drop of one letter (Algebra II)", raised: "2026-06-05T06:00:00-04:00", status: "Acknowledged", raisedBy: "K. Blekeski" }
    ],
  },
  {
    id: "nick-johnson",
    kind: "student",
    name: "Nick Johnson",
    school: "Edison High School",
    group: "Grade 9",
    status: "At Risk",
    active: true,
    lastLogin: "2026-07-16T15:40:00-04:00",
    personal: [
      { label: "Preferred name", value: "Nick" },
      { label: "Date of birth", value: "02 Nov 2011" },
      { label: "Guardian", value: "Ellen Johnson" },
      { label: "Guardian contact", value: "ellen.johnson@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 9 — General" },
      { label: "Enrolled since", value: "03 Sep 2025" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Counselor", value: "A. Chen" },
      { label: "Current GPA", value: "3.0" },
      { label: "Credits earned", value: "6 of 24" }
    ],
    grades: [
      { subject: "Algebra I", teacher: "K. Blekeski", grade: "B", percent: 85, assignmentsComplete: 20, assignmentsSet: 22 },
      { subject: "Biology", teacher: "P. Nair", grade: "B-", percent: 80, assignmentsComplete: 18, assignmentsSet: 21 },
      { subject: "English Language Arts", teacher: "A. Chen", grade: "C+", percent: 77, assignmentsComplete: 15, assignmentsSet: 20 }
    ],
    gradeHistory: [
      {
        term: "Term 3 2025–26",
        gpa: "3.1",
        subjects: [
          { subject: "Algebra I", grade: "B+" },
          { subject: "Biology", grade: "B" },
          { subject: "English Language Arts", grade: "B-" }
        ]
      },
      {
        term: "Term 2 2025–26",
        gpa: "3.2",
        subjects: [
          { subject: "Algebra I", grade: "B+" },
          { subject: "Biology", grade: "B+" },
          { subject: "English Language Arts", grade: "B-" }
        ]
      }
    ],
    attendanceSummary: {
      present: 14,
      absent: 3,
      halfDay: 1,
      rate: "82.4%",
      byTerm: [
        { term: "Term 4 2025–26", rate: "82.4%", absences: 3 },
        { term: "Term 3 2025–26", rate: "88.0%", absences: 6 }
      ]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Attended half a day", classPeriod: "AM only", note: "Medical appointment" },
      { date: "15 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "14 Jul 2026", status: "Absent", classPeriod: "Full day" }
    ],
    goals: [
      {
        id: "g-4",
        title: "Complete weekly reading log",
        category: "Lifelong learner",
        status: "On track",
        target: "20 Aug 2026",
        lastUpdated: "2026-07-14T11:00:00-04:00",
        checkpointsMet: 3,
        checkpointsTotal: 4
      }
    ],
    skills: [
      {
        group: "Lifelong Learner",
        subSkills: [
          { label: "Curiosity", level: "High" },
          { label: "Initiative", level: "Middle" }
        ]
      },
      {
        group: "Engaged Community Member",
        subSkills: [
          { label: "Respect", level: "High" },
          { label: "Empathy", level: "Middle" }
        ]
      }
    ],
    developmentAreas: [
      { area: "Strengths", skills: ["Collaboration", "Curiosity"] },
      { area: "Room To Grow", skills: ["Written Explanation"] }
    ],
    classes: [
      { className: "Algebra I · Section A", teacher: "K. Blekeski", period: "Period 2", room: "RM-204" },
      { className: "Biology · Section B", teacher: "P. Nair", period: "Period 3", room: "RM-302" },
      { className: "English Language Arts · Section B", teacher: "A. Chen", period: "Period 6", room: "RM-118" }
    ],
    alerts: [
      { id: "a-5", rule: "Two or more missing assignments (ELA)", raised: "2026-07-16T06:00:00-04:00", status: "Acknowledged", raisedBy: "A. Chen" }
    ],
  },
  {
    id: "rk-sharma",
    kind: "student",
    name: "R.K. Sharma",
    school: "James Madison Intermediate",
    group: "Grade 8",
    status: "At Risk",
    active: false,
    lastLogin: "2026-06-02T09:15:00-04:00",
    personal: [
      { label: "Preferred name", value: "Ravi" },
      { label: "Date of birth", value: "18 Jan 2012" },
      { label: "Guardian", value: "M. Sharma" },
      { label: "Guardian contact", value: "m.sharma@example.org" },
      { label: "Home language", value: "Hindi" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 8 — General" },
      { label: "Enrolled since", value: "05 Sep 2023" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Counselor", value: "P. Nair" },
      { label: "Current GPA", value: "2.8" },
      { label: "Credits earned", value: "n/a — middle school" }
    ],
    grades: [
      { subject: "Mathematics", teacher: "P. Nair", grade: "C+", percent: 78, assignmentsComplete: 12, assignmentsSet: 18 },
      { subject: "Science", teacher: "P. Nair", grade: "C", percent: 73, assignmentsComplete: 11, assignmentsSet: 17 },
      { subject: "English Language Arts", teacher: "A. Chen", grade: "B-", percent: 81, assignmentsComplete: 16, assignmentsSet: 18 }
    ],
    gradeHistory: [
      {
        term: "Term 3 2025–26",
        gpa: "3.0",
        subjects: [
          { subject: "Mathematics", grade: "B-" },
          { subject: "Science", grade: "B-" },
          { subject: "English Language Arts", grade: "B" }
        ]
      }
    ],
    attendanceSummary: {
      present: 2,
      absent: 2,
      halfDay: 0,
      rate: "50.0%",
      byTerm: [
        { term: "Term 4 2025–26", rate: "50.0%", absences: 2 },
        { term: "Term 3 2025–26", rate: "94.0%", absences: 3 }
      ]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Absent", classPeriod: "Full day" },
      { date: "15 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "14 Jul 2026", status: "Absent", classPeriod: "Full day" }
    ],
    goals: [
      {
        id: "g-5",
        title: "Submit all science lab reports on time",
        category: "Academic achievement",
        status: "At risk",
        target: "05 Aug 2026",
        lastUpdated: "2026-07-01T08:40:00-04:00",
        checkpointsMet: 1,
        checkpointsTotal: 3
      }
    ],
    skills: [
      {
        group: "Critical Thinking",
        subSkills: [
          { label: "Reasoning", level: "Middle" },
          { label: "Analysis", level: "Elementary" }
        ]
      }
    ],
    developmentAreas: [
      { area: "Strengths", skills: ["Mathematical Reasoning"] },
      { area: "Room To Grow", skills: ["Meeting Deadlines"] }
    ],
    classes: [
      { className: "Mathematics · Grade 8", teacher: "P. Nair", period: "Period 1", room: "RM-302" },
      { className: "Science · Grade 8", teacher: "P. Nair", period: "Period 3", room: "RM-305" }
    ],
    alerts: [
      { id: "a-6", rule: "Goal checkpoint missed", raised: "2026-07-15T06:00:00-04:00", status: "Open", raisedBy: "System" }
    ],
  },
  {
    id: "mohd-anas-gupta",
    kind: "student",
    name: "Mohd.Anas Gupta",
    school: "Edison High School",
    group: "Grade 10",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-17T07:50:00-04:00",
    personal: [
      { label: "Preferred name", value: "Anas" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "Hindi" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 10 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Current GPA", value: "3.4" }
    ],
    grades: [
      { subject: "Algebra II", teacher: "K. Blekeski", grade: "B+", percent: 88, assignmentsComplete: 21, assignmentsSet: 22 }
    ],
    gradeHistory: [{ term: "Term 3 2025–26", gpa: "3.3", subjects: [{ subject: "Algebra II", grade: "B" }] }],
    attendanceSummary: {
      present: 1,
      absent: 1,
      halfDay: 0,
      rate: "50.0%",
      byTerm: [{ term: "Term 4 2025–26", rate: "50.0%", absences: 1 }]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Absent", classPeriod: "Full day" }
    ],
    goals: [],
    skills: [],
    developmentAreas: [],
    classes: [{ className: "Algebra II · Section C", teacher: "K. Blekeski", period: "Period 1", room: "RM-204" }],
    alerts: [],
  },
  {
    id: "naphisabet-lyngkhoi",
    kind: "student",
    name: "Naphisabet Lyngkhoi",
    school: "Edison High School",
    group: "Grade 9",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-15T13:22:00-04:00",
    personal: [
      { label: "Preferred name", value: "Naphi" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "Khasi" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 9 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Current GPA", value: "3.6" }
    ],
    grades: [
      { subject: "Algebra I", teacher: "K. Blekeski", grade: "A-", percent: 92, assignmentsComplete: 22, assignmentsSet: 22 }
    ],
    gradeHistory: [{ term: "Term 3 2025–26", gpa: "3.5", subjects: [{ subject: "Algebra I", grade: "A-" }] }],
    attendanceSummary: {
      present: 1,
      absent: 0,
      halfDay: 0,
      rate: "100.0%",
      byTerm: [{ term: "Term 4 2025–26", rate: "100.0%", absences: 0 }]
    },
    attendance: [{ date: "17 Jul 2026", status: "Present", classPeriod: "Full day" }],
    goals: [],
    skills: [],
    developmentAreas: [],
    classes: [{ className: "Algebra I · Section A", teacher: "K. Blekeski", period: "Period 2", room: "RM-204" }],
    alerts: [],
  },
  {
    id: "oliver-james",
    kind: "student",
    name: "Oliver James",
    school: "James Madison Intermediate",
    group: "Grade 8",
    status: "On Track",
    active: false,
    lastLogin: "2026-05-20T10:05:00-04:00",
    personal: [
      { label: "Preferred name", value: "Oliver" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 8 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Current GPA", value: "3.1" }
    ],
    grades: [
      { subject: "Mathematics", teacher: "P. Nair", grade: "B", percent: 84, assignmentsComplete: 16, assignmentsSet: 18 }
    ],
    gradeHistory: [{ term: "Term 3 2025–26", gpa: "3.0", subjects: [{ subject: "Mathematics", grade: "B-" }] }],
    attendanceSummary: {
      present: 1,
      absent: 1,
      halfDay: 0,
      rate: "50.0%",
      byTerm: [{ term: "Term 4 2025–26", rate: "50.0%", absences: 1 }]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Absent", classPeriod: "Full day" }
    ],
    goals: [],
    skills: [],
    developmentAreas: [],
    classes: [{ className: "Mathematics · Grade 8", teacher: "P. Nair", period: "Period 1", room: "RM-302" }],
    alerts: [],
  },
  {
    id: "robert-daniel",
    kind: "student",
    name: "Robert Daniel",
    school: "Edison High School",
    group: "Grade 10",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-17T06:45:00-04:00",
    personal: [
      { label: "Preferred name", value: "Rob" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 10 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" },
      { label: "Current GPA", value: "3.5" }
    ],
    grades: [
      { subject: "Computer Science", teacher: "D. Osei", grade: "A-", percent: 91, assignmentsComplete: 18, assignmentsSet: 18 },
      { subject: "Algebra II", teacher: "K. Blekeski", grade: "B+", percent: 87, assignmentsComplete: 20, assignmentsSet: 22 }
    ],
    gradeHistory: [
      {
        term: "Term 3 2025–26",
        gpa: "3.4",
        subjects: [
          { subject: "Computer Science", grade: "B+" },
          { subject: "Algebra II", grade: "B" }
        ]
      }
    ],
    attendanceSummary: {
      present: 6,
      absent: 0,
      halfDay: 0,
      rate: "100.0%",
      byTerm: [
        { term: "Term 4 2025–26", rate: "100.0%", absences: 0 },
        { term: "Term 3 2025–26", rate: "97.0%", absences: 2 }
      ]
    },
    attendance: [
      { date: "17 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "16 Jul 2026", status: "Present", classPeriod: "Full day" },
      { date: "15 Jul 2026", status: "Present", classPeriod: "Full day" }
    ],
    goals: [
      {
        id: "g-6",
        title: "Build a portfolio project in Computer Science",
        category: "Post-secondary readiness",
        status: "On track",
        target: "30 Aug 2026",
        lastUpdated: "2026-07-12T09:15:00-04:00",
        checkpointsMet: 2,
        checkpointsTotal: 3
      }
    ],
    skills: [
      {
        group: "Critical Thinking",
        subSkills: [
          { label: "Innovation", level: "High" },
          { label: "Analysis", level: "High" }
        ]
      }
    ],
    developmentAreas: [
      { area: "Strengths", skills: ["Problem Solver", "Detail-Oriented"] },
      { area: "Future Goals", skills: ["STEM Career"] }
    ],
    classes: [
      { className: "Computer Science · Section A", teacher: "D. Osei", period: "Period 7", room: "RM-115" },
      { className: "Algebra II · Section C", teacher: "K. Blekeski", period: "Period 1", room: "RM-204" }
    ],
    alerts: [],
  },

  // ---------------------------------------------------------------- faculty
  {
    id: "k-blekeski",
    kind: "faculty",
    name: "K. Blekeski",
    school: "Edison High School",
    group: "Mathematics",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-17T07:30:00-04:00",
    personal: [
      { label: "Staff ID", value: "123456789" },
      { label: "Email", value: "kblekeski@edison.example.org" },
      { label: "Room", value: "RM-204" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "Mathematics" },
      { label: "Classes assigned", value: "7" },
      { label: "Total roster", value: "308 students" },
      { label: "Joined", value: "18 Aug 2019" },
      { label: "Subjects taught", value: "Algebra I, Algebra II, Calculus" }
    ],
    teachingClasses: [
      { className: "Algebra II · Section C", roster: 28, avgAttendance: "89.2%", assignmentCompletion: "87.2%", openAlerts: 2 },
      { className: "Algebra I · Section A", roster: 29, avgAttendance: "96.1%", assignmentCompletion: "83.1%", openAlerts: 1 },
      { className: "Calculus · Section A", roster: 22, avgAttendance: "94.8%", assignmentCompletion: "91.0%", openAlerts: 0 },
      { className: "Algebra I · Section B", roster: 26, avgAttendance: "92.4%", assignmentCompletion: "85.5%", openAlerts: 0 }
    ],
    schedule: [
      { className: "Algebra II · Section C", teacher: "—", period: "Period 1", room: "RM-204" },
      { className: "Algebra I · Section A", teacher: "—", period: "Period 2", room: "RM-204" },
      { className: "Calculus · Section A", teacher: "—", period: "Period 4", room: "RM-204" },
      { className: "Algebra I · Section B", teacher: "—", period: "Period 6", room: "RM-206" }
    ],
    attendanceCompliance: [
      { date: "17 Jul 2026", submitted: 3, expected: 4, missing: ["Algebra I · Section B"] },
      { date: "16 Jul 2026", submitted: 4, expected: 4, missing: [] },
      { date: "15 Jul 2026", submitted: 4, expected: 4, missing: [] },
      { date: "14 Jul 2026", submitted: 2, expected: 4, missing: ["Calculus · Section A", "Algebra I · Section B"] }
    ],
    alerts: [
      { id: "fa-1", rule: "Attendance below 80% — Michael Andrew (Algebra II · Section C)", raised: "2026-07-15T06:00:00-04:00", status: "Open", raisedBy: "System", overdue: true },
      { id: "fa-2", rule: "Grade drop of one letter — Michael Andrew", raised: "2026-06-05T06:00:00-04:00", status: "Acknowledged", raisedBy: "K. Blekeski" }
    ],
  },
  {
    id: "a-chen",
    kind: "faculty",
    name: "A. Chen",
    school: "Edison Middle School",
    group: "English Language Arts",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-16T16:10:00-04:00",
    personal: [
      { label: "Staff ID", value: "123456912" },
      { label: "Email", value: "achen@edison.example.org" },
      { label: "Room", value: "RM-118" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "English Language Arts" },
      { label: "Classes assigned", value: "3" },
      { label: "Total roster", value: "365 students" },
      { label: "Joined", value: "12 Jan 2021" },
      { label: "Subjects taught", value: "English Language Arts, Art History" }
    ],
    teachingClasses: [
      { className: "English Language Arts · Section A", roster: 30, avgAttendance: "96.1%", assignmentCompletion: "87.7%", openAlerts: 1 },
      { className: "English Language Arts · Section B", roster: 27, avgAttendance: "93.0%", assignmentCompletion: "82.4%", openAlerts: 1 },
      { className: "Art History · Section A", roster: 12, avgAttendance: "95.5%", assignmentCompletion: "90.1%", openAlerts: 0 }
    ],
    schedule: [
      { className: "English Language Arts · Section A", teacher: "—", period: "Period 4", room: "RM-118" },
      { className: "English Language Arts · Section B", teacher: "—", period: "Period 6", room: "RM-118" },
      { className: "Art History · Section A", teacher: "—", period: "Period 2", room: "RM-120" }
    ],
    attendanceCompliance: [
      { date: "17 Jul 2026", submitted: 3, expected: 3, missing: [] },
      { date: "16 Jul 2026", submitted: 3, expected: 3, missing: [] },
      { date: "15 Jul 2026", submitted: 3, expected: 3, missing: [] }
    ],
    alerts: [
      { id: "fa-3", rule: "Two or more missing assignments — Nick Johnson (ELA)", raised: "2026-07-16T06:00:00-04:00", status: "Acknowledged", raisedBy: "A. Chen" }
    ],
  },
  {
    id: "p-nair",
    kind: "faculty",
    name: "P. Nair",
    school: "Lincoln Elementary",
    group: "Science",
    status: "On Track",
    active: true,
    lastLogin: "2026-07-17T11:58:00-04:00",
    personal: [
      { label: "Staff ID", value: "123457001" },
      { label: "Email", value: "pnair@edison.example.org" },
      { label: "Room", value: "RM-302" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "Science" },
      { label: "Classes assigned", value: "5" },
      { label: "Total roster", value: "422 students" },
      { label: "Joined", value: "09 Sep 2018" },
      { label: "Subjects taught", value: "Biology, Science, Mathematics" }
    ],
    teachingClasses: [
      { className: "Biology · Section B", roster: 22, avgAttendance: "88.4%", assignmentCompletion: "90.6%", openAlerts: 2 },
      { className: "Biology 2 · Class 4", roster: 42, avgAttendance: "76.0%", assignmentCompletion: "78.5%", openAlerts: 4 },
      { className: "Science · Grade 8", roster: 24, avgAttendance: "91.2%", assignmentCompletion: "84.0%", openAlerts: 1 },
      { className: "Mathematics · Grade 8", roster: 26, avgAttendance: "93.5%", assignmentCompletion: "86.7%", openAlerts: 0 }
    ],
    schedule: [
      { className: "Mathematics · Grade 8", teacher: "—", period: "Period 1", room: "RM-302" },
      { className: "Biology · Section B", teacher: "—", period: "Period 2", room: "RM-302" },
      { className: "Science · Grade 8", teacher: "—", period: "Period 3", room: "RM-305" },
      { className: "Biology 2 · Class 4", teacher: "—", period: "Period 5", room: "RM-305" }
    ],
    attendanceCompliance: [
      { date: "17 Jul 2026", submitted: 4, expected: 4, missing: [] },
      { date: "16 Jul 2026", submitted: 3, expected: 4, missing: ["Biology 2 · Class 4"] },
      { date: "15 Jul 2026", submitted: 4, expected: 4, missing: [] }
    ],
    alerts: [
      { id: "fa-4", rule: "Attendance below 80% — Biology 2 · Class 4", raised: "2026-07-15T06:00:00-04:00", status: "Open", raisedBy: "System", overdue: true },
      { id: "fa-5", rule: "Goal checkpoint missed — R.K. Sharma", raised: "2026-07-15T06:00:00-04:00", status: "Open", raisedBy: "System" }
    ],
  },
  {
    id: "d-osei",
    kind: "faculty",
    name: "D. Osei",
    school: "Franklin Elementary",
    group: "Computer Science",
    status: "Other",
    active: false,
    lastLogin: "2026-04-18T09:00:00-04:00",
    personal: [
      { label: "Staff ID", value: "123457044" },
      { label: "Email", value: "dosei@edison.example.org" },
      { label: "Room", value: "RM-115" },
      { label: "Employment type", value: "Full time — on leave" }
    ],
    academic: [
      { label: "Department", value: "Computer Science" },
      { label: "Classes assigned", value: "4" },
      { label: "Total roster", value: "479 students" },
      { label: "Joined", value: "14 Aug 2020" },
      { label: "Subjects taught", value: "Computer Science, Data Science" }
    ],
    teachingClasses: [
      { className: "Computer Science · Section A", roster: 28, avgAttendance: "89.7%", assignmentCompletion: "78.5%", openAlerts: 0 },
      { className: "Data Science · Class 7", roster: 32, avgAttendance: "90.4%", assignmentCompletion: "81.2%", openAlerts: 1 }
    ],
    schedule: [
      { className: "Computer Science · Section A", teacher: "—", period: "Period 7", room: "RM-115" },
      { className: "Data Science · Class 7", teacher: "—", period: "Period 8", room: "RM-115" }
    ],
    attendanceCompliance: [
      { date: "17 Jul 2026", submitted: 0, expected: 2, missing: ["Computer Science · Section A", "Data Science · Class 7"] },
      { date: "16 Jul 2026", submitted: 0, expected: 2, missing: ["Computer Science · Section A", "Data Science · Class 7"] }
    ],
    alerts: [],
  }
];

export function findPerson(kind: PersonKind, id: string): Person | undefined {
  return people.find((person) => person.kind === kind && person.id === id);
}

export function peopleOfKind(kind: PersonKind): Person[] {
  return people.filter((person) => person.kind === kind);
}
