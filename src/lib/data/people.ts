/**
 * Student & Faculty 360 — individual-level profiles. v2 reverses v1's
 * class-level ceiling.
 *
 * TODO: every field is mocked. Personal details, enrollment, grades and
 * attendance are system-of-record fields owned by Salesforce/SIS, so they are
 * rendered read-only with a "View in Salesforce" link rather than an edit
 * control — editing them here would risk divergence from the source of truth.
 *
 * TODO — the exact editable-field list is an open item (brief §8 / open item 9).
 * Only internal notes and flags are editable here. Do not widen that without
 * confirmation.
 */

export type PersonKind = "student" | "faculty";

export type ReadOnlyField = { label: string; value: string };

export type GoalRecord = {
  id: string;
  title: string;
  category: string;
  status: "On track" | "At risk" | "Complete" | "Overdue";
  target: string;
  lastUpdated: string;
};

export type AlertRecord = {
  id: string;
  rule: string;
  raised: string;
  status: "Open" | "Acknowledged" | "Resolved";
  overdue?: boolean;
};

export type AttendanceRecord = {
  date: string;
  status: "Present" | "Absent" | "Attended half a day";
  note?: string;
};

export type WellbeingRecord = {
  date: string;
  feeling: "Pleasant" | "Neutral" | "Unpleasant";
  note?: string;
};

export type EventRecord = {
  id: string;
  name: string;
  date: string;
  role: string;
};

export type InternalNote = {
  id: string;
  body: string;
  author: string;
  at: string;
};

export type Person = {
  id: string;
  kind: PersonKind;
  name: string;
  /** Salesforce record id, for the "View in Salesforce" link. */
  salesforceId: string;
  school: string;
  /** Grade for students, department for faculty. */
  group: string;
  status: "On Track" | "At Risk" | "Other";
  personal: ReadOnlyField[];
  academic: ReadOnlyField[];
  goals: GoalRecord[];
  alerts: AlertRecord[];
  attendance: AttendanceRecord[];
  wellbeing: WellbeingRecord[];
  events: EventRecord[];
  notes: InternalNote[];
  flags: string[];
};

/** TODO: replace with the real Salesforce org instance URL. */
export const SALESFORCE_BASE_URL = "https://edison.my.salesforce.com";

export function salesforceRecordUrl(salesforceId: string): string {
  return `${SALESFORCE_BASE_URL}/lightning/r/Contact/${salesforceId}/view`;
}

