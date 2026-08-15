import { POAG_BANDS, poagRubricKeyFrom, type PoagBand } from "@/lib/data/poag";
import { splitCsvLine } from "@/lib/skillsCsv";
import { subjects } from "@/lib/data/systemSettings";

/**
 * Bulk load for Portrait of a Graduate content — the admin-side equivalent of
 * "load poag_content from POAG_Content_Master.xlsx", which is step one of the
 * build sequence and the reason the wording lives in a table at all.
 *
 * One row per (pillar, band), which is exactly the grain of the poag_content
 * table: six pillars across three bands is eighteen rows and the whole master.
 * Columns are matched by header name rather than position, because nine columns
 * in a fixed order is a trap for anyone editing the sheet by hand.
 *
 *   display_title,rubric_key,hover_text,subjects,band,descriptor,learning,building,applying,innovating
 *
 * `subjects` is a semicolon-separated list of subject names, or blank for every
 * subject. It is a fact about the pillar rather than about the band, so the last
 * row to name it wins and a blank never narrows an existing scope — a sheet that
 * only carries wording should not silently unscope a pillar.
 *
 * The level columns are the live scale, not those four names: a district that
 * added a level uploads a file with a column for it, and the template it
 * downloads says so. Every function here therefore takes the level labels
 * rather than reading a constant.
 *
 * `rubric_key` may be left blank and is then derived from the title — but a
 * pillar that already exists must use its existing key, since that is what
 * every rating already filed against it points at.
 */

export type PoagCsvRow = {
  /** 1-based line number in the file, counting the header. */
  line: number;
  displayTitle: string;
  rubricKey: string;
  hoverText: string;
  /** Parsed subject ids; empty means every subject. */
  subjectIds: string[];
  /** True when the row left the column blank, so it must not narrow anything. */
  subjectsUnset: boolean;
  band: PoagBand;
  descriptor: string;
  /** One per level of the live scale, in order. */
  levels: string[];
};

export type PoagCsvIssue = { line: number; message: string };

