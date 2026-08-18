/**
 * Personal goals belonging to one student, not to their grade.
 *
 * Distinct from the grade goals the rest of Goals deals in: those are
 * written by an admin and apply to everyone in a grade, while these are written
 * by the student, or by a teacher alongside them, and belong to that student
 * alone. Each carries a type — academic work, or the personal and social side —
 * and the Portrait of a Graduate pillar it is meant to build, which is how a
 * loose intention ("join public speaking club") ties back to something the
 * school actually measures.
 *
 * An admin can set one of these for an individual student — a plan agreed in a
 * meeting, say — but never move a status. Writing a goal and reporting progress on
 * it are different acts, and only the second needs to have been there: a status an
 * admin typed would be a claim about work they did not see. So the panel offers an
 * Add and no status control, and a goal the student or their teacher wrote stays
 * entirely theirs.
 *
 * TODO: replace with real reads once the Admin DB student-goals contract
 * exists. Everything below is derived deterministically from the student's name
 * and school so a roster shows the same goals on every render.
 */

import { gradeRoster, rosterSeed as seed } from "./studentRoster";
import { studentsInGrade } from "./poagCoverage";
import type { PoagPillar } from "./poag";

export const STUDENT_GOAL_CATEGORIES = ["Academic", "Personal & Social Skills"] as const;
export type StudentGoalCategory = (typeof STUDENT_GOAL_CATEGORIES)[number];

/**
 * Progress in the student's own words, as the front end offers it.
 *
 * Deliberately not a percentage: a student judging their own goal picks a step,
 * and five named steps is what the portal shows them. Ordered, so a summary can
 * say how far along a student's set of goals is.
 */
export const STUDENT_GOAL_STATUSES = [
  "Not started",
  "Started",
  "Halfway",
  "Nearly there",
  "Achieved"
] as const;
export type StudentGoalStatus = (typeof STUDENT_GOAL_STATUSES)[number];

export type StudentGoal = {
  id: string;
  title: string;
  description: string;
  category: StudentGoalCategory;
  /** `rubricKey` of the pillar this goal builds — the join back to POAG. */
  pillarKey: string;
  /** The pillar's shown name at the time of reading, for display only. */
  pillarTitle: string;
  /**
   * ISO date the student is working to, or "" for a goal with no date set.
   *
   * Empty is a real state, not missing data: a goal agreed in a meeting often has
   * no deadline yet. Anything reading this has to cope with "" — sorting puts
   * undated goals last, and nothing may hand "" to a date formatter.
   */
  due: string;
  status: StudentGoalStatus;
  /** Who wrote it: the student, a named teacher, or an admin. */
  setBy: string;
  /**
   * Admin is a third author, not a third owner.
   *
   * An admin can set a goal for one student — a plan agreed in a meeting, say —
   * but the status stays the student's and their teacher's to move. Writing the
   * goal and reporting progress on it are different acts, and only the second
   * needs to have been there.
   */
  setByRole: "Student" | "Faculty" | "Admin";
};

export type StudentGoalRow = {
  id: string;
  studentName: string;
  /** Set when this student has a 360 profile to link through to. */
  personId: string | null;
  goals: StudentGoal[];
};

// TODO: real names come from users.csv, joined through the student's classes.
const FACULTY = [
  "Ms. A. Rivera",
  "Mr. D. Okafor",
  "Ms. L. Chen",
  "Mr. P. Kaur",
  "Ms. R. Bhatt",
  "Mr. T. Sullivan"
];

/**
 * Due dates inside the current academic year, fixed rather than computed from
 * today: a date derived from the clock renders differently on the server and
 * the client, and the whole roster would flicker on hydration.
 */
const DUE_DATES = [
  "2026-10-30",
  "2026-12-15",
  "2027-01-23",
  "2027-02-27",
  "2027-03-19",
  "2027-04-30",
  "2027-06-11"
];

type GoalSeed = { title: string; description: string; category: StudentGoalCategory };

/**
 * What a goal against each pillar actually looks like, keyed by `rubricKey`.
 *
 * Written out rather than generated because the point of the pairing is that it
 * reads true: a Critical Thinking goal is a piece of hard work with a standard
 * attached, an Emotionally Intelligent one is a habit. A generated "Improve at
 * X" for all six would make the skill tag look decorative.
 */
