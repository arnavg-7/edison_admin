/**
 * Re-scopes Home's cards to a school and any number of its grades.
 *
 * The per-school figures in homeDashboardCharts.ts stay the source of truth —
 * they already sum to the district totals in dashboard.ts — so narrowing to a
 * school reads a real row rather than inventing one. Only the grade split is
 * derived (see gradeSplit.ts), because no per-grade enrollment exists in the
 * mocked data yet.
 */

import { gradeLabel, schools } from "./schools";
import { numberOfStudents, totalFaculty } from "./dashboard";
import { splitAcrossGrades } from "./gradeSplit";
import {
  studentCountBySchoolDistribution,
  teacherStudentRatioBySchool,
  type DistributionSlice,
  type SchoolRatio
} from "./homeDashboardCharts";

/** Empty `grades` means every grade the school runs, i.e. no extra narrowing. */
export type HomeScope = { school: string | null; grades: string[] };

export const DISTRICT_SCOPE: HomeScope = { school: null, grades: [] };

function schoolById(schoolId: string | null) {
  return schoolId ? schools.find((entry) => entry.id === schoolId) ?? null : null;
}

/**
 * Scope comes from the URL, so it can name a school that no longer exists or
 * grades that school does not run — a shared link, or a bookmark from before the
 * roster changed. Each is widened to the nearest valid level rather than
 * rendering empty cards that read as a data outage.
 */
function normalize(scope: HomeScope): HomeScope {
  const school = schoolById(scope.school);
  if (!school) return DISTRICT_SCOPE;

  // Ordered by the school's own grade list, not by how they arrived, so the
  // ratio rows and donut slices always run youngest to oldest.
  return {
    school: school.id,
    grades: school.grades.filter((grade) => scope.grades.includes(grade))
  };
}

function ratioRowFor(schoolName: string): SchoolRatio | null {
  return teacherStudentRatioBySchool.find((row) => row.school === schoolName) ?? null;
}

/**
 * The grades a card should actually break down: the picked ones, or the whole
 * school when nothing is picked.
 */
function gradesInScope(scope: HomeScope, schoolGrades: string[]): string[] {
  return scope.grades.length > 0 ? scope.grades : schoolGrades;
}

function sumOverGrades(split: Record<string, number>, grades: string[]): number {
  return grades.reduce((sum, grade) => sum + (split[grade] ?? 0), 0);
}

/** Students in scope. District includes the unassigned residual; a school does not. */
export function scopedStudentCount(rawScope: HomeScope): number {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return numberOfStudents;

  const row = ratioRowFor(school.name);
  if (!row) return 0;
  if (scope.grades.length === 0) return row.students;

  return sumOverGrades(splitAcrossGrades(row.students, school.grades), scope.grades);
}

export function scopedFacultyCount(rawScope: HomeScope): number {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return totalFaculty;

  const row = ratioRowFor(school.name);
  if (!row) return 0;
  if (scope.grades.length === 0) return row.teachers;

  return sumOverGrades(splitAcrossGrades(row.teachers, school.grades), scope.grades);
}

/**
 * The ratio chart always shows the level *below* the current scope: schools
 * across the district, then one row per grade in scope. Anything else would show
 * rows the filter has excluded.
 */
export function scopedRatioRows(rawScope: HomeScope): SchoolRatio[] {
  const scope = normalize(rawScope);
  const school = schoolById(scope.school);
  if (!school) return teacherStudentRatioBySchool;

  const row = ratioRowFor(school.name);
  if (!row) return [];

  const students = splitAcrossGrades(row.students, school.grades);
  const teachers = splitAcrossGrades(row.teachers, school.grades);

  return gradesInScope(scope, school.grades).map((grade) => ({
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

  return gradesInScope(scope, school.grades).map((grade) => ({
    label: gradeLabel(grade),
    value: students[grade] ?? 0
  }));
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
  if (scope.grades.length === 0) return school.name;

  // Two grades still read at a glance; past that the count says more than a
  // list that would wrap or be truncated.
  const grades =
    scope.grades.length <= 2
      ? scope.grades.map(gradeLabel).join(" & ")
      : `${scope.grades.length} grades`;
  return `${school.name} · ${grades}`;
}
