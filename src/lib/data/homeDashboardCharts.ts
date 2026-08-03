/**
 * Fresh data for the Home screen's three rebuilt shadcn/Recharts cards
 * (Teacher-Student Ratio, Student Count By School, Students' Status).
 *
 * Deliberately separate from `dashboard.ts`'s teacherStudentRatio /
 * studentCountBySchool / studentsStatus — Reporting & Analytics still reads
 * those through the legacy StackRow/DonutSlice/FunnelStage shapes in
 * `sf/charts.tsx`, so this file owns its own shape instead of reworking a
 * type both screens depend on.
 *
 * TODO: same as the rest of dashboard.ts — display data, not a live
 * Salesforce/Genesis pull yet (brief open item 5).
 */

export type SchoolRatio = {
  school: string;
  teachers: number;
  students: number;
};

export const TEACHER_STUDENT_RATIO_ASOF = "2026-07-17T12:12:00-04:00";

/**
 * District target: at most this many students per teacher. The ratio chart draws
 * its threshold line and picks its bar colours from this one value, so moving
 * the district's target is a single edit here rather than a number buried in a
 * component.
 *
 * TODO: unconfirmed. Invented so the threshold line has something to sit at —
 * confirm the real district target before anyone reads a school's colour as
 * pass/fail. Belongs in System Settings once that screen owns district config.
 */
export const TEACHER_STUDENT_RATIO_TARGET = 20;

/** Every row's teachers/students sum to totalFaculty (82) / numberOfStudents
    (1702) in dashboard.ts, so this reads as one district picture, not a
    disconnected number. */
export const teacherStudentRatioBySchool: SchoolRatio[] = [
  { school: "Edison High School", teachers: 24, students: 452 },
  { school: "Edison Middle School", teachers: 17, students: 336 },
  { school: "James Madison Intermediate", teachers: 15, students: 310 },
  { school: "Lincoln Elementary", teachers: 14, students: 296 },
  { school: "Franklin Elementary", teachers: 12, students: 296 }
];

export type DistributionSlice = { label: string; value: number };

export const STUDENT_COUNT_BY_SCHOOL_ASOF = "2026-07-17T12:12:00-04:00";

/** Segments sum to numberOfStudents (1702). "Unassigned" is a real, small
    residual — Genesis records mid-transfer without a confirmed school yet —
    not a rounding bucket dressed up as a category. */
export const studentCountBySchoolDistribution: DistributionSlice[] = [
  { label: "Edison High School", value: 452 },
  { label: "Edison Middle School", value: 336 },
  { label: "James Madison Intermediate", value: 310 },
  { label: "Lincoln Elementary", value: 296 },
  { label: "Franklin Elementary", value: 296 },
  { label: "Unassigned", value: 12 }
];

export const STUDENTS_STATUS_ASOF = "2026-07-17T12:12:00-04:00";

/** Segments sum to numberOfStudents (1702). "Unassigned" = no status
    determination yet, not a fourth outcome bucket. */
export const studentsStatusDistribution: DistributionSlice[] = [
  { label: "On Track", value: 1201 },
  { label: "At Risk", value: 460 },
  { label: "Unassigned", value: 41 }
];