const GOALS_BY_PILLAR: Record<string, GoalSeed[]> = {
  "Critical Thinker & Problem Solver": [
    {
      title: "Master Calculus Integration Techniques",
      description:
        "Complete all practice problems and achieve 90%+ on the next exam to improve math skills",
      category: "Academic"
    },
    {
      title: "Build a Working Physics Simulation",
      description:
        "Model projectile motion in code, then write up where the model stops matching the lab results",
      category: "Academic"
    },
    {
      title: "Enter the Regional Debate Tournament",
      description:
        "Prepare both sides of three motions so I can argue whichever side is drawn on the day",
      category: "Personal & Social Skills"
    }
  ],
  "Effective Communicator": [
    {
      title: "Join Public Speaking Club",
      description:
        "Attend weekly meetings and deliver at least 3 presentations to build confidence",
      category: "Personal & Social Skills"
    },
    {
      title: "Lead a Seminar on a Set Text",
      description:
        "Write the discussion questions and chair a full 40-minute class seminar before the term ends",
      category: "Academic"
    },
    {
      title: "Write for the School Newspaper Monthly",
      description: "File one piece a month and take the editor's redraft notes on each",
      category: "Personal & Social Skills"
    }
  ],
  "Adaptive & Resilient": [
    {
      title: "Develop Time Management System",
      description:
        "Create and follow a weekly planner to balance academics, art projects, and extracurriculars",
      category: "Personal & Social Skills"
    },
    {
      title: "Re-sit and Improve the Mid-Term",
      description:
        "Work back through every question I missed in January, then re-take the paper in March",
      category: "Academic"
    },
    {
      title: "Finish the Season with the Track Team",
      description: "Train twice a week through winter, including the weeks it is going badly",
      category: "Personal & Social Skills"
    }
  ],
  "Resourceful Lifelong Learner": [
    {
      title: "Complete Art Portfolio for College Applications",
      description:
        "Create 12-15 original pieces showcasing range in mediums and styles for art school applications",
      category: "Academic"
    },
    {
      title: "Read Six Books Outside the Syllabus",
      description: "Keep a short written response to each, and bring two of them to class",
      category: "Academic"
    },
    {
      title: "Teach Myself Enough Python to Build One Thing",
      description: "Follow a course through to the end and ship a small tool I actually use",
      category: "Personal & Social Skills"
    }
  ],
  "Emotionally Intelligent": [
    {
      title: "Keep a Weekly Reflection Journal",
      description: "One page every Friday on what went well and the one thing to change next week",
      category: "Personal & Social Skills"
    },
    {
      title: "Mentor a Younger Student",
      description: "Meet my Grade 6 buddy fortnightly and help them settle into the school year",
      category: "Personal & Social Skills"
    },
    {
      title: "Present a Reflective Essay on Group Work",
      description: "Write honestly about the project that went wrong and what my part in it was",
      category: "Academic"
    }
  ],
  "Engaged Community Member": [
    {
      title: "Volunteer at the Community Food Bank",
      description: "Give two Saturday mornings a month across the spring semester",
      category: "Personal & Social Skills"
    },
    {
      title: "Run a Science Stall for the Middle School",
      description: "Design three demonstrations and present them to the visiting Grade 7 classes",
      category: "Academic"
    },
    {
      title: "Stand for the Student Council",
      description: "Write a manifesto on one change worth making and canvass my year group for it",
      category: "Personal & Social Skills"
    }
  ]
};

/** Pillars an admin added themselves have no written goals, so build sensible ones. */
function fallbackGoals(displayTitle: string): GoalSeed[] {
  return [
    {
      title: `Set a Semester Target for ${displayTitle}`,
      description: `Agree with a teacher what good looks like for ${displayTitle} this semester, then work to it`,
      category: "Academic"
    },
    {
      title: `Practise ${displayTitle} Outside Class`,
      description: `Pick one activity a week that builds ${displayTitle} and stay with it to the end of term`,
      category: "Personal & Social Skills"
    }
  ];
}

function goalSeedsFor(pillar: PoagPillar): GoalSeed[] {
  return GOALS_BY_PILLAR[pillar.rubricKey] ?? fallbackGoals(pillar.displayTitle);
}

