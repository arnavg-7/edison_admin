/**
 * How far each student has got with the goals an admin set for their grade.
 *
 * The other half of Goals. An admin writes one goal for a whole grade;
 * every student in that grade then reports where they are with it, and the
 * admin's job is to watch the spread — one goal that half the grade has not
 * started is a different problem from one goal that two students are stuck on.
 *
 * Two kinds of goal, two ways a status arrives, and they must not share a
 * vocabulary. A MANUAL goal's status is reported: the student picks from what
 * their portal offers — Not started, In progress, Completed. An AUTO goal's
 * status is computed from their Portrait of a Graduate rating against the level
 * the goal requires, and nobody types it; "Not met" there is the semester having
 * closed with the student short of the target, which is the outcome an admin most
 * needs to see coming.
 *
 * Both are admin-created. A student's own goals live separately (see
 * studentGoals) and carry their own finer-grained scale.
 *
 * The status is the student's to set. An admin reads it and never writes it —
 * an admin marking a goal Completed on a student's behalf is a claim about work
 * they did not see.
 *
 * TODO: replace with real reads once the Admin DB contract exists. Statuses are
 * derived deterministically from the goal and the student.
 */

import { seedPoagLevels, seedPoagPillars } from "./poag";
import { subjectsForGrade } from "./poagCoverage";
import { subjects } from "./systemSettings";
import { poagStudentRecord } from "./poagStudent";
import { gradeRoster, rosterSeed, type RosterStudent } from "./studentRoster";
import { isPastSemester, type GoalThreshold, type GradeGoal } from "./academicGoals";

/** Reported by the student on a manual goal. */
export const MANUAL_GOAL_STATUSES = ["Not started", "In progress", "Completed"] as const;

/**
 * Computed on an auto goal. Never set by a person.
 *
 * Four rather than two because "not met" is only true once the window has closed.
 * While it is open, a student short of the target is either within reach of it or
 * not, and those call for different attention — which is the whole reason to
 * track the level rather than wait for a verdict.
 */
export const AUTO_GOAL_STATUSES = ["Met", "On track", "At risk", "Not met"] as const;

export const GRADE_GOAL_STATUSES = [...MANUAL_GOAL_STATUSES, ...AUTO_GOAL_STATUSES] as const;
export type GradeGoalStatus = (typeof GRADE_GOAL_STATUSES)[number];

/** Which vocabulary a goal's students can be in. */
export function statusesForGoal(goal: GradeGoal): readonly GradeGoalStatus[] {
  return goal.measurement.type === "auto" ? AUTO_GOAL_STATUSES : MANUAL_GOAL_STATUSES;
}

export type GradeGoalStudentStatus = {
  student: RosterStudent;
  status: GradeGoalStatus;
  /** When the student last moved it — null while they have never touched it. */
  updatedAt: string | null;
  /** Auto goals only: the level the rating currently sits at. */
  level?: string;
  /** Auto goals only: which subject that reading came from. */
  levelSubject?: string;
};

/**
 * Fixed timestamps rather than offsets from today: a date computed from the
 * clock renders differently on the server and the client, and the whole list
 * would be replaced on hydration.
 */
const UPDATED_AT = [
  "2026-08-14T09:12:00-04:00",
  "2026-08-06T14:35:00-04:00",
  "2026-07-29T11:05:00-04:00",
  "2026-07-17T08:48:00-04:00",
  "2026-06-30T15:22:00-04:00"
];

/**
 * The student's current level on the goal's pillar, and where it was read.
 *
 * A subject-scoped goal reads that subject only. An unscoped one takes the
 * student's best reading across the subjects their grade is taught — the rule the
 * goal's own `subjectId: null` states, rather than an average, which POAG defines
 * no meaning for.
 */
/**
 * The pillar a goal is about, by display title.
 *
 * Seeded pillars only — a district-added one falls back to its rubric key. The
 * live list lives in the POAG store, which is a client hook this data layer
 * cannot reach; the key is what the goal stores either way, so it degrades to
 * something true rather than to a blank.
 */
export function goalPillarTitle(goal: GradeGoal): string {
  const pillar = seedPoagPillars.find((entry) => entry.rubricKey === goal.pillarKey);
  return pillar?.displayTitle ?? goal.pillarKey;
}

