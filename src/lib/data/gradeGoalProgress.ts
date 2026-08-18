/**
 * How far each student has got with the goals an admin set for their grade.
 *
 * The other half of Academic Goals. An admin writes one goal for a whole grade;
 * every student in that grade then reports where they are with it, and the
 * admin's job is to watch the spread — one goal that half the grade has not
 * started is a different problem from one goal that two students are stuck on.
 *
 * Three steps, not five and not a percentage: the student picks from what their
 * portal offers, and it offers Not started, In progress and Completed. This is
 * separate from a student's own personal goals (see studentGoals), which the
 * student writes themselves and which carry the finer-grained scale.
 *
 * The status is the student's to set. An admin reads it and never writes it —
 * an admin marking a goal Completed on a student's behalf is a claim about work
 * they did not see.
 *
 * TODO: replace with real reads once the Admin DB contract exists. Statuses are
 * derived deterministically from the goal and the student.
 */

import { gradeRoster, rosterSeed, type RosterStudent } from "./studentRoster";

export const GRADE_GOAL_STATUSES = ["Not started", "In progress", "Completed"] as const;
export type GradeGoalStatus = (typeof GRADE_GOAL_STATUSES)[number];

export type GradeGoalStudentStatus = {
  student: RosterStudent;
  status: GradeGoalStatus;
  /** When the student last moved it — null while they have never touched it. */
  updatedAt: string | null;
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

/** Every student in the grade, with where they say they are on one goal. */
export function gradeGoalStatuses(
  schoolId: string,
  grade: string,
  goalId: string
): GradeGoalStudentStatus[] {
  return gradeRoster(schoolId, grade).map((student) => {
    const key = rosterSeed(goalId, student.name);

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
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
};

export function gradeGoalTally(rows: GradeGoalStudentStatus[]): GradeGoalTally {
  return {
    completed: rows.filter((row) => row.status === "Completed").length,
    inProgress: rows.filter((row) => row.status === "In progress").length,
    notStarted: rows.filter((row) => row.status === "Not started").length,
    total: rows.length
  };
}

/** One student's status on one goal, for their own 360. */
export function studentGoalStatus(
  schoolId: string,
  grade: string,
  goalId: string,
  studentName: string
): GradeGoalStudentStatus | null {
  return (
    gradeGoalStatuses(schoolId, grade, goalId).find(
      (row) => row.student.name === studentName
    ) ?? null
  );
}

/** Badge tone for the three steps — the words carry the meaning, this reinforces. */
export function gradeGoalStatusTone(status: GradeGoalStatus): "ok" | "warn" | "neutral" {
  if (status === "Completed") return "ok";
  if (status === "In progress") return "warn";
  return "neutral";
}
