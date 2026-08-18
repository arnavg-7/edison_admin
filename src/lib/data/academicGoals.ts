import type { ListEditorItem } from "@/components/shared/ListEditor";
import { schools, scopeKey } from "./schools";

// TODO: replace with the real Admin DB Academic Goals contract.

export const goalTemplates: ListEditorItem[] = [
  {
    id: "gt-1",
    title: "Personalized Own Academic Goal (POAG): Semester",
    detail: "Student-authored goal reviewed with an advisor at the start of each semester.",
    status: { tone: "ok", label: "Published" },
    meta: "Used by 4 schools · 1,204 active goals"
  },
  {
    id: "gt-2",
    title: "Attendance improvement plan",
    detail: "Structured goal for students below 85% attendance.",
    status: { tone: "ok", label: "Published" },
    meta: "Used by 5 schools · 218 active goals"
  },
  {
    id: "gt-3",
    title: "Post-secondary readiness",
    detail: "Grade 12 goal covering applications, testing, and portfolio milestones.",
    status: { tone: "neutral", label: "Draft" },
    meta: "Not yet published"
  }
];

export const goalCategories: ListEditorItem[] = [
  {
    id: "gc-1",
    title: "Academic achievement",
    detail: "Subject mastery and grade-level performance goals.",
    status: { tone: "ok", label: "Active" },
    meta: "2 templates"
  },
  {
    id: "gc-2",
    title: "Attendance & engagement",
    detail: "Presence, participation, and punctuality goals.",
    status: { tone: "ok", label: "Active" },
    meta: "1 template"
  },
  {
    id: "gc-3",
    title: "Social & emotional",
    detail: "Wellbeing, self-regulation, and peer relationship goals.",
    status: { tone: "ok", label: "Active" },
    meta: "0 templates"
  },
  {
    id: "gc-4",
    title: "Post-secondary readiness",
    detail: "College, career, and transition planning goals.",
    status: { tone: "neutral", label: "Inactive" },
    meta: "1 template"
  }
];

// ---------------------------------------------------------------------------
// Goals by school and grade — the admin names a goal, describes it, tags a
// category, and assigns it to a semester (start/end date) for a grade; this
// replaced the old flat template/category/progress-tracking tabs
// (2026-08-03). A goal moves to the grade's goal history once its semester's
// end date has gone by — there is no separate status field to mark it done.
// ---------------------------------------------------------------------------

export type GoalSemester = {
  name: string;
  /** ISO date (YYYY-MM-DD), no time component. */
  from: string;
  to: string;
};

/**
 * How a goal's progress is decided. The two are not variants of a status — they
 * are two different answers to "who says whether this is done".
 *
 * MANUAL: the admin sets the goal, the student reports where they stand. The
 * admin's job is to watch the spread.
 *
 * AUTO — POAG level: the goal names a level the student has to reach, and the
 * system compares their current Portrait of a Graduate rating against it. Nobody
 * types a status; falling short when the semester closes *is* the goal not being
 * met, and that is the case an admin most needs to see coming.
 *
 * Both are admin-created goals. A student's own goals live separately — see
 * studentGoals — and carry their own scale.
 */
export type GoalMeasurement =
  | { type: "manual" }
  | {
      type: "auto";
      /** `rubricKey` of the pillar being tracked. */
      pillarKey: string;
      /** The level the student has to reach, as a label from the live scale. */
      requiredLevel: string;
      /**
       * Which subject's rating to read, or null for "any subject".
       *
       * POAG levels are held per subject and the handoff spec defines no
       * cross-subject level, so a goal has to say which reading counts. Null is a
       * stated rule rather than a gap: the student meets it once they reach the
       * level in any subject the pillar is rated in.
       */
      subjectId: string | null;
    };

export type GradeGoal = {
  id: string;
  title: string;
  description: string;
  category: string;
  semester: GoalSemester;
  measurement: GoalMeasurement;
};

