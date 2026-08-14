// TODO: replace with the real Admin DB school-hierarchy contract. Schools and
// their grades are seeded from the Genesis-derived roster in schools.ts and the
// district enrollment in homeDashboardCharts.ts, so School Setup opens on the
// same district every other screen describes. Batches have no source system yet
// — they are the one level invented here.

import { gradeLabel, schools, type SchoolLevel } from "./schools";
import { splitAcrossGrades } from "./gradeSplit";
import { teacherStudentRatioBySchool } from "./homeDashboardCharts";

/** District → School → Grade → Batch. A batch is where students actually enrol. */
export type SetupNodeKind = "district" | "school" | "grade" | "batch";

export type SetupBatch = {
  id: string;
  name: string;
  /** Academic year the batch runs in, e.g. "2026–27". */
  year: string;
  capacity: number;
  enrolled: number;
};

export type SetupGrade = {
  id: string;
  name: string;
  stream: string;
  lead: string;
  batches: SetupBatch[];
};

export type SetupSchool = {
  id: string;
  name: string;
  code: string;
  level: SchoolLevel;
  principal: string;
  city: string;
  grades: SetupGrade[];
};

export type SetupDistrict = {
  name: string;
  region: string;
  schools: SetupSchool[];
};

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  ES: "Elementary School",
  MS: "Middle School",
  HS: "High School"
};

export const CURRICULUM_STREAMS = [
  "Foundational",
  "General",
  "STEM Focus",
  "Advanced Placement",
  "IB Diploma"
];

export const BATCH_YEARS = ["2025–26", "2026–27", "2027–28", "2028–29"];

/** The year new batches default to, and the one the seed puts most batches in. */
export const CURRENT_BATCH_YEAR = "2026–27";

/* ---------------------------------------------------------------------------
   Seed
   --------------------------------------------------------------------------- */

// TODO: unconfirmed. Principals, streams and grade leads are placeholders so the
// detail panel has something to show — none of them come from a source system.
const SCHOOL_META: Record<string, { code: string; principal: string; city: string; stream: string }> = {
  "edison-hs": { code: "EHS", principal: "Dr. Alan Whitfield", city: "Edison, NJ", stream: "General" },
  "edison-ms": { code: "EMS", principal: "Kevin Osei", city: "Edison, NJ", stream: "STEM Focus" },
  "james-madison-intermediate": {
    code: "JMI",
    principal: "Maria Delgado",
    city: "Edison, NJ",
    stream: "General"
  },
  "lincoln-es": { code: "LES", principal: "Priya Nair", city: "Metuchen, NJ", stream: "Foundational" },
  "franklin-es": { code: "FES", principal: "Dana Whitfield", city: "Edison, NJ", stream: "Foundational" }
};

const GRADE_LEADS = [
  "Ms. A. Rivera",
  "Mr. D. Okafor",
  "Ms. L. Chen",
  "Mr. P. Kaur",
  "Ms. R. Bhatt",
  "Mr. T. Sullivan",
  "Ms. N. Haddad"
];

const BATCH_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Room size by school level — an elementary room holds fewer than a high school one. */
const SEATS_PER_BATCH: Record<SchoolLevel, number> = { ES: 30, MS: 34, HS: 38 };

/**
 * Splits a grade's students into enough batches to seat them.
 *
 * Capacity is the *room*, not a number fitted to the enrollment: a level's room
 * size less a seat or two for the smaller rooms. That leaves each grade's fill
 * wherever the arithmetic puts it, which is the point — deriving capacity from
 * enrollment instead would have made every batch read as exactly full, so a
 * genuinely over-subscribed grade would have looked like the norm.
 *
 * Enrollment is distributed exactly, so a grade's batches always sum back to the
 * grade, the school, and the district — School Setup and Home describe one
 * district, not two.
 */
function batchesForGrade(
  schoolId: string,
  grade: string,
  students: number,
  level: SchoolLevel,
  index: number
): SetupBatch[] {
  const seats = SEATS_PER_BATCH[level];
  const count = Math.max(1, Math.ceil(students / seats));
  const base = Math.floor(students / count);
  const remainder = students - base * count;

  return Array.from({ length: count }, (_, batchIndex) => {
    const enrolled = base + (batchIndex < remainder ? 1 : 0);
    return {
      id: `${schoolId}-${grade}-${BATCH_LETTERS[batchIndex] ?? batchIndex + 1}`,
      name: `Batch ${BATCH_LETTERS[batchIndex] ?? batchIndex + 1}`,
      // One batch per school is held over from last year, so the year filter has
      // something to filter and the field isn't decorative.
      year: batchIndex === 0 && index === 1 ? BATCH_YEARS[0] : CURRENT_BATCH_YEAR,
      capacity: Math.max(enrolled, seats - (batchIndex % 3)),
      enrolled
    };
  });
}