export const people: Person[] = [
  {
    id: "michael-andrew",
    kind: "student",
    name: "Michael Andrew",
    salesforceId: "003AX000004ZmT1YAM",
    school: "Edison High School",
    group: "Grade 10",
    status: "At Risk",
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
      { label: "Counselor", value: "K. Blekeski" }
    ],
    goals: [
      {
        id: "g-1",
        title: "Raise algebra assessment average to 75%",
        category: "Academic achievement",
        status: "At risk",
        target: "12 Aug 2026",
        lastUpdated: "2026-07-02T10:20:00-04:00"
      },
      {
        id: "g-2",
        title: "Attend 90% of scheduled classes",
        category: "Attendance & engagement",
        status: "Overdue",
        target: "30 Jun 2026",
        lastUpdated: "2026-06-28T09:05:00-04:00"
      }
    ],
    alerts: [
      { id: "a-1", rule: "Attendance below 80%", raised: "2026-07-15T06:00:00-04:00", status: "Open", overdue: true },
      { id: "a-2", rule: "Goal overdue by 14 days", raised: "2026-07-14T06:00:00-04:00", status: "Open", overdue: true },
      { id: "a-3", rule: "Three or more missing assignments", raised: "2026-06-20T06:00:00-04:00", status: "Resolved" }
    ],
    attendance: [
      { date: "17 Jul 2026", status: "Absent" },
      { date: "16 Jul 2026", status: "Absent" },
      { date: "15 Jul 2026", status: "Present" },
      { date: "14 Jul 2026", status: "Absent" },
      { date: "11 Jul 2026", status: "Present" }
    ],
    wellbeing: [
      { date: "16 Jul 2026", feeling: "Unpleasant" },
      { date: "09 Jul 2026", feeling: "Unpleasant", note: "Logged after second period" },
      { date: "01 Jul 2026", feeling: "Neutral" }
    ],
    events: [
      { id: "e-1", name: "STEM Careers Evening", date: "12 Jun 2026", role: "Attendee" },
      { id: "e-2", name: "Grade 10 Orientation", date: "04 Sep 2025", role: "Attendee" }
    ],
    notes: [
      {
        id: "n-1",
        body: "Guardian contacted 15 Jul about the absence pattern. Follow-up call agreed for next week.",
        author: "Priya Nair",
        at: "2026-07-15T14:20:00-04:00"
      }
    ],
    flags: ["Chronic absence watch", "Guardian contact in progress"]
  },
  {
    id: "nick-johnson",
    kind: "student",
    name: "Nick Johnson",
    salesforceId: "003AX000004ZmT2YAM",
    school: "Edison High School",
    group: "Grade 9",
    status: "At Risk",
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
      { label: "Counselor", value: "A. Chen" }
    ],
    goals: [
      {
        id: "g-3",
        title: "Complete weekly reading log",
        category: "Lifelong learner",
        status: "On track",
        target: "20 Aug 2026",
        lastUpdated: "2026-07-14T11:00:00-04:00"
      }
    ],
    alerts: [
      { id: "a-4", rule: "Well-being trend — sustained Unpleasant", raised: "2026-07-16T14:05:00-04:00", status: "Acknowledged" }
    ],
    attendance: [
      { date: "17 Jul 2026", status: "Present" },
      { date: "16 Jul 2026", status: "Attended half a day" },
      { date: "15 Jul 2026", status: "Present" },
      { date: "14 Jul 2026", status: "Absent" }
    ],
    wellbeing: [
      { date: "16 Jul 2026", feeling: "Unpleasant" },
      { date: "14 Jul 2026", feeling: "Unpleasant" },
      { date: "07 Jul 2026", feeling: "Unpleasant" },
      { date: "30 Jun 2026", feeling: "Pleasant" }
    ],
    events: [{ id: "e-3", name: "Spring Showcase", date: "22 Apr 2026", role: "Participant" }],
    notes: [],
    flags: ["Well-being follow-up"]
  },
  {
    id: "rk-sharma",
    kind: "student",
    name: "R.K. Sharma",
    salesforceId: "003AX000004ZmT3YAM",
    school: "James Madison Intermediate",
    group: "Grade 8",
    status: "At Risk",
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
      { label: "Counselor", value: "P. Nair" }
    ],
    goals: [
      {
        id: "g-4",
        title: "Submit all science lab reports on time",
        category: "Academic achievement",
        status: "At risk",
        target: "05 Aug 2026",
        lastUpdated: "2026-07-01T08:40:00-04:00"
      }
    ],
    alerts: [],
    attendance: [
      { date: "17 Jul 2026", status: "Present" },
      { date: "16 Jul 2026", status: "Absent" },
      { date: "15 Jul 2026", status: "Present" },
      { date: "14 Jul 2026", status: "Absent" }
    ],
    wellbeing: [{ date: "10 Jul 2026", feeling: "Neutral" }],
    events: [],
    notes: [],
    flags: ["Missed goal checkpoints"]
  },
  {
    id: "mohd-anas-gupta",
    kind: "student",
    name: "Mohd.Anas Gupta",
    salesforceId: "003AX000004ZmT4YAM",
    school: "Edison High School",
    group: "Grade 10",
    status: "On Track",
    personal: [
      { label: "Preferred name", value: "Mohd.Anas" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 10 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" }
    ],
    goals: [],
    alerts: [],
    attendance: [
      { date: "17 Jul 2026", status: "Present" },
      { date: "30 Jun 2026", status: "Absent" }
    ],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  },
  {
    id: "naphisabet-lyngkhoi",
    kind: "student",
    name: "Naphisabet Lyngkhoi",
    salesforceId: "003AX000004ZmT5YAM",
    school: "Edison High School",
    group: "Grade 9",
    status: "On Track",
    personal: [
      { label: "Preferred name", value: "Naphisabet" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 9 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" }
    ],
    goals: [],
    alerts: [],
    attendance: [
      { date: "17 Jul 2026", status: "Present" }
    ],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  },
  {
    id: "oliver-james",
    kind: "student",
    name: "Oliver James",
    salesforceId: "003AX000004ZmT6YAM",
    school: "James Madison Intermediate",
    group: "Grade 8",
    status: "On Track",
    personal: [
      { label: "Preferred name", value: "Oliver" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 8 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" }
    ],
    goals: [],
    alerts: [],
    attendance: [
      { date: "17 Jul 2026", status: "Present" },
      { date: "30 Jun 2026", status: "Absent" }
    ],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  },
  {
    id: "robert-daniel",
    kind: "student",
    name: "Robert Daniel",
    salesforceId: "003AX000004ZmT7YAM",
    school: "Edison High School",
    group: "Grade 10",
    status: "On Track",
    personal: [
      { label: "Preferred name", value: "Robert" },
      { label: "Guardian contact", value: "guardian@example.org" },
      { label: "Home language", value: "English" }
    ],
    academic: [
      { label: "Primary academic program", value: "Grade 10 — General" },
      { label: "Homeroom", value: "Awaiting Genesis data" }
    ],
    goals: [],
    alerts: [],
    attendance: [
      { date: "17 Jul 2026", status: "Present" },
      { date: "16 Jul 2026", status: "Present" },
      { date: "15 Jul 2026", status: "Present" },
      { date: "14 Jul 2026", status: "Present" },
      { date: "13 Jul 2026", status: "Present" },
      { date: "12 Jul 2026", status: "Present" }
    ],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  },
  {
    id: "k-blekeski",
    kind: "faculty",
    name: "K. Blekeski",
    salesforceId: "003AX000004ZmF1YAM",
    school: "Edison High School",
    group: "Mathematics",
    status: "On Track",
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
      { label: "Joined", value: "18 Aug 2019" }
    ],
    goals: [],
    alerts: [
      { id: "a-5", rule: "Attendance below 80% (Calculus · Section A)", raised: "2026-07-15T06:00:00-04:00", status: "Open", overdue: true }
    ],
    attendance: [],
    wellbeing: [],
    events: [{ id: "e-4", name: "STEM Careers Evening", date: "12 Jun 2026", role: "Host" }],
    notes: [
      {
        id: "n-2",
        body: "Covering Algebra II Section C while D. Osei is on leave.",
        author: "Priya Nair",
        at: "2026-07-10T09:00:00-04:00"
      }
    ],
    flags: []
  },
  {
    id: "a-chen",
    kind: "faculty",
    name: "A. Chen",
    salesforceId: "003AX000004ZmF2YAM",
    school: "Edison Middle School",
    group: "Art History",
    status: "On Track",
    personal: [
      { label: "Staff ID", value: "123456912" },
      { label: "Email", value: "achen@edison.example.org" },
      { label: "Room", value: "RM-118" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "Art History" },
      { label: "Classes assigned", value: "3" },
      { label: "Total roster", value: "365 students" },
      { label: "Joined", value: "12 Jan 2021" }
    ],
    goals: [],
    alerts: [],
    attendance: [],
    wellbeing: [],
    events: [{ id: "e-5", name: "Spring Showcase", date: "22 Apr 2026", role: "Organizer" }],
    notes: [],
    flags: []
  },
  {
    id: "p-nair",
    kind: "faculty",
    name: "P. Nair",
    salesforceId: "003AX000004ZmF3YAM",
    school: "Lincoln Elementary",
    group: "Biology",
    status: "On Track",
    personal: [
      { label: "Staff ID", value: "123457001" },
      { label: "Email", value: "pnair@edison.example.org" },
      { label: "Room", value: "RM-302" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "Biology" },
      { label: "Classes assigned", value: "5" },
      { label: "Total roster", value: "422 students" },
      { label: "Joined", value: "09 Sep 2018" }
    ],
    goals: [],
    alerts: [
      { id: "a-6", rule: "Attendance below 80% (Biology 2 · Class 4)", raised: "2026-07-15T06:00:00-04:00", status: "Open", overdue: true }
    ],
    attendance: [],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  },
  {
    id: "d-osei",
    kind: "faculty",
    name: "D. Osei",
    salesforceId: "003AX000004ZmF4YAM",
    school: "Franklin Elementary",
    group: "Computer Science",
    status: "Other",
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
      { label: "Joined", value: "14 Aug 2020" }
    ],
    goals: [],
    alerts: [],
    attendance: [],
    wellbeing: [],
    events: [],
    notes: [
      {
        id: "n-3",
        body: "On leave until 18 Aug. K. Blekeski covering Algebra II Section C.",
        author: "Priya Nair",
        at: "2026-07-09T10:30:00-04:00"
      }
    ],
    flags: ["On leave"]
  },
  {
    id: "m-alvarez",
    kind: "faculty",
    name: "M. Alvarez",
    salesforceId: "003AX000004ZmF5YAM",
    school: "Edison Kindergarten Center",
    group: "Early Years",
    status: "On Track",
    personal: [
      { label: "Staff ID", value: "123457102" },
      { label: "Email", value: "malvarez@edison.example.org" },
      { label: "Room", value: "RM-004" },
      { label: "Employment type", value: "Full time" }
    ],
    academic: [
      { label: "Department", value: "Early Years" },
      { label: "Classes assigned", value: "2" },
      { label: "Total roster", value: "536 students" },
      { label: "Joined", value: "03 Feb 2022" }
    ],
    goals: [],
    alerts: [],
    attendance: [],
    wellbeing: [],
    events: [],
    notes: [],
    flags: []
  }
];

export function findPerson(kind: PersonKind, id: string): Person | undefined {
  return people.find((person) => person.kind === kind && person.id === id);
}

export function peopleOfKind(kind: PersonKind): Person[] {
  return people.filter((person) => person.kind === kind);
}
