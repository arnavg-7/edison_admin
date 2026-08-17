/**
 * One student's Portrait of a Graduate record, per subject.
 *
 * The admin screens deal in content and coverage; this is the other side of the
 * same data — what a named student has actually been rated, by whom and when.
 * It is what the Student & Faculty 360 profile shows, and it is read-only there:
 * only a class's principal teacher may write a rating, and an admin is never one
 * (handoff spec §3.3).
 *
 * Modelled append-only, the way the spec's poag_rating table is: every change is
 * a new row and the latest carries `is_current`. That is what makes a history
 * possible at all, and it is required for the multi-year growth view in §6 — so
 * the shape here is a list of entries per pillar, not a single level.
 *
 * TODO: replace with real reads of poag_rating. Levels are derived
 * deterministically from the student, subject and pillar so a profile shows the
 * same record on every render.
 */

import type { PoagPillar } from "./poag";

/** Stable pseudo-variance, so a student's record never shuffles between renders. */
function seed(...parts: string[]): number {
  const key = parts.join("|");
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000;
  }
  return hash;
}

// TODO: real rater names come from users.csv, joined through the class's
// primary=true teacher. Assigned by hash so a subject keeps the same one.
const RATERS = [
  "Ms. A. Rivera",
  "Mr. D. Okafor",
  "Ms. L. Chen",
  "Mr. P. Kaur",
  "Ms. R. Bhatt",
  "Mr. T. Sullivan"
];

/** The marking periods a rating can have been filed in, oldest first. */
export const POAG_PERIODS = [
  { key: "fall-2025", label: "Fall 2025", ratedAt: "2025-11-14T10:20:00-05:00" },
  { key: "spring-2026", label: "Spring 2026", ratedAt: "2026-04-22T09:05:00-04:00" },
  { key: "fall-2026", label: "Fall 2026", ratedAt: "2026-07-16T11:40:00-04:00" }
];

export type PoagStudentEntry = {
  /** Index into the live scale. */
  level: number;
  period: string;
  ratedBy: string;
  ratedAt: string;
};

export type PoagStudentPillar = {
  rubricKey: string;
  displayTitle: string;
  /** Newest first. The head is the current rating; the tail is the progression. */
  entries: PoagStudentEntry[];
};

/**
 * A student's record for one subject.
 *
 * Ratings only ever hold or climb: a level is a judgement that a student can do
 * something, and the rubric has no wording for losing it. A flat run is the
 * normal case — the carry-forward default means a teacher confirms last period's
 * level unless the student has visibly moved — so most pillars repeat, and the
 * ones that move are the story.
 */
export function poagStudentRecord(
  studentId: string,
  subjectId: string,
  pillars: PoagPillar[],
  levelCount: number
): PoagStudentPillar[] {
  const top = Math.max(0, levelCount - 1);

  return pillars.map((pillar) => {
    const key = seed(studentId, subjectId, pillar.rubricKey);
    const rater = RATERS[key % RATERS.length];

    // Where they started, and how many periods they moved in.
    let level = Math.min(top, key % Math.max(1, levelCount - 1));
    const entries: PoagStudentEntry[] = [];

    POAG_PERIODS.forEach((period, index) => {
      if (index > 0 && (key >> index) % 3 === 0 && level < top) level += 1;
      entries.push({ level, period: period.label, ratedBy: rater, ratedAt: period.ratedAt });
    });

    // Newest first: the current rating is what the row leads with.
    return {
      rubricKey: pillar.rubricKey,
      displayTitle: pillar.displayTitle,
      entries: entries.reverse()
    };
  });
}

/** Only the periods where the level actually changed — the rest is carry-forward. */
export function poagStudentChanges(record: PoagStudentPillar[]): {
  displayTitle: string;
  from: number;
  to: number;
  period: string;
  ratedBy: string;
  ratedAt: string;
}[] {
  return record
    .flatMap((pillar) =>
      // entries are newest first, so the one *after* each is its predecessor.
      pillar.entries.flatMap((entry, index) => {
        const previous = pillar.entries[index + 1];
        if (!previous || previous.level === entry.level) return [];
        return [
          {
            displayTitle: pillar.displayTitle,
            from: previous.level,
            to: entry.level,
            period: entry.period,
            ratedBy: entry.ratedBy,
            ratedAt: entry.ratedAt
          }
        ];
      })
    )
    .sort((a, b) => b.ratedAt.localeCompare(a.ratedAt));
}