function currentLevel(
  goal: GradeGoal,
  student: RosterStudent,
  grade: string,
  levels: string[]
): { index: number; subject: string } | null {
  if (goal.measurement.type !== "auto") return null;

  const pillar = seedPoagPillars.find((entry) => entry.rubricKey === goal.pillarKey);
  if (!pillar) return null;

  const gradeSubjects = subjectsForGrade(grade);
  const scoped = goal.measurement.subjectId;
  const candidates = scoped
    ? gradeSubjects.filter((subject) => subject.id === scoped)
    : gradeSubjects;
  if (candidates.length === 0) return null;

  let best: { index: number; subject: string } | null = null;
  for (const subject of candidates) {
    const record = poagStudentRecord(student.id, subject.id, [pillar], levels.length)[0];
    const index = record?.entries[0]?.level ?? 0;
    if (!best || index > best.index) best = { index, subject: subject.name };
  }
  return best;
}

/** Every student in the grade, with where they stand on one goal. */
export function gradeGoalStatuses(
  schoolId: string,
  grade: string,
  goal: GradeGoal,
  /** The live rating scale, so a renamed or added level is respected. */
  levels: string[] = [...seedPoagLevels]
): GradeGoalStudentStatus[] {
  const closed = isPastSemester(goal);
  const target =
    goal.measurement.type === "auto" ? levels.indexOf(goal.measurement.requiredLevel) : -1;

  return gradeRoster(schoolId, grade).map((student) => {
    const key = rosterSeed(goal.id, student.name);

    if (goal.measurement.type === "auto") {
      const reading = currentLevel(goal, student, grade, levels);
      const index = reading?.index ?? 0;
      const gap = target - index;

      /* Met the moment the rating clears the target, whether or not the window
         has closed — the goal was to reach a level, not to reach it on a date.
         Short of it, the window decides: still open, how far short; closed, the
         goal simply was not met. */
      const status: GradeGoalStatus =
        gap <= 0 ? "Met" : closed ? "Not met" : gap === 1 ? "On track" : "At risk";

      return {
        student,
        status,
        // The system evaluated it, so there is always a timestamp.
        updatedAt: UPDATED_AT[key % UPDATED_AT.length],
        level: levels[index] ?? levels[0],
        levelSubject: reading?.subject
      };
    }

    /* Weighted rather than an even third each: a goal a grade is part-way
       through is the normal case, and three equal buckets made every goal on
       the screen look identical. */
    const roll = key % 10;
    const status: GradeGoalStatus =
      roll < 3 ? "Not started" : roll < 8 ? "In progress" : "Completed";

    return {
      student,
      status,
      // Never started means never reported, so there is nothing to date.
      updatedAt: status === "Not started" ? null : UPDATED_AT[(key >> 4) % UPDATED_AT.length]
    };
  });
}

export type GradeGoalTally = {
  /** Completed on a manual goal, Met on an auto one — the goal achieved. */
  achieved: number;
  /** Underway but not there: In progress, or On track. */
  underway: number;
  /** Not started on a manual goal; At risk or Not met on an auto one. */
  behind: number;
  total: number;
};

export function gradeGoalTally(rows: GradeGoalStudentStatus[]): GradeGoalTally {
  const count = (...statuses: GradeGoalStatus[]) =>
    rows.filter((row) => statuses.includes(row.status)).length;

  return {
    achieved: count("Completed", "Met"),
    underway: count("In progress", "On track"),
    behind: count("Not started", "At risk", "Not met"),
    total: rows.length
  };
}

/** One student's status on one goal, for their own 360. */
export function studentGoalStatus(
  schoolId: string,
  grade: string,
  goal: GradeGoal,
  studentName: string,
  levels?: string[]
): GradeGoalStudentStatus | null {
  return (
    gradeGoalStatuses(schoolId, grade, goal, levels).find(
      (row) => row.student.name === studentName
    ) ?? null
  );
}

/** The goal reached, whichever vocabulary it is counted in. */
export function isAchieved(status: GradeGoalStatus | undefined): boolean {
  return status === "Completed" || status === "Met";
}

/** Badge tone — the words carry the meaning, this only reinforces it. */
export function gradeGoalStatusTone(status: GradeGoalStatus): "ok" | "warn" | "error" | "neutral" {
  if (status === "Completed" || status === "Met") return "ok";
  if (status === "In progress" || status === "On track") return "warn";
  if (status === "At risk" || status === "Not met") return "error";
  return "neutral";
}