type GradeGoalSeed = {
  key: string;
  title: string;
  description: string;
  category: string;
  semester: GoalSemester;
  /** Omitted on a seed means manual, which is the default type. */
  measurement?: GoalMeasurement;
};

const MANUAL: GoalMeasurement = { type: "manual" };

function buildGradeGoals(scope: string, seeds: GradeGoalSeed[]): GradeGoal[] {
  return seeds.map(({ measurement, ...seed }) => ({
    id: `gg-${scope}-${seed.key}`,
    measurement: measurement ?? MANUAL,
    ...seed
  }));
}

const TIME_ZONE = "America/New_York";

function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** A goal is past once today is after its semester's end date. */
export function isPastSemester(goal: GradeGoal): boolean {
  return goal.semester.to < todayIso();
}

const FALL_2026: GoalSemester = { name: "Fall 2026", from: "2026-08-24", to: "2026-12-18" };
const SPRING_2026: GoalSemester = { name: "Spring 2026", from: "2026-01-12", to: "2026-05-22" };

export const gradeGoalsByGrade: Record<string, GradeGoal[]> = {
  [scopeKey("edison-hs", "9")]: buildGradeGoals(scopeKey("edison-hs", "9"), [
    {
      key: "poag",
      title: "Personalized Own Academic Goal: Semester",
      description: "Student-authored goal reviewed with an advisor at the start of the semester.",
      category: "Academic achievement",
      semester: FALL_2026
    },
    {
      key: "attendance",
      title: "Attendance improvement plan",
      description: "Structured goal for students below 85% attendance this semester.",
      category: "Attendance & engagement",
      semester: FALL_2026
    },
    {
      key: "critical-thinking",
      title: "Reach Applying in Critical Thinking",
      description:
        "Measured on the Mathematics rating — reasoning through an unfamiliar problem is what this grade is working on.",
      category: "Academic achievement",
      semester: FALL_2026,
      measurement: {
        type: "auto",
        pillarKey: "Critical Thinker & Problem Solver",
        requiredLevel: "Applying",
        subjectId: "sub-math"
      }
    },
    {
      key: "poag-past",
      title: "Personalized Own Academic Goal: Semester",
      description: "Student-authored goal reviewed with an advisor at the start of the semester.",
      category: "Academic achievement",
      semester: SPRING_2026
    },
    {
      /* A closed window, so the failure case is on screen: a student who did not
         reach the level by the end date reads Not met, and nobody typed that. */
      key: "resilience-past",
      title: "Reach Innovating in Resilience",
      description:
        "Spring stretch target on the Science rating. Closed at the end of the semester on the ratings as they stood.",
      category: "Social & emotional",
      semester: SPRING_2026,
      measurement: {
        type: "auto",
        pillarKey: "Adaptive & Resilient",
        requiredLevel: "Innovating",
        subjectId: "sub-science"
      }
    }
  ]),
  [scopeKey("edison-hs", "10")]: buildGradeGoals(scopeKey("edison-hs", "10"), [
    {
      key: "poag",
      title: "Personalized Own Academic Goal: Semester",
      description: "Student-authored goal reviewed with an advisor at the start of the semester.",
      category: "Academic achievement",
      semester: FALL_2026
    },
    {
      key: "attendance",
      title: "Attendance improvement plan",
      description: "Structured goal for students below 85% attendance this semester.",
      category: "Attendance & engagement",
      semester: FALL_2026
    },
    {
      /* Scoped to one subject, unlike the Grade 9 goal: the level has to be
         reached in Mathematics specifically, not wherever it happens first. */
      /* Unscoped, unlike the Grade 9 goal: the level counts wherever the student
         reaches it first, which is the rule `subjectId: null` states. */
      key: "communication",
      title: "Reach Innovating in Effective Communication",
      description:
        "Counts once the student reaches Innovating in any subject they are taught — wherever their strongest work is.",
      category: "Social & emotional",
      semester: FALL_2026,
      measurement: {
        type: "auto",
        pillarKey: "Effective Communicator",
        requiredLevel: "Innovating",
        subjectId: null
      }
    },
    {
      key: "attendance-past",
      title: "Attendance improvement plan",
      description: "Structured goal for students below 85% attendance last semester.",
      category: "Attendance & engagement",
      semester: SPRING_2026
    }
  ]),
  [scopeKey("edison-hs", "11")]: buildGradeGoals(scopeKey("edison-hs", "11"), [
    {
      key: "poag",
      title: "Personalized Own Academic Goal: Semester",
      description: "Student-authored goal reviewed with an advisor at the start of the semester.",
      category: "Academic achievement",
      semester: FALL_2026
    },
    {
      key: "readiness",
      title: "Post-secondary readiness",
      description: "Covers applications, testing, and portfolio milestones this semester.",
      category: "Post-secondary readiness",
      semester: FALL_2026
    },
    {
      key: "readiness-past",
      title: "Post-secondary readiness",
      description: "Covers applications, testing, and portfolio milestones from last semester.",
      category: "Post-secondary readiness",
      semester: SPRING_2026
    }
  ]),
  [scopeKey("edison-hs", "12")]: buildGradeGoals(scopeKey("edison-hs", "12"), [
    {
      key: "poag",
      title: "Personalized Own Academic Goal: Semester",
      description: "Student-authored goal reviewed with an advisor at the start of the semester.",
      category: "Academic achievement",
      semester: FALL_2026
    },
    {
      key: "readiness",
      title: "Post-secondary readiness",
      description: "Covers applications, testing, and portfolio milestones for graduating seniors.",
      category: "Post-secondary readiness",
      semester: FALL_2026
    },
    {
      key: "readiness-past",
      title: "Post-secondary readiness",
      description: "Covers applications, testing, and portfolio milestones from last semester.",
      category: "Post-secondary readiness",
      semester: SPRING_2026
    }
  ]),
  [scopeKey("edison-kg", "K")]: buildGradeGoals(scopeKey("edison-kg", "K"), [
    {
      key: "social",
      title: "Social readiness check-in",
      description: "Check-in on sharing, listening, and following routines.",
      category: "Social & emotional",
      semester: FALL_2026
    },
    {
      key: "social-past",
      title: "Social readiness check-in",
      description: "Check-in on sharing, listening, and following routines.",
      category: "Social & emotional",
      semester: SPRING_2026
    }
  ])
};