export const seedDistrict: SetupDistrict = {
  name: "Edison Unified District",
  region: "Middlesex County, NJ",
  schools: schools.map((school) => {
    const meta = SCHOOL_META[school.id];
    const row = teacherStudentRatioBySchool.find((entry) => entry.school === school.name);
    const students = splitAcrossGrades(row?.students ?? 0, school.grades);

    return {
      id: school.id,
      name: school.name,
      code: meta?.code ?? school.id.slice(0, 3).toUpperCase(),
      level: school.level,
      principal: meta?.principal ?? "Unassigned",
      city: meta?.city ?? "Edison, NJ",
      grades: school.grades.map((grade, index) => ({
        id: `${school.id}-${grade}`,
        name: gradeLabel(grade),
        stream: meta?.stream ?? "General",
        lead: GRADE_LEADS[index % GRADE_LEADS.length],
        batches: batchesForGrade(school.id, grade, students[grade] ?? 0, school.level, index)
      }))
    };
  })
};

/* ---------------------------------------------------------------------------
   Rollups
   --------------------------------------------------------------------------- */

export type Seats = { enrolled: number; capacity: number };

export const EMPTY_SEATS: Seats = { enrolled: 0, capacity: 0 };

function addSeats(a: Seats, b: Seats): Seats {
  return { enrolled: a.enrolled + b.enrolled, capacity: a.capacity + b.capacity };
}

export function gradeSeats(grade: SetupGrade): Seats {
  return grade.batches.reduce(
    (total, batch) => addSeats(total, { enrolled: batch.enrolled, capacity: batch.capacity }),
    EMPTY_SEATS
  );
}

export function schoolSeats(school: SetupSchool): Seats {
  return school.grades.reduce((total, grade) => addSeats(total, gradeSeats(grade)), EMPTY_SEATS);
}

export function districtSeats(district: SetupDistrict): Seats {
  return district.schools.reduce((total, school) => addSeats(total, schoolSeats(school)), EMPTY_SEATS);
}

export function batchCount(school: SetupSchool): number {
  return school.grades.reduce((total, grade) => total + grade.batches.length, 0);
}

/** Rounded whole percent, and 0 rather than NaN for a level with no seats yet. */
export function seatsPct(seats: Seats): number {
  return seats.capacity > 0 ? Math.round((seats.enrolled / seats.capacity) * 100) : 0;
}

export function seatsSummary(seats: Seats): string {
  return `${seats.enrolled.toLocaleString()} of ${seats.capacity.toLocaleString()} seats`;
}

/** Distinct batch years under a grade, oldest first, for its year filter. */
export function batchYears(grade: SetupGrade): string[] {
  return Array.from(new Set(grade.batches.map((batch) => batch.year))).sort();
}

/* ---------------------------------------------------------------------------
   Lookup and ids
   --------------------------------------------------------------------------- */

export function findSchool(district: SetupDistrict, schoolId: string | null): SetupSchool | null {
  return schoolId ? district.schools.find((school) => school.id === schoolId) ?? null : null;
}

export function findGrade(school: SetupSchool | null, gradeId: string | null): SetupGrade | null {
  return school && gradeId ? school.grades.find((grade) => grade.id === gradeId) ?? null : null;
}

export function findBatch(grade: SetupGrade | null, batchId: string | null): SetupBatch | null {
  return grade && batchId ? grade.batches.find((batch) => batch.id === batchId) ?? null : null;
}

export function newSetupId(kind: SetupNodeKind, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${kind}-${slug || "node"}-${Date.now()}`;
}

/**
 * The mark on a row: whatever actually distinguishes one sibling from the next.
 *
 * A grade's number and a batch's letter, because "Grade 10" and "Grade 12" would
 * otherwise both come out "G1". Initials are the fallback only — a school passes
 * its own code instead, since generic type words ("School", "Elementary") sit at
 * the end of most school names and reduced every one of them to the same two
 * letters.
 */
export function setupMark(name: string): string {
  const trimmed = name.trim();
  if (/^grade/i.test(trimmed)) return trimmed.match(/\d+/)?.[0] ?? "G";
  if (/^batch/i.test(trimmed)) return trimmed.replace(/[^a-z0-9]/gi, "").slice(-1).toUpperCase();

  const words = trimmed.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word[0] ?? ""));
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Next unused batch letter in a grade, so Add batch opens pre-filled. */
export function suggestBatchName(grade: SetupGrade | null): string {
  const taken = new Set((grade?.batches ?? []).map((batch) => batch.name));
  const free = BATCH_LETTERS.find((letter) => !taken.has(`Batch ${letter}`));
  return `Batch ${free ?? (grade?.batches.length ?? 0) + 1}`;
}

/** Next grade up from the highest the school runs, so Add grade opens pre-filled. */
export function suggestGradeName(school: SetupSchool | null): string {
  if (!school || school.grades.length === 0) return "";
  const numbers = school.grades
    .map((grade) => Number(grade.name.match(/\d+/)?.[0] ?? 0))
    .filter((value) => value > 0);
  if (numbers.length === 0) return "";
  return gradeLabel(String(Math.max(...numbers) + 1));
}
