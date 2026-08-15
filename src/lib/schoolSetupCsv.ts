import { CURRENT_BATCH_YEAR, SCHOOL_LEVEL_LABELS, type SetupDistrict } from "@/lib/data/schoolSetup";
import type { SchoolLevel } from "@/lib/data/schools";
import { splitCsvLine } from "@/lib/skillsCsv";

/**
 * Bulk load of the district hierarchy.
 *
 * One row per batch, with the school and grade columns repeating down the rows —
 * which is what a roster exported from a spreadsheet actually looks like, and
 * the same grain the Skill groups import uses. A row can stop short: give a
 * school and no grade to create the school alone, or a school and grade and no
 * batch to create the grade with nothing under it yet.
 *
 *   school,school_code,level,principal,city,grade,stream,grade_lead,batch,year,capacity
 *
 * Deliberately no `enrolled` column. Enrollment comes from Genesis, not from an
 * admin's spreadsheet — the same reason the Add batch form starts a new batch at
 * zero rather than asking for a number.
 */

export type SetupCsvRow = {
  /** 1-based line number in the file, counting the header. */
  line: number;
  school: string;
  schoolCode: string;
  level: SchoolLevel | null;
  principal: string;
  city: string;
  grade: string;
  stream: string;
  gradeLead: string;
  batch: string;
  year: string;
  capacity: number | null;
};

export type SetupCsvIssue = { line: number; message: string };

export type SetupCsvResult = {
  rows: SetupCsvRow[];
  issues: SetupCsvIssue[];
  /** What applying this file would create, for the pre-import summary. */
  newSchools: string[];
  newGrades: string[];
  newBatches: number;
  /** Rows that land on something already there and will update it. */
  updated: number;
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/_/g, " ");
}

/** Header-name matching, so column order in the sheet does not matter. */
function buildIndex(header: string[]): Record<string, number> {
  const cells = header.map(normalizeHeader);
  const find = (...names: string[]) => {
    for (const name of names) {
      const at = cells.indexOf(name);
      if (at >= 0) return at;
    }
    return undefined;
  };

  const index: Record<string, number | undefined> = {
    school: find("school", "school name"),
    schoolCode: find("school code", "code"),
    level: find("level", "school level", "type"),
    principal: find("principal", "head"),
    city: find("city", "location"),
    grade: find("grade", "grade name"),
    stream: find("stream", "curriculum", "curriculum stream"),
    gradeLead: find("grade lead", "lead"),
    batch: find("batch", "batch name", "section"),
    year: find("year", "batch year", "academic year"),
    capacity: find("capacity", "seats", "seat capacity")
  };

  return Object.fromEntries(
    Object.entries(index).filter(([, column]) => column !== undefined)
  ) as Record<string, number>;
}

const LEVEL_ALIASES = new Map<string, SchoolLevel>([
  ["es", "ES"],
  ["elementary", "ES"],
  ["elementary school", "ES"],
  ["ms", "MS"],
  ["middle", "MS"],
  ["middle school", "MS"],
  ["intermediate", "MS"],
  ["hs", "HS"],
  ["high", "HS"],
  ["high school", "HS"]
]);

function parseLevel(raw: string): SchoolLevel | null {
  return LEVEL_ALIASES.get(normalizeHeader(raw)) ?? null;
}