export function gradeGoalsFor(schoolId: string, grade: string): GradeGoal[] {
  return gradeGoalsByGrade[scopeKey(schoolId, grade)] ?? [];
}

/** Counts for the school and grade pickers — current goals only, history doesn't count as "active". */
export function gradeGoalsSummary(schoolId: string, grade: string) {
  const goals = gradeGoalsFor(schoolId, grade);
  const current = goals.filter((goal) => !isPastSemester(goal));
  return {
    goals: current.length,
    configured: goals.length > 0
  };
}

export function schoolGoalsSummary(schoolId: string) {
  const school = schools.find((entry) => entry.id === schoolId);
  const grades = school?.grades ?? [];
  const configured = grades.filter((grade) => gradeGoalsSummary(schoolId, grade).configured);
  const goals = grades.reduce((sum, grade) => sum + gradeGoalsSummary(schoolId, grade).goals, 0);
  return { grades: grades.length, configuredGrades: configured.length, goals };
}

/**
 * Deep link from a student's 360 to the grade that sets their goals — goals
 * are authored per grade here, not per student on the profile, so "Add Goal"
 * on an empty 360 panel has to land on this screen rather than open a form
 * inline. Falls back to the school list when it cannot be resolved rather
 * than producing a 404.
 */
export function academicGoalsHref(schoolName: string, group: string): string {
  const school = schools.find((entry) => entry.name === schoolName);
  const grade = group.replace(/^grade\s+/i, "").trim();
  if (!school || !school.grades.includes(grade)) {
    return "/academic-goals";
  }
  return `/academic-goals/${school.id}/${encodeURIComponent(grade)}`;
}
