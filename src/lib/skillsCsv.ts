import { SKILL_LEVELS, type SkillLevel } from "@/lib/data/skillsDevelopment";

/**
 * CSV import for the skills profile.
 *
 * One row per sub-skill, because that is the level the description belongs to.
 * The skill column repeats down the rows, which is what a spreadsheet exported
 * from a curriculum doc actually looks like:
 *
 *   Skill,Sub-skill,Level,Description
 *   Resilience,Perseverance,High,Keeps working after early attempts fail.
 *   Resilience,Flexibility,Middle,Accepts change and learns from mistakes.
 */

export type ParsedSubSkill = {
  label: string;
  level: SkillLevel;
  description: string;
};

export type ParsedGroup = {
  title: string;
  subSkills: ParsedSubSkill[];
};

export type CsvIssue = {
  /** 1-based line number in the pasted text, counting the header. */
  line: number;
  message: string;
};

export type CsvParseResult = {
  groups: ParsedGroup[];
  issues: CsvIssue[];
  /** Rows that produced a sub-skill, for the "N skills / M sub-skills" summary. */
  rowCount: number;
};

/**
 * Splits one CSV line, honouring double-quoted fields so a description can
 * contain commas. Doubled quotes inside a quoted field are a literal quote,
 * which is how spreadsheets escape them.
 */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (inQuotes) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }

  fields.push(field);
  return fields.map((entry) => entry.trim());
}

const LEVEL_BY_NAME = new Map<string, SkillLevel>(
  SKILL_LEVELS.flatMap((option) => [
    [option.value, option.value] as const,
    // "High Skill" as exported, and the bare "High" people actually type.
    [option.label.toLowerCase(), option.value] as const,
    [option.label.toLowerCase().replace(/\s*skill$/, ""), option.value] as const
  ])
);

function parseLevel(raw: string): SkillLevel | null {
  return LEVEL_BY_NAME.get(raw.trim().toLowerCase()) ?? null;
}

/** A header row is optional — detected, not required. */
function looksLikeHeader(fields: string[]): boolean {
  return fields[0]?.toLowerCase() === "skill" && fields[1]?.toLowerCase().startsWith("sub");
}

export function parseSkillsCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/);
  const groups: ParsedGroup[] = [];
  const issues: CsvIssue[] = [];
  const byTitle = new Map<string, ParsedGroup>();
  let rowCount = 0;

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const lineNumber = index + 1;

    if (line === "") return;

    const fields = splitCsvLine(raw);
    if (index === 0 && looksLikeHeader(fields)) return;

    const [skill, subSkill, level, ...rest] = fields;
    // Re-join any trailing fields: an unquoted description containing a comma
    // arrives split, and dropping the tail would silently truncate it.
    const description = rest.join(", ").trim();

    if (!skill) {
      issues.push({ line: lineNumber, message: "Missing a skill name." });
      return;
    }
    if (!subSkill) {
      issues.push({ line: lineNumber, message: `"${skill}" has no sub-skill name.` });
      return;
    }

    const parsedLevel = parseLevel(level ?? "");
    if (!parsedLevel) {
      issues.push({
        line: lineNumber,
        message: `"${level || "(blank)"}" is not a level. Use High, Middle or Elementary.`
      });
      return;
    }

    let group = byTitle.get(skill.toLowerCase());
    if (!group) {
      group = { title: skill, subSkills: [] };
      byTitle.set(skill.toLowerCase(), group);
      groups.push(group);
    }

    if (group.subSkills.some((sub) => sub.label.toLowerCase() === subSkill.toLowerCase())) {
      issues.push({
        line: lineNumber,
        message: `"${subSkill}" appears twice under "${skill}". The later row was skipped.`
      });
      return;
    }

    group.subSkills.push({ label: subSkill, level: parsedLevel, description });
    rowCount += 1;
  });

  return { groups, issues, rowCount };
}