/** "9" and "grade 9" both mean Grade 9, so a sheet of bare numbers still loads. */
function normalizeGradeName(raw: string): string {
  const value = raw.trim();
  if (value === "") return "";
  return /^\d+$/.test(value) ? `Grade ${value}` : value;
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function schoolSetupCsvTemplate(): string {
  const header = "school,school_code,level,principal,city,grade,stream,grade_lead,batch,year,capacity\n";
  const rows = [
    `Franklin Park High School,FPH,High School,Dr. R. Adeyemi,"Edison, NJ",Grade 9,General,Ms. A. Rivera,Batch A,${CURRENT_BATCH_YEAR},38`,
    `Franklin Park High School,FPH,High School,Dr. R. Adeyemi,"Edison, NJ",Grade 9,General,Ms. A. Rivera,Batch B,${CURRENT_BATCH_YEAR},38`,
    `Franklin Park High School,FPH,High School,Dr. R. Adeyemi,"Edison, NJ",Grade 10,General,Mr. D. Okafor,Batch A,${CURRENT_BATCH_YEAR},36`
  ].join("\n");
  return `${header}${rows}\n`;
}

/**
 * @param district the tree as it stands, so the summary can say what the file
 *   adds versus what it changes before anything is applied.
 */
export function parseSchoolSetupCsv(text: string, district: SetupDistrict): SetupCsvResult {
  const lines = text.split(/\r?\n/);
  const rows: SetupCsvRow[] = [];
  const issues: SetupCsvIssue[] = [];

  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex < 0) {
    return {
      rows: [],
      issues: [{ line: 1, message: "The file is empty." }],
      newSchools: [],
      newGrades: [],
      newBatches: 0,
      updated: 0
    };
  }

  const index = buildIndex(splitCsvLine(lines[headerIndex]));
  if (index.school === undefined) {
    return {
      rows: [],
      issues: [
        {
          line: headerIndex + 1,
          message:
            "Header has no school column. At minimum a file needs `school`; download the template to see the rest."
        }
      ],
      newSchools: [],
      newGrades: [],
      newBatches: 0,
      updated: 0
    };
  }

  /* Tracked as the file is read, not just against the existing tree: two rows
     both adding Grade 9 to a new school should report one new grade, not two. */
  const newSchools: string[] = [];
  const newGrades: string[] = [];
  const seenBatches = new Set<string>();
  let newBatches = 0;
  let updated = 0;

  lines.forEach((raw, offset) => {
    const line = offset + 1;
    if (offset <= headerIndex || raw.trim() === "") return;

    const cells = splitCsvLine(raw);
    const at = (field: string) =>
      index[field] === undefined ? "" : (cells[index[field]] ?? "").trim();

    const school = at("school");
    if (!school) {
      issues.push({ line, message: "No school name." });
      return;
    }

    const levelRaw = at("level");
    const level = levelRaw ? parseLevel(levelRaw) : null;
    if (levelRaw && !level) {
      issues.push({
        line,
        message: `"${levelRaw}" is not a school level. Use ${Object.values(SCHOOL_LEVEL_LABELS).join(", ")}.`
      });
      return;
    }

    const grade = normalizeGradeName(at("grade"));
    const batch = at("batch");
    if (batch && !grade) {
      // A batch hangs off a grade; without one there is nowhere to put it.
      issues.push({ line, message: `"${batch}" has no grade to sit under.` });
      return;
    }

    const capacityRaw = at("capacity");
    let capacity: number | null = null;
    if (capacityRaw) {
      const parsed = Number(capacityRaw);
      if (!Number.isFinite(parsed) || parsed < 1) {
        issues.push({ line, message: `"${capacityRaw}" is not a seat capacity.` });
        return;
      }
      capacity = Math.round(parsed);
    }

    const existingSchool = district.schools.find((entry) => same(entry.name, school));
    const isNewSchool =
      !existingSchool && !newSchools.some((entry) => same(entry, school));
    if (isNewSchool) newSchools.push(school);

    if (grade) {
      const existingGrade = existingSchool?.grades.find((entry) => same(entry.name, grade));
      const gradeKey = `${school.toLowerCase()}|${grade.toLowerCase()}`;
      if (!existingGrade && !newGrades.includes(gradeKey)) newGrades.push(gradeKey);

      if (batch) {
        const existingBatch = existingGrade?.batches.find((entry) => same(entry.name, batch));
        const batchKey = `${gradeKey}|${batch.toLowerCase()}`;
        if (seenBatches.has(batchKey)) {
          issues.push({
            line,
            message: `"${batch}" appears twice under ${school} · ${grade}. The later row was skipped.`
          });
          return;
        }
        seenBatches.add(batchKey);
        if (existingBatch) updated += 1;
        else newBatches += 1;
      } else if (existingGrade) {
        updated += 1;
      }
    } else if (existingSchool) {
      updated += 1;
    }

    rows.push({
      line,
      school,
      schoolCode: at("schoolCode"),
      level,
      principal: at("principal"),
      city: at("city"),
      grade,
      stream: at("stream"),
      gradeLead: at("gradeLead"),
      batch,
      year: at("year") || CURRENT_BATCH_YEAR,
      capacity
    });
  });

  return {
    rows,
    issues,
    newSchools,
    // Held as `school|grade` keys while counting; the summary only needs how many.
    newGrades,
    newBatches,
    updated
  };
}
