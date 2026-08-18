/**
 * Goal templates — the starting points offered in the Set a goal drawer.
 *
 * A template used to be a name and nothing else: three hardcoded strings that
 * copied themselves into the Goal name field and left every other field blank.
 * That is a shortcut for typing, not a template. A template here carries the
 * whole shape of a goal an admin sets repeatedly — what it is called, what it
 * describes, its category, and how it is measured — so picking one fills the form
 * rather than the first line of it.
 *
 * They are district-wide, which is why they are managed in System Settings rather
 * than on a grade's own screen: the same template is what makes two schools'
 * attendance goals comparable.
 *
 * Draft templates are not offered in the drawer. A half-written template that
 * silently pre-filled a real goal would be worse than no template at all.
 *
 * TODO: replace with the real Admin DB Academic Goals contract.
 */

import type { GoalMeasurement } from "./academicGoals";

export type GoalTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  measurement: GoalMeasurement;
  /** Only published templates appear in the drawer. */
  published: boolean;
  /**
   * Where it is already in use. Counted from live goals once the contract
   * exists; a figure an admin reads before editing a template, never types.
   */
  usage: string;
};

export const seedGoalTemplates: GoalTemplate[] = [
  {
    id: "gt-1",
    title: "Personalized Own Academic Goal (POAG): Semester",
    description: "Student-authored goal reviewed with an advisor at the start of each semester.",
    category: "Academic achievement",
    measurement: { type: "manual" },
    published: true,
    usage: "Used by 4 schools · 1,204 active goals"
  },
  {
    id: "gt-2",
    title: "Attendance improvement plan",
    description: "Structured goal for students below 85% attendance.",
    category: "Attendance & engagement",
    measurement: { type: "manual" },
    published: true,
    usage: "Used by 5 schools · 218 active goals"
  },
  {
    /* An auto template, so the type is reachable from a template and not only by
       filling the measurement section by hand every time. */
    id: "gt-3",
    title: "Reach Applying in Critical Thinking",
    description:
      "Measured on the Mathematics rating — reasoning through an unfamiliar problem.",
    category: "Academic achievement",
    measurement: {
      type: "auto",
      pillarKey: "Critical Thinker & Problem Solver",
      requiredLevel: "Applying",
      subjectId: "sub-math"
    },
    published: true,
    usage: "Used by 2 schools · 240 active goals"
  },
  {
    id: "gt-4",
    title: "Post-secondary readiness",
    description: "Grade 12 goal covering applications, testing, and portfolio milestones.",
    category: "Academic achievement",
    measurement: { type: "manual" },
    published: false,
    usage: "Not yet published"
  }
];