/**
 * The students in a grade who have set at least one personal goal.
 *
 * Not the whole roster: setting a goal is something a student chooses to do,
 * and a list padded out with every enrolled student who has written nothing
 * would bury the ones who have. The panel says how many of the grade this is.
 */
export function studentGoalsFor(
  schoolId: string,
  grade: string,
  pillars: PoagPillar[]
): StudentGoalRow[] {
  if (pillars.length === 0) return [];

  const roster = gradeRoster(schoolId, grade);
  const enrolled = roster.length;
  // Roughly one in five, held inside a range the table can show without paging.
  const count = Math.max(4, Math.min(24, Math.round(enrolled / 5)));

  /* Taken off the front of the shared roster rather than sampled: that roster
     already leads with the students who have a 360 record, so the names an
     admin can click through to are the ones they meet first. */
  const withGoals = roster.slice(0, count);

  return withGoals.map((entry) => {
    const base = seed(schoolId, grade, entry.name);
    // Two to four goals each: one is not a plan, and beyond four a student is
    // listing wishes rather than working to them.
    const total = 2 + (base % 3);

    const goals: StudentGoal[] = [];
    const usedPillars = new Set<string>();

    for (let index = 0; index < total; index += 1) {
      const key = seed(entry.name, String(index));

      /* One goal per pillar per student: two goals under the same pillar would
         read as a duplicate in the row summary, which lists pillars by name. */
      let pillar = pillars[(key + index) % pillars.length];
      for (let step = 1; usedPillars.has(pillar.rubricKey) && step <= pillars.length; step += 1) {
        pillar = pillars[(key + index + step) % pillars.length];
      }
      usedPillars.add(pillar.rubricKey);

      const seeds = goalSeedsFor(pillar);
      const goalSeed = seeds[key % seeds.length];
      const byStudent = key % 3 !== 0;

      goals.push({
        id: `sg-${schoolId}-${grade}-${entry.name.replace(/\s+/g, "-").toLowerCase()}-${index}`,
        title: goalSeed.title,
        description: goalSeed.description,
        category: goalSeed.category,
        pillarKey: pillar.rubricKey,
        pillarTitle: pillar.displayTitle,
        due: DUE_DATES[(key >> 2) % DUE_DATES.length],
        /* Index folded in as well as the hash: without it a student's whole
           set lands on one status often enough to look like a bug — four goals
           all reading Achieved, then a row saying "4 of 4 achieved". */
        status:
          STUDENT_GOAL_STATUSES[((key >> 5) + index * 2) % STUDENT_GOAL_STATUSES.length],
        setBy: byStudent ? entry.name : FACULTY[key % FACULTY.length],
        setByRole: byStudent ? "Student" : "Faculty"
      });
    }

    // Soonest first: the goal with the nearest deadline is the live one.
    /* Soonest first, and undated last rather than first: "" sorts before every
       real date, which would put a goal with no deadline at the top of a list
       ordered by urgency. */
    goals.sort((a, b) => {
      if (a.due === "" || b.due === "") return a.due === "" ? 1 : -1;
      return a.due.localeCompare(b.due);
    });

    return { id: entry.id, studentName: entry.name, personId: entry.personId, goals };
  });
}

/** How many students the grade holds, for the "N of M have set goals" line. */
export function gradeStudentCount(schoolId: string, grade: string): number {
  return studentsInGrade(schoolId, grade);
}

/** Progress across one student's goals, for the collapsed row. */
export function goalProgress(goals: StudentGoal[]): {
  achieved: number;
  underway: number;
  notStarted: number;
} {
  return {
    achieved: goals.filter((goal) => goal.status === "Achieved").length,
    underway: goals.filter(
      (goal) => goal.status !== "Achieved" && goal.status !== "Not started"
    ).length,
    notStarted: goals.filter((goal) => goal.status === "Not started").length
  };
}

/** Status tone for the badge — the same five steps, read as progress. */
export function goalStatusTone(status: StudentGoalStatus): "ok" | "warn" | "neutral" {
  if (status === "Achieved") return "ok";
  if (status === "Not started") return "neutral";
  return "warn";
}