/** "Applying in Critical Thinking · any subject" — the target, in words. */
export function targetSentence(goal: GradeGoal): string | null {
  if (goal.measurement.type !== "auto") return null;
  // Bound locally: the narrowing above does not survive into the callbacks.
  const { requiredLevel, subjectId } = goal.measurement;

  /* Read from the whole subject list, not one grade's: a goal names a subject by
     id, and which grades happen to be taught it is a different question. */
  const subject = subjectId
    ? (subjects.find((entry) => entry.id === subjectId)?.name ?? "one subject")
    : "any subject";

  return `${requiredLevel} in ${goalPillarTitle(goal)} · ${subject}`;
}

/* ── Cohort thresholds ─────────────────────────────────────────────────── */

/**
 * The ordered vocabulary a goal's spread is read in — and, on an auto goal, the
 * one its thresholds are written against.
 *
 * An auto goal's levels are the POAG scale; a manual goal's are its statuses.
 * Ordered lowest to highest either way, which is what makes "at or above" mean
 * something — a threshold is a statement about a position in this list. Only
 * auto goals carry thresholds, so only their branch is ever judged against one;
 * a manual goal still has a spread, it just has no target to hold it to.
 */
export function goalLevels(goal: GradeGoal, levels: string[] = [...seedPoagLevels]): string[] {
  return goal.measurement.type === "auto" ? levels : [...MANUAL_GOAL_STATUSES];
}

/** Where one student sits in that vocabulary. */
function studentLevel(row: GradeGoalStudentStatus, goal: GradeGoal): string | null {
  return goal.measurement.type === "auto" ? (row.level ?? null) : row.status;
}

/** How many students sit at each level, for the spread a threshold judges. */
export function levelDistribution(
  goal: GradeGoal,
  rows: GradeGoalStudentStatus[],
  levels?: string[]
): { level: string; count: number; percent: number }[] {
  const vocabulary = goalLevels(goal, levels);
  const total = rows.length;

  return vocabulary.map((level) => {
    const count = rows.filter((row) => studentLevel(row, goal) === level).length;
    return { level, count, percent: total === 0 ? 0 : (count / total) * 100 };
  });
}

export type ThresholdResult = {
  threshold: GoalThreshold;
  /** Students counted by the rule — at or above for a floor, at for a ceiling. */
  count: number;
  total: number;
  actual: number;
  met: boolean;
  /** The rule in words, so no screen has to reconstruct it. */
  sentence: string;
};

/**
 * Whether the grade is holding one threshold.
 *
 * A floor counts everyone at or above the level; a ceiling counts only those at
 * it. That asymmetry is deliberate and matches how the two are written: "70% at
 * or above Applying" is about a body of students clearing a bar, while "no more
 * than 10% at Learning" is about a specific group being too large.
 */
export function evaluateThreshold(
  goal: GradeGoal,
  threshold: GoalThreshold,
  rows: GradeGoalStudentStatus[],
  levels?: string[]
): ThresholdResult {
  const vocabulary = goalLevels(goal, levels);
  const target = vocabulary.indexOf(threshold.level);
  const total = rows.length;

  const count = rows.filter((row) => {
    const level = studentLevel(row, goal);
    if (level === null) return false;
    const index = vocabulary.indexOf(level);
    if (index < 0 || target < 0) return false;
    return threshold.kind === "floor" ? index >= target : index === target;
  }).length;

  const actual = total === 0 ? 0 : (count / total) * 100;

  return {
    threshold,
    count,
    total,
    actual,
    /* An empty grade holds every threshold rather than failing them all: there is
       nobody to be below the floor or above the ceiling. */
    met: total === 0 ? true : threshold.kind === "floor" ? actual >= threshold.percent : actual <= threshold.percent,
    sentence: thresholdSentence(goal, threshold)
  };
}

/** "At least 70% of students at or above Applying in Critical Thinking". */
export function thresholdSentence(goal: GradeGoal, threshold: GoalThreshold): string {
  const where = `${threshold.level} in ${goalPillarTitle(goal)}`;
  return threshold.kind === "floor"
    ? `At least ${threshold.percent}% of students at or above ${where}`
    : `No more than ${threshold.percent}% of students at ${where}`;
}

export function evaluateThresholds(
  goal: GradeGoal,
  rows: GradeGoalStudentStatus[],
  levels?: string[]
): ThresholdResult[] {
  return goal.thresholds.map((threshold) => evaluateThreshold(goal, threshold, rows, levels));
}