export type PoagCsvResult = {
  rows: PoagCsvRow[];
  issues: PoagCsvIssue[];
  /** Rubric keys in the file that the district does not have yet. */
  newPillars: { rubricKey: string; displayTitle: string }[];
  /** Rubric keys in the file that already exist and will be reworded. */
  updatedPillars: string[];
  /** Bands the file touches, so the summary can say how wide the change is. */
  bands: PoagBand[];
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** The header name a level's column takes: "Ready to Lead" → `ready_to_lead`. */
export function poagLevelColumn(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

/** Maps each field to the column it sits in, whatever order the sheet has them. */
function buildIndex(header: string[], levelLabels: string[]): Record<string, number> {
  const cells = header.map(normalizeHeader);
  const find = (...names: string[]) => {
    for (const name of names) {
      const at = cells.indexOf(name);
      if (at >= 0) return at;
    }
    return undefined;
  };

  const index: Record<string, number | undefined> = {
    displayTitle: find("display_title", "display title", "pillar", "title"),
    rubricKey: find("rubric_key", "rubric key", "pillar_key", "rubric"),
    hoverText: find("hover_text", "hover text", "hover", "definition"),
    subjectIds: find("subjects", "subject", "rated in", "rated_in"),
    band: find("band", "grade_band", "grade band"),
    descriptor: find("descriptor", "summary")
  };

  /* Level columns by name first. Failing that, level_N — read as 0-based when
     the file carries a level_0 (the spec's own numbering) and 1-based otherwise,
     which is what a sheet written by hand almost always uses. Guessing wrong
     here would silently shift every definition one level, so it is decided from
     the whole header rather than per column. */
  const zeroBased = cells.includes("level_0");
  levelLabels.forEach((label, level) => {
    index[`level${level}`] = find(
      label.toLowerCase(),
      poagLevelColumn(label),
      `level_${zeroBased ? level : level + 1}`,
      `level ${zeroBased ? level : level + 1}`
    );
  });

  return Object.fromEntries(
    Object.entries(index).filter(([, column]) => column !== undefined)
  ) as Record<string, number>;
}

const BAND_ALIASES = new Map<string, PoagBand>([
  ["elementary", "Elementary"],
  ["elementary school", "Elementary"],
  ["es", "Elementary"],
  ["middle school", "Middle School"],
  ["middle", "Middle School"],
  ["ms", "Middle School"],
  ["high school", "High School"],
  ["high", "High School"],
  ["hs", "High School"]
]);

function parseBand(raw: string): PoagBand | null {
  return BAND_ALIASES.get(normalizeHeader(raw)) ?? null;
}

/** Subject names, semicolon-separated. Returns null when one does not resolve. */
function parseSubjects(raw: string): string[] | null {
  const names = raw
    .split(/[;|]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (names.length === 0) return [];

  const ids: string[] = [];
  for (const name of names) {
    const match = subjects.find(
      (subject) => subject.name.toLowerCase() === name.toLowerCase() || subject.id === name
    );
    if (!match) return null;
    if (!ids.includes(match.id)) ids.push(match.id);
  }
  return ids;
}

/** The worked example, one line per level of Edison's seeded four. */
const TEMPLATE_LEVEL_EXAMPLES = [
  "Accepts a topic as given and rarely asks beyond it.",
  "Asks follow-up questions when prompted.",
  "Pursues their own questions and finds where the answers live.",
  "Frames questions others had not thought to ask, and shares what they find."
];

/** @param levelLabels the live scale, in order — one column each. */
export function poagCsvTemplate(levelLabels: string[]): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = [
    "display_title",
    "rubric_key",
    "hover_text",
    "band",
    "descriptor",
    ...levelLabels.map(poagLevelColumn)
  ].join(",");

  const example = [
    "Curiosity",
    "Curious Enquirer",
    quote("Asks questions, follows them up, and enjoys not knowing the answer yet."),
    quote("Science;Mathematics"),
    "High School",
    quote("Pursuing questions past the point the assignment stops."),
    // A level the district added has no worked example, so the placeholder names
    // it — an empty cell in the template would read as an optional column.
    ...levelLabels.map((label, level) =>
      quote(TEMPLATE_LEVEL_EXAMPLES[level] ?? `What ${label} looks like for this band.`)
    )
  ].join(",");

  return `${header}\n${example}\n`;
}

/**
 * @param existingKeys rubric keys the district already has, so the summary can
 *   tell "adds a pillar" apart from "rewords one" before anything is applied.
 * @param levelLabels the live scale, in order. A file is measured against the
 *   scale as it stands now, so adding a level makes older files incomplete —
 *   which they are: they have nothing to say about the new level.
 */
export function parsePoagCsv(
  text: string,
  existingKeys: string[],
  levelLabels: string[]
): PoagCsvResult {
  const known = new Set(existingKeys);
  const lines = text.split(/\r?\n/);
  const rows: PoagCsvRow[] = [];
  const issues: PoagCsvIssue[] = [];

  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  if (headerIndex < 0) {
    return { rows: [], issues: [{ line: 1, message: "The file is empty." }], newPillars: [], updatedPillars: [], bands: [] };
  }

  const index = buildIndex(splitCsvLine(lines[headerIndex]), levelLabels);
  const required = [
    "displayTitle",
    "band",
    "descriptor",
    ...levelLabels.map((_, level) => `level${level}`)
  ];
  const missing = required.filter((field) => index[field] === undefined);

  if (missing.length > 0) {
    return {
      rows: [],
      issues: [
        {
          line: headerIndex + 1,
          message: `Header is missing ${missing.length} column${missing.length === 1 ? "" : "s"}. Expected display_title, band, descriptor and the ${levelLabels.length} level columns — download the template to see the exact names.`
        }
      ],
      newPillars: [],
      updatedPillars: [],
      bands: []
    };
  }

  const seenPairs = new Set<string>();
  const newPillars = new Map<string, string>();
  const updatedPillars = new Set<string>();
  const bands = new Set<PoagBand>();

  lines.forEach((raw, offset) => {
    const line = offset + 1;
    if (offset <= headerIndex || raw.trim() === "") return;

    const cells = splitCsvLine(raw);
    const at = (field: string) => (index[field] === undefined ? "" : (cells[index[field]] ?? "").trim());

    const displayTitle = at("displayTitle");
    if (!displayTitle) {
      issues.push({ line, message: "No pillar title." });
      return;
    }

    const band = parseBand(at("band"));
    if (!band) {
      issues.push({
        line,
        message: `"${at("band") || "(blank)"}" is not a band. Use ${POAG_BANDS.join(", ")}.`
      });
      return;
    }

    const descriptor = at("descriptor");
    if (!descriptor) {
      issues.push({ line, message: `"${displayTitle}" has no descriptor for ${band}.` });
      return;
    }

    const levels = levelLabels.map((_, level) => at(`level${level}`));
    const blank = levels
      .map((text, level) => (text === "" ? levelLabels[level] : null))
      .filter((label): label is string => label !== null);

    if (blank.length > 0) {
      // Partial rows are rejected rather than half-applied: a student sitting on
      // a blank level has nothing to read, and a bulk load should not create that.
      issues.push({
        line,
        message: `"${displayTitle}" (${band}) is missing ${blank.join(", ")}. All ${levelLabels.length} levels are needed.`
      });
      return;
    }

    const rawSubjects = at("subjectIds");
    const subjectIds = parseSubjects(rawSubjects);
    if (subjectIds === null) {
      issues.push({
        line,
        message: `"${rawSubjects}" is not a subject. Use ${subjects.map((subject) => subject.name).join(", ")}, separated by ";".`
      });
      return;
    }

    const rubricKey = at("rubricKey") || poagRubricKeyFrom(displayTitle);
    const pairKey = `${band}|${rubricKey}`;
    if (seenPairs.has(pairKey)) {
      issues.push({
        line,
        message: `"${displayTitle}" appears twice for ${band}. The later row was skipped.`
      });
      return;
    }
    seenPairs.add(pairKey);

    if (known.has(rubricKey)) updatedPillars.add(rubricKey);
    else newPillars.set(rubricKey, displayTitle);

    bands.add(band);
    rows.push({
      line,
      displayTitle,
      rubricKey,
      hoverText: at("hoverText"),
      subjectIds,
      subjectsUnset: rawSubjects.trim() === "",
      band,
      descriptor,
      levels
    });
  });

  return {
    rows,
    issues,
    newPillars: [...newPillars].map(([rubricKey, displayTitle]) => ({ rubricKey, displayTitle })),
    updatedPillars: [...updatedPillars],
    bands: POAG_BANDS.filter((band) => bands.has(band))
  };
}

/**
 * Bands a newly added pillar will still have no wording for. Worth saying out
 * loud: a pillar loaded for High School only is live for elementary teachers too,
 * with nothing written under it.
 */
export function bandsMissingFor(result: PoagCsvResult, rubricKey: string): PoagBand[] {
  const covered = new Set(result.rows.filter((row) => row.rubricKey === rubricKey).map((row) => row.band));
  return POAG_BANDS.filter((band) => !covered.has(band));
}
