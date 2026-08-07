/**
 * Data for the shadcn/Recharts Teacher-Student Ratio and Student Count By
 * School cards. Both Home (HomeMetrics.tsx) and the Reporting & Analytics
 * catalog (app/reporting/page.tsx) render the same figures from here now —
 * Reporting used to keep its own legacy StackRow/DonutSlice versions in
 * dashboard.ts, which read as the same two report titles with different,
 * uncorrelated numbers; that duplication has been retired in favor of this
 * one shared source.
 *
 * TODO: same as the rest of dashboard.ts — display data, not a live
 * Salesforce/Genesis pull yet (brief open item 5).
 */

import type { BarGroup, SeriesKey } from "@/components/sf/charts";
import { schools, type SchoolLevel } from "./schools";

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

/*
 * A `studentsStatusDistribution` (On Track 1201 / At Risk 460 / Unassigned 41)
 * lived here for Home's Students' Status donut. That card was removed from Home
 * — see the note in components/home/HomeMetrics.tsx — so these exports went with
 * it rather than lingering as dead data.
 *
 * The figures themselves are not lost: Reporting & Analytics renders the same
 * breakdown from `studentsStatus` in dashboard.ts, which is where the full
 * report catalog belongs.
 */

/** Same per-school figures as the donut above, reshaped into one bar per
    school for the Enrollment section's "Students by school" chart. */
export const studentsBySchoolBars: BarGroup[] = studentCountBySchoolDistribution.map((slice) => ({
  label: slice.label,
  rows: [{ label: "Students", value: slice.value, colorIndex: 0 }]
}));

const GRADE_BAND_LABEL: Record<SchoolLevel, string> = {
  ES: "Elementary (Grades 1–5)",
  MS: "Middle (Grades 6–8)",
  HS: "High (Grades 9–12)"
};

/** District only tracks which grades each school serves, not per-grade
    enrollment — so "Students by grade" rolls up to the three grade bands
    schools.ts already defines, summing the same per-school counts above
    rather than inventing a single-grade breakdown the district doesn't have. */
export const studentsByGradeBandBars: BarGroup[] = (["ES", "MS", "HS"] as const).map((level) => {
  const schoolNames = new Set(
    schools.filter((school) => school.level === level).map((school) => school.name)
  );
  const value = studentCountBySchoolDistribution
    .filter((slice) => schoolNames.has(slice.label))
    .reduce((sum, slice) => sum + slice.value, 0);
  return { label: GRADE_BAND_LABEL[level], rows: [{ label: "Students", value, colorIndex: 1 }] };
});

/** Students and faculty per school, side by side — the same rows
    `teacherStudentRatioBySchool` already carries, reshaped for a grouped bar
    instead of a single derived ratio. */
export const staffingBySchoolBars: BarGroup[] = teacherStudentRatioBySchool.map((school) => ({
  label: school.school,
  rows: [
    { label: "Students", value: school.students, colorIndex: 0 },
    { label: "Faculty", value: school.teachers, colorIndex: 1 }
  ]
}));

export const STAFFING_SERIES: SeriesKey[] = [
  { label: "Students", colorIndex: 0 },
  { label: "Faculty", colorIndex: 1 }
];

/**
 * Illustrative — Genesis doesn't yet break the district's 92.4% attendance
 * rate down by school, so these five figures are invented, not derived from
 * real per-school attendance the way studentsBySchoolBars/staffingBySchoolBars
 * are. Kept close to the district average (rather than a wide invented
 * spread) and on the same five-school roster as every other Home chart, so
 * this reads as a placeholder for a real number, not as one.
 *
 * TODO: replace with real per-school attendance once Genesis reports it that way.
 */
export const attendanceRateBySchoolBars: BarGroup[] = [
  { school: "Edison High School", rate: 90.8 },
  { school: "Edison Middle School", rate: 92.1 },
  { school: "James Madison Intermediate", rate: 91.6 },
  { school: "Lincoln Elementary", rate: 94.3 },
  { school: "Franklin Elementary", rate: 93.7 }
].map(({ school, rate }) => ({
  label: school,
  rows: [{ label: "Attendance rate", value: rate, colorIndex: 0 }]
}));
