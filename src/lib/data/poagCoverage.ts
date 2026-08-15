/**
 * POAG oversight figures for one grade at one school: which classes have been
 * rated this marking period, by whom, and where the grade currently sits.
 *
 * TODO: replace with real reads. Coverage comes from poag_rating joined to the
 * OneRoster enrollments export (the `primary=true` teacher per class is the only
 * one who can rate — see the handoff spec §3). Both are derived here so the
 * screen has something truthful in shape to render against.
 *
 * Two figures are *not* invented. The grade's student count reuses the same
 * apportioning Home and School Setup read, and the class list is built from the
 * subjects actually mapped to this grade in System Settings — so an admin who
 * unmaps a subject sees it drop out of POAG coverage, which is the real
 * consequence and worth showing.
 */

import { schools } from "./schools";
import { splitAcrossGrades } from "./gradeSplit";
import { teacherStudentRatioBySchool } from "./homeDashboardCharts";
import { subjects, type Subject } from "./systemSettings";
import { type PoagPillar } from "./poag";

/** Youngest to oldest, so a subject's grade range can be compared. */
const GRADE_ORDER = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

function gradeIndex(grade: string): number {
  const normalized = grade.trim().toUpperCase();
  return GRADE_ORDER.indexOf(normalized === "KG" ? "K" : normalized);
}

/** Subjects taught in this grade. An unmapped subject teaches nobody, by definition. */
export function subjectsForGrade(grade: string): Subject[] {
  const index = gradeIndex(grade);
  if (index < 0) return [];

  return subjects.filter((subject) => {
    if (!subject.gradeStart || !subject.gradeEnd) return false;
    const start = gradeIndex(subject.gradeStart);
    const end = gradeIndex(subject.gradeEnd);
    return start >= 0 && end >= 0 && index >= start && index <= end;
  });
}

/** Subjects with no grade mapping at all — they have no POAG coverage anywhere. */
export function unmappedSubjects(): Subject[] {
  return subjects.filter((subject) => !subject.gradeStart || !subject.gradeEnd);
}

/** Students in this grade, matching Home's and School Setup's figure exactly. */
export function studentsInGrade(schoolId: string, grade: string): number {
  const school = schools.find((entry) => entry.id === schoolId);
  if (!school) return 0;

  const row = teacherStudentRatioBySchool.find((entry) => entry.school === school.name);
  if (!row) return 0;

  return splitAcrossGrades(row.students, school.grades)[grade] ?? 0;
}

/** Stable pseudo-variance, so a class shows the same figures on every render. */
function seed(...parts: string[]): number {
  const key = parts.join("|");
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000;
  }
  return hash;
}

// TODO: real teacher names come from users.csv. Assigned by hash so a class keeps
// the same principal teacher across renders.
const TEACHERS = [
  "Ms. A. Rivera",
  "Mr. D. Okafor",
  "Ms. L. Chen",
  "Mr. P. Kaur",
  "Ms. R. Bhatt",
  "Mr. T. Sullivan",
  "Ms. N. Haddad",
  "Mr. J. Whitmore"
];

const SECTION_LETTERS = ["A", "B", "C"];

export type PoagClassCoverage = {
  id: string;
  /** "Mathematics · Section A" */
  name: string;
  subjectId: string;
  subjectName: string;
  /** The one teacher who may rate — enrollments.primary = true. */
  principalTeacher: string | null;
  students: number;
  rated: number;
  /** ISO, or null when this class has not been rated this marking period. */
  lastRatedAt: string | null;
};

/**
 * One row per class section in this grade. Sections are split off the subject's
 * share of the grade so the class sizes add back up to the grade's roll.
 */
