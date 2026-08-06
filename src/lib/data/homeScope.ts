/**
 * Re-scopes Home's cards to a school and grade.
 *
 * The per-school figures in homeDashboardCharts.ts stay the source of truth —
 * they already sum to the district totals in dashboard.ts — so narrowing to a
 * school reads a real row rather than inventing one. Only the grade split is
 * derived, because no per-grade enrollment exists in the mocked data yet.
 *
 * TODO: replace the grade split with real Genesis per-grade enrollment. Until
 * then a grade's student and teacher counts are apportioned, not measured.
 */

import { gradeLabel, schools } from "./schools";
import { numberOfStudents, totalFaculty } from "./dashboard";
import {
  studentCountBySchoolDistribution,
  teacherStudentRatioBySchool,
  type DistributionSlice,
  type SchoolRatio
} from "./homeDashboardCharts";

export type HomeScope = { school: string | null; grade: string | null };

export const DISTRICT_SCOPE: HomeScope = { school: null, grade: null };

function schoolById(schoolId: string | null) {
  return schoolId ? schools.find((entry) => entry.id === schoolId) ?? null : null;
}

/**
 * Scope comes from the URL, so it can name a school that no longer exists or a
 * grade that school does not run — a shared link, or a bookmark from before the
 * roster changed. Each is widened to the nearest valid level rather than
 * rendering empty cards that read as a data outage.
 */
function normalize(scope: HomeScope): HomeScope {
  const school = schoolById(scope.school);
  if (!school) return DISTRICT_SCOPE;
  return {
    school: school.id,
    grade: scope.grade && school.grades.includes(scope.grade) ? scope.grade : null
  };
}

function ratioRowFor(schoolName: string): SchoolRatio | null {
  return teacherStudentRatioBySchool.find((row) => row.school === schoolName) ?? null;
}

/**
 * Apportions a school total across its grades. Weights are fixed rather than
 * random so a grade shows the same figure on every render and every reload,
 * and the parts always add back up to the school total — a grade breakdown
 * that did not sum to its own school would be worse than no breakdown.
 */
const GRADE_WEIGHTS = [1.06, 0.97, 1.02, 0.95, 1.04, 0.99, 1.01];

function splitAcrossGrades(total: number, grades: string[]): Record<string, number> {
  if (grades.length === 0) return {};

  const weights = grades.map((_, index) => GRADE_WEIGHTS[index % GRADE_WEIGHTS.length]);
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const exact = weights.map((weight) => (total * weight) / weightSum);
  const parts = exact.map(Math.floor);

  // Hand the rounding remainder to the largest fractional parts, so the split
  // is exact instead of drifting a few students away from the school total.
  const remainder = total - parts.reduce((sum, part) => sum + part, 0);
  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let step = 0; step < remainder; step += 1) {
    parts[byFraction[step % byFraction.length].index] += 1;
  }

  return Object.fromEntries(grades.map((grade, index) => [grade, parts[index]]));
}

/** Students in scope. District includes the unassigned residual; a school does not. */
export function scopedStudentCount(rawScope: HomeScope): number {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return numberOfStudents;

  const row = ratioRowFor(school.name);
  if (!row) return 0;
  if (!scope.grade) return row.students;

  return splitAcrossGrades(row.students, school.grades)[scope.grade] ?? 0;
}

export function scopedFacultyCount(rawScope: HomeScope): number {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return totalFaculty;

  const row = ratioRowFor(school.name);
  if (!row) return 0;
  if (!scope.grade) return row.teachers;

  return splitAcrossGrades(row.teachers, school.grades)[scope.grade] ?? 0;
}

/**
 * The ratio chart always shows the level *below* the current scope: schools
 * across the district, grades within a school, and the single grade once one
 * is picked. Anything else would show rows the filter has excluded.
 */
export function scopedRatioRows(rawScope: HomeScope): SchoolRatio[] {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return teacherStudentRatioBySchool;

  const row = ratioRowFor(school.name);
  if (!row) return [];

  const students = splitAcrossGrades(row.students, school.grades);
  const teachers = splitAcrossGrades(row.teachers, school.grades);
  const grades = scope.grade ? [scope.grade] : school.grades;

  return grades
    .filter((grade) => school.grades.includes(grade))
    .map((grade) => ({
      school: gradeLabel(grade),
      teachers: teachers[grade] ?? 0,
      students: students[grade] ?? 0
    }));
}

/** Same drill-down rule as the ratio chart, so the two cards never disagree. */
export function scopedDistribution(rawScope: HomeScope): DistributionSlice[] {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return studentCountBySchoolDistribution;

  const row = ratioRowFor(school.name);
  if (!row) return [];

  const students = splitAcrossGrades(row.students, school.grades);
  const grades = scope.grade ? [scope.grade] : school.grades;

  return grades
    .filter((grade) => school.grades.includes(grade))
    .map((grade) => ({ label: gradeLabel(grade), value: students[grade] ?? 0 }));
}

/**
 * The distribution card's title names whatever its slices are, which is one
 * level below the scope: schools district-wide, grades once a school is picked.
 */
export function distributionTitle(rawScope: HomeScope): string {
  return normalize(rawScope).school ? "Student Count By Grade" : "Student Count By School";
}

/** "Edison High School · Grade 10", or null at district level. */
export function scopeLabel(rawScope: HomeScope): string | null {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return null;
  return scope.grade ? `${school.name} · ${gradeLabel(scope.grade)}` : school.name;
}