export function poagCoverageFor(schoolId: string, grade: string): PoagClassCoverage[] {
  const gradeSubjects = subjectsForGrade(grade);
  if (gradeSubjects.length === 0) return [];

  const roll = studentsInGrade(schoolId, grade);

  return gradeSubjects.flatMap((subject) => {
    // Every student takes every mapped subject; sections split the grade's roll.
    const sectionCount = roll > 90 ? 3 : roll > 45 ? 2 : 1;
    const base = Math.floor(roll / sectionCount);
    const remainder = roll - base * sectionCount;

    return Array.from({ length: sectionCount }, (_, index) => {
      const students = base + (index < remainder ? 1 : 0);
      const key = seed(schoolId, grade, subject.id, String(index));

      /* Roughly three classes in four are done for the period, and an unrated
         class is the actionable row — the whole reason an admin opens this. */
      const isRated = key % 4 !== 1;
      const partial = key % 7 === 0;
      const rated = isRated ? (partial ? Math.round(students * 0.6) : students) : 0;

      // Spread across the fortnight before the seeded "today" (2026-07-17).
      const day = 3 + (key % 12);
      const lastRatedAt = isRated
        ? `2026-07-${String(day).padStart(2, "0")}T09:${String(key % 60).padStart(2, "0")}:00-04:00`
        : null;

      return {
        id: `${schoolId}-${grade}-${subject.id}-${index}`,
        name: `${subject.name} · Section ${SECTION_LETTERS[index] ?? index + 1}`,
        subjectId: subject.id,
        subjectName: subject.name,
        // Verified in the export: every class has exactly one primary teacher.
        // Kept nullable so the §3.4 "no primary teacher" case renders read-only
        // with a data-quality warning rather than throwing.
        principalTeacher: TEACHERS[key % TEACHERS.length],
        students,
        rated,
        lastRatedAt
      };
    });
  });
}

export type PoagCoverageTotals = {
  classes: number;
  ratedClasses: number;
  students: number;
  ratedStudents: number;
  /** Classes with no primary=true teacher — nobody can rate them. */
  unassignedClasses: number;
};

export function poagCoverageTotals(rows: PoagClassCoverage[]): PoagCoverageTotals {
  return rows.reduce<PoagCoverageTotals>(
    (totals, row) => ({
      classes: totals.classes + 1,
      ratedClasses: totals.ratedClasses + (row.rated > 0 ? 1 : 0),
      students: totals.students + row.students,
      ratedStudents: totals.ratedStudents + row.rated,
      unassignedClasses: totals.unassignedClasses + (row.principalTeacher ? 0 : 1)
    }),
    { classes: 0, ratedClasses: 0, students: 0, ratedStudents: 0, unassignedClasses: 0 }
  );
}

/** Counts per level for one pillar, indexed by PoagLevel. */
export type PoagDistribution = {
  rubricKey: string;
  displayTitle: string;
  counts: number[];
  rated: number;
};

/**
 * The seeded shape of a marking period's ratings across Edison's four levels —
 * most students mid-scale, few at either end. Levels the district added sit
 * beyond it and stay empty; see below.
 */
const SEED_SHAPE = [2, 4, 3, 1];

/**
 * Where the grade sits on each pillar, **within one subject**.
 *
 * Single-subject on purpose. A rating is a judgement made by one teacher in one
 * class, and v1 defines no rule for combining a student's Critical Thinking in
 * Calculus with their Critical Thinking in Geology — so summing across subjects
 * would be inventing that rule, and would also count a three-subject student
 * three times. Restricted to one subject, every student appears once and the
 * number means something a teacher would recognise.
 */
export function poagDistributionFor(
  schoolId: string,
  grade: string,
  subjectId: string,
  /** The live pillar list — the district may have added to Edison's six. */
  pillars: PoagPillar[],
  /** The live scale length — the district may have added to Edison's four. */
  levelCount: number
): PoagDistribution[] {
  const rated = poagCoverageTotals(
    poagCoverageFor(schoolId, grade).filter((row) => row.subjectId === subjectId)
  ).ratedStudents;

  return pillars.map((pillar, pillarIndex) => {
    // Subject is part of the seed, not a nudge on top of it: two subjects that
    // happened to hash alike would otherwise show the identical shape and make
    // the selector look broken.
    const key = seed(schoolId, grade, subjectId, pillar.rubricKey);
    const weights = Array.from({ length: levelCount }, (_, level) => {
      const shape = SEED_SHAPE[level];
      /* A level the district added mid-year has nobody at it: a teacher cannot
         have filed a rating against a position that did not exist when they
         rated. It reads as an empty band — which is the true state of a new
         level — rather than being invented into the shape. */
      if (shape === undefined) return 0;
      return shape + ((key + pillarIndex * 7 + level * 13) % 3);
    });

    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const exact = weights.map((weight) => (rated * weight) / weightSum);
    const counts = exact.map(Math.floor);

    // Hand the remainder to the largest fractional parts, so the levels always
    // add back up to the students actually rated.
    const remainder = rated - counts.reduce((sum, count) => sum + count, 0);
    const byFraction = exact
      .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
      .sort((a, b) => b.fraction - a.fraction);
    for (let step = 0; step < remainder; step += 1) {
      counts[byFraction[step % byFraction.length].index] += 1;
    }

    return {
      rubricKey: pillar.rubricKey,
      displayTitle: pillar.displayTitle,
      counts,
      rated
    };
  });
}
