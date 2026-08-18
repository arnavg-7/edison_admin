/**
 * Goals, as the Goals Rulebook (R1) defines them.
 *
 * The rulebook's key principle is that two things people conflate are separate
 * fields on one record: WHO CREATED a goal decides permissions, and HOW IT IS
 * MEASURED decides tracking. Any creator can use either measurement type. So
 * there is one `Goal` shape here, not an admin kind and a student kind — an
 * admin goal and a student goal differ by `creatorRole` and `scopeType`, and a
 * manual goal and an auto goal by `measurementType`. Screens that show one and
 * not the other are views over this, never separate models (Sheet 1).
 *
 * Three tables, kept apart as Sheet 9 requires:
 *
 *   Goal            the definition — title, scope, target, window
 *   GoalAssignment  one row per student the goal resolved to
 *   GoalProgress    append-only status history, the source of truth
 *
 * `GoalAssignment.currentStatus` is denormalised for query speed; the trail in
 * GoalProgress is what actually happened. Never overwrite a progress row — the
 * rulebook calls this out as not retrofittable, because it is what makes
 * progress-over-time reporting possible later.
 *
 * TODO: replace with real reads once the Admin DB goals contract exists.
 * Assignments and statuses are derived deterministically from the goal and the
 * student so a board shows the same figures on every render.
 */

import { classesByGrade, schools } from "./schools";
import { gradeRoster, rosterSeed, type RosterStudent } from "./studentRoster";
import { seedPoagPillars, seedPoagLevels } from "./poag";

/* ── Vocabulary (Sheet 8) ─────────────────────────────────────────────── */

/**
 * Fixed in R1 — no custom per-district labels.
 *
 * `Archived` is the odd one out: it applies to a goal rather than to one
 * student's progress, and only the creator sets it. It lives here because the
 * rulebook lists it with the others, but an assignment never carries it —
 * archiving is `Goal.isActive = false`, which keeps the history and drops the
 * goal out of live rollups.
 */
export const MANUAL_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Not Met",
  "Archived"
] as const;
export type ManualStatus = (typeof MANUAL_STATUSES)[number];

/** What one student's manual progress can actually be. */
export const MANUAL_ASSIGNMENT_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Not Met"
] as const;

/** Every auto status is system-computed. No person sets these. */
export const AUTO_STATUSES = ["On Track", "At Risk", "Met", "Not Met"] as const;
export type AutoStatus = (typeof AUTO_STATUSES)[number];

export type GoalStatus = ManualStatus | AutoStatus;

/** Who may set it, for the UI to read rather than re-deriving. */
export const STATUS_SET_BY: Record<string, string> = {
  "Not Started": "System, on assignment",
  "In Progress": "Admin, faculty or student, per permissions",
  Completed: "Admin, faculty or student, per permissions",
  "Not Met": "Admin or faculty, or the system at the end date",
  Archived: "The creator only",
  "On Track": "System (computed)",
  "At Risk": "System (computed)",
  Met: "System (computed)"
};

export function statusesFor(measurement: MeasurementType): readonly GoalStatus[] {
  return measurement === "auto" ? AUTO_STATUSES : MANUAL_ASSIGNMENT_STATUSES;
}

/**
 * Whether a status counts towards a rollup (Sheet 7).
 *
 * Manual: only `Completed`. In Progress and Not Started both count as not met —
 * a goal half-done is not a goal met, and softening that would flatter every
 * figure on the board. Auto: On Track and Met both clear the threshold, the
 * first during the window and the second at evaluation.
 */
export function countsAsMet(status: GoalStatus): boolean {
  return status === "Completed" || status === "Met" || status === "On Track";
}

export function statusTone(status: GoalStatus): "ok" | "warn" | "error" | "neutral" {
  if (status === "Completed" || status === "Met" || status === "On Track") return "ok";
  if (status === "In Progress" || status === "At Risk") return "warn";
  if (status === "Not Met") return "error";
  return "neutral";
}

/* ── Record shapes (Sheet 9) ──────────────────────────────────────────── */

export const CREATOR_ROLES = ["district_admin", "school_admin", "faculty", "student"] as const;
export type CreatorRole = (typeof CREATOR_ROLES)[number];

export const CREATOR_ROLE_LABELS: Record<CreatorRole, string> = {
  district_admin: "District admin",
  school_admin: "School admin",
  faculty: "Faculty",
  student: "Student"
};

export const SCOPE_TYPES = ["district", "school", "grade", "class", "student"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

export const SCOPE_TYPE_LABELS: Record<ScopeType, string> = {
  district: "District",
  school: "School",
  grade: "Grade",
  class: "Class",
  student: "Individual student"
};

export type MeasurementType = "manual" | "auto";
export type TargetOperator = "gte" | "lte" | "eq";

export const TARGET_OPERATOR_LABELS: Record<TargetOperator, string> = {
  gte: "at least",
  lte: "at most",
  eq: "exactly"
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  /** Display name of the creator. TODO: users.sourcedId. */
  createdBy: string;
  creatorRole: CreatorRole;
  scopeType: ScopeType;
  /**
   * The thing scoped to: a school id, a grade key (`schoolId:grade`), a class
   * id, or a student id. Null-ish only for district, which needs no id.
   */
  scopeId: string;
  measurementType: MeasurementType;
  /**
   * Null when manual. The rulebook wants new metrics addable as configuration
   * rather than code, so the pillar rides inside the key —
   * `poag_level.Critical Thinker & Problem Solver` — rather than becoming a
   * second column that only POAG would ever use.
   */
  metricKey: string | null;
  targetOperator: TargetOperator | null;
  targetValue: string | null;
  /** academicSessions.sourcedId. */
  academicSessionId: string;
  startDate: string;
  endDate: string;
  /** Soft delete. False means archived: history kept, out of live rollups. */
  isActive: boolean;
};

export type GoalAssignment = {
  id: string;
  goalId: string;
  /** Always a student. Never a faculty id (Sheet 4, A2). */
  studentId: string;
  studentName: string;
  /** Set when the student has a 360 profile to link through to. */
  personId: string | null;
  /** The class it was assigned in; null for district, school and grade scope. */
  classId: string | null;
  /** Denormalised for speed. GoalProgress is the source of truth. */
  currentStatus: GoalStatus;
  /** False once the student leaves the scope — never deleted (A4). */
  isActive: boolean;
  /** Which school and grade this student sits in, for rollup breakdowns. */
  schoolId: string;
  grade: string;
};

export type GoalProgress = {
  id: string;
  assignmentId: string;
  previousStatus: GoalStatus | null;
  newStatus: GoalStatus;
  /** users.sourcedId, or "system" for auto goals and end-date closes. */
  changedBy: string;
  changedAt: string;
  note: string | null;
};

/* ── Academic sessions ────────────────────────────────────────────────── */

// TODO: read academicSessions.csv. The Reporting calendar in academicCalendar
// stops at the 2025–26 year, and a goal window has to be a session id rather
// than a typed-in name, so the current year's sessions are named here.
export const GOAL_SESSIONS = [
  { id: "2026-fall", label: "Fall 2026", start: "2026-08-24", end: "2026-12-18" },
  { id: "2027-spring", label: "Spring 2027", start: "2027-01-05", end: "2027-06-11" },
  { id: "2026-full", label: "Full year 2026–27", start: "2026-08-24", end: "2027-06-11" }
];

export function sessionLabel(id: string): string {
  return GOAL_SESSIONS.find((session) => session.id === id)?.label ?? id;
}

/* ── Auto metrics (Sheet 3) ───────────────────────────────────────────── */

/**
 * Every metric R1 can actually evaluate.
 *
 * POAG level only. Attendance and grades are in the rulebook as "build engine,
 * do not activate" — both feeds are empty in the current Genesis export — so
 * they are absent here rather than offered and inert. A goal nobody can
 * evaluate is worse than a goal nobody can create.
 */
export const AUTO_METRICS = seedPoagPillars.map((pillar) => ({
  key: `poag_level.${pillar.rubricKey}`,
  label: `POAG level · ${pillar.displayTitle}`,
  pillarTitle: pillar.displayTitle,
  /** Target values are the live rating scale. */
  values: seedPoagLevels
}));

export function metricLabel(metricKey: string | null): string | null {
  if (!metricKey) return null;
  return AUTO_METRICS.find((metric) => metric.key === metricKey)?.label ?? metricKey;
}

/** The pillar a POAG metric names, for showing it as a chip. */
export function metricPillar(metricKey: string | null): string | null {
  if (!metricKey?.startsWith("poag_level.")) return null;
  return metricKey.slice("poag_level.".length);
}

/** "POAG level · Critical Thinking reaches at least Applying". */
export function targetSentence(goal: Goal): string | null {
  if (goal.measurementType !== "auto" || !goal.metricKey) return null;
  const operator = goal.targetOperator ? TARGET_OPERATOR_LABELS[goal.targetOperator] : "at least";
  return `${metricLabel(goal.metricKey)} reaches ${operator} ${goal.targetValue}`;
}

/* ── Scope ────────────────────────────────────────────────────────────── */

export function gradeScopeId(schoolId: string, grade: string): string {
  return `${schoolId}:${grade}`;
}

/** Which students a scope resolves to, per Sheet 4 A1 and Sheet 5 F3. */
export function studentsInScope(goal: Goal): {
  student: RosterStudent;
  schoolId: string;
  grade: string;
  classId: string | null;
}[] {
  const out: { student: RosterStudent; schoolId: string; grade: string; classId: string | null }[] =
    [];

  const pushGrade = (schoolId: string, grade: string, classId: string | null) => {
    for (const student of gradeRoster(schoolId, grade)) {
      out.push({ student, schoolId, grade, classId });
    }
  };

  if (goal.scopeType === "district") {
    for (const school of schools) for (const grade of school.grades) pushGrade(school.id, grade, null);
    return out;
  }

  if (goal.scopeType === "school") {
    const school = schools.find((entry) => entry.id === goal.scopeId);
    if (school) for (const grade of school.grades) pushGrade(school.id, grade, null);
    return out;
  }

  if (goal.scopeType === "grade") {
    const [schoolId, grade] = goal.scopeId.split(":");
    if (schoolId && grade) pushGrade(schoolId, grade, null);
    return out;
  }

  if (goal.scopeType === "class") {
    /* A class-scoped goal assigns to every student currently enrolled in that
       class. TODO: real enrolment. Students are dealt round-robin across their
       grade's classes so a class holds a stable, plausible subset. */
    for (const school of schools) {
      for (const grade of school.grades) {
        const classes = classesByGrade[grade] ?? [];
        const index = classes.findIndex((entry) => entry.id === goal.scopeId);
        if (index < 0) continue;
        const roster = gradeRoster(school.id, grade);
        roster.forEach((student, position) => {
          if (position % classes.length === index) {
            out.push({ student, schoolId: school.id, grade, classId: goal.scopeId });
          }
        });
      }
    }
    return out;
  }

  // Individual student. Found by walking the rosters, since a student id alone
  // does not say which grade they are in.
  for (const school of schools) {
    for (const grade of school.grades) {
      const student = gradeRoster(school.id, grade).find((entry) => entry.id === goal.scopeId);
      if (student) {
        out.push({ student, schoolId: school.id, grade, classId: null });
        return out;
      }
    }
  }
  return out;
}

export function scopeLabel(goal: Goal): string {
  if (goal.scopeType === "district") return "Whole district";

  if (goal.scopeType === "school") {
    return schools.find((entry) => entry.id === goal.scopeId)?.name ?? "Unknown school";
  }

  if (goal.scopeType === "grade") {
    const [schoolId, grade] = goal.scopeId.split(":");
    const school = schools.find((entry) => entry.id === schoolId);
    return `Grade ${grade} · ${school?.name ?? "Unknown school"}`;
  }

  if (goal.scopeType === "class") {
    for (const grade of Object.keys(classesByGrade)) {
      const found = classesByGrade[grade].find((entry) => entry.id === goal.scopeId);
      if (found) return found.name;
    }
    return "Unknown class";
  }

  return studentsInScope(goal)[0]?.student.name ?? "Unknown student";
}

/** The school a goal belongs to, or null for a district goal — for scoping. */
export function goalSchoolId(goal: Goal): string | null {
  if (goal.scopeType === "district") return null;
  if (goal.scopeType === "school") return goal.scopeId;
  if (goal.scopeType === "grade") return goal.scopeId.split(":")[0] ?? null;
  return studentsInScope(goal)[0]?.schoolId ?? null;
}

/* ── Assignments (Sheet 4 A1–A4, Sheet 9) ─────────────────────────────── */

/**
 * Statuses are derived, not stored, until there is a real table behind this.
 *
 * OPEN DECISION for Edison: a POAG-measured goal needs a subject to read the
 * level from, because POAG ratings are held per class/subject and the handoff
 * spec defines no cross-subject rollup. Until that is settled, an auto status
 * here is derived rather than read from the POAG record, so no screen implies a
 * rule nobody has agreed. Everything else about auto goals is real.
 */
function derivedStatus(goal: Goal, studentId: string): GoalStatus {
  const key = rosterSeed(goal.id, studentId);

  if (goal.measurementType === "auto") {
    const roll = key % 10;
    if (roll < 5) return "On Track";
    if (roll < 7) return "At Risk";
    if (roll < 9) return "Met";
    return "Not Met";
  }

  /* Weighted: a goal a cohort is part-way through is the normal case, and three
     equal buckets made every goal on the board look identical. */
  const roll = key % 10;
  if (roll < 3) return "Not Started";
  if (roll < 7) return "In Progress";
  if (roll < 9) return "Completed";
  return "Not Met";
}

const assignmentCache = new Map<string, GoalAssignment[]>();

/**
 * Every student a goal resolved to.
 *
 * A4: a student who leaves the scope keeps their history and stops counting in
 * live rollups — the assignment goes inactive, it is never deleted. A thin
 * slice is marked inactive here so the rollups can be seen excluding them.
 */
export function assignmentsFor(goal: Goal): GoalAssignment[] {
  const cached = assignmentCache.get(goal.id);
  if (cached) return cached;

  const rows = studentsInScope(goal).map(({ student, schoolId, grade, classId }) => {
    const key = rosterSeed(goal.id, student.name, "active");
    return {
      id: `ga-${goal.id}-${student.id}`,
      goalId: goal.id,
      studentId: student.id,
      studentName: student.name,
      personId: student.personId,
      classId,
      currentStatus: derivedStatus(goal, student.id),
      // TODO: real value is "still enrolled in the scope". ~4% transferred out.
      isActive: key % 25 !== 0,
      schoolId,
      grade
    };
  });

  assignmentCache.set(goal.id, rows);
  return rows;
}

/** One student's assignment on one goal, or null if they are not in scope. */
export function assignmentFor(goal: Goal, studentName: string): GoalAssignment | null {
  return assignmentsFor(goal).find((row) => row.studentName === studentName) ?? null;
}

/* ── Progress history (Sheet 8 HISTORY RULE) ──────────────────────────── */

// TODO: real actors come from users.csv, joined through the class's primary
// teacher. Fixed timestamps, not offsets from today: a date computed from the
// clock renders differently on the server and the client.
const ACTORS = ["Ms. A. Rivera", "Mr. D. Okafor", "Ms. L. Chen", "Mr. P. Kaur", "Ms. R. Bhatt"];

const CHANGED_AT = [
  "2026-08-17T09:12:00-04:00",
  "2026-08-11T14:35:00-04:00",
  "2026-08-04T11:05:00-04:00",
  "2026-07-28T08:48:00-04:00"
];

const NOTES = [
  "Checked in during advisory. Working through the second unit.",
  "Evidence reviewed with the student; on track for the term.",
  "Discussed at the parent meeting — plan agreed for the next four weeks.",
  "Student reported this themselves at the mid-term review.",
  null
];

/**
 * How an assignment reached its current status.
 *
 * Append-only and newest first. A goal starts at Not Started, set by the system
 * on assignment (Sheet 8), so every trail ends on that row — an assignment with
 * no history at all would be a record with no beginning.
 */
export function progressFor(goal: Goal, assignment: GoalAssignment): GoalProgress[] {
  const key = rosterSeed(assignment.id, "progress");
  const auto = goal.measurementType === "auto";
  const opening: GoalStatus = auto ? "On Track" : "Not Started";

  /* The route this assignment took, oldest first and with no repeats — a row
     saying In Progress became In Progress is not a status change, and the
     history must only hold real ones. */
  const path: GoalStatus[] = [opening];
  const step = (status: GoalStatus) => {
    if (path[path.length - 1] !== status) path.push(status);
  };

  if (auto) {
    // An auto goal's value moves on its own, so it can pass through At Risk.
    if (key % 3 === 0) step("At Risk");
  } else if (assignment.currentStatus !== "Not Started") {
    step("In Progress");
  }
  step(assignment.currentStatus);

  const rows: GoalProgress[] = [
    {
      id: `gp-${assignment.id}-0`,
      assignmentId: assignment.id,
      previousStatus: null,
      newStatus: opening,
      changedBy: "system",
      changedAt: CHANGED_AT[CHANGED_AT.length - 1],
      note: auto ? "First evaluation against the target." : "Assigned to the student."
    }
  ];

  for (let index = 1; index < path.length; index += 1) {
    const stepKey = rosterSeed(assignment.id, String(index));
    rows.push({
      id: `gp-${assignment.id}-${index}`,
      assignmentId: assignment.id,
      previousStatus: path[index - 1],
      newStatus: path[index],
      // Auto goals are moved by the engine, never by a person.
      changedBy: auto ? "system" : ACTORS[stepKey % ACTORS.length],
      changedAt: CHANGED_AT[Math.max(0, CHANGED_AT.length - 1 - index)],
      note: auto ? null : NOTES[stepKey % NOTES.length]
    });
  }

  // Newest first: the change an admin cares about is the last one made.
  return rows.reverse();
}

/* ── Rollup (Sheet 7) ─────────────────────────────────────────────────── */

export type Rollup = {
  met: number;
  /** Active assignments only — inactive are out of numerator and denominator. */
  total: number;
  pct: number;
  /** Auto goals only: how far, not just how many. */
  mean: number | null;
  inactive: number;
};

/**
 * A rollup over a set of assignments.
 *
 * CRITICAL RULE from the rulebook: always aggregate upward from individual
 * student records, never average the level below. A 12-student class and a
 * 30-student class must not carry equal weight in a school figure, which is
 * exactly what averaging percentages would do. So every level calls this with a
 * flat list of student assignments — there is no per-level arithmetic to get
 * wrong.
 */
export function rollup(goal: Goal, rows: GoalAssignment[]): Rollup {
  const active = rows.filter((row) => row.isActive);
  const met = active.filter((row) => countsAsMet(row.currentStatus)).length;

  /* The % answers "how many"; the mean answers "by how much". Only meaningful
     for auto goals, where there is an underlying measured value — a manual
     status has no magnitude to average. */
  const mean =
    goal.measurementType === "auto" && active.length > 0
      ? active.reduce((sum, row) => sum + rosterSeed(row.id, "metric") % 100, 0) / active.length / 25
      : null;

  return {
    met,
    total: active.length,
    pct: active.length === 0 ? 0 : (met / active.length) * 100,
    mean,
    inactive: rows.length - active.length
  };
}

export type RollupBreakdown = { key: string; label: string; rollup: Rollup };

/** The level below, each aggregated from its own students. */
export function breakdownFor(goal: Goal, level: "school" | "grade" | "class"): RollupBreakdown[] {
  const rows = assignmentsFor(goal);
  const groups = new Map<string, GoalAssignment[]>();

  for (const row of rows) {
    const key =
      level === "school" ? row.schoolId : level === "grade" ? `${row.schoolId}:${row.grade}` : (row.classId ?? "none");
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  return [...groups.entries()]
    .map(([key, group]) => ({
      key,
      label:
        level === "school"
          ? (schools.find((entry) => entry.id === key)?.name ?? key)
          : level === "grade"
            ? `Grade ${key.split(":")[1]}`
            : key,
      rollup: rollup(goal, group)
    }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}

/**
 * The mean of an auto goal's underlying metric, as a level rather than a number.
 *
 * "mean 2.4" says nothing on its own; "≈ Applying" is the thing an admin can act
 * on. The figure is kept beside it because that is the whole point of a mean next
 * to a percentage — they answer different questions: how many cleared the bar,
 * and how far along everyone is.
 */
export function meanLevelLabel(mean: number): string {
  const index = Math.min(seedPoagLevels.length - 1, Math.max(0, Math.round(mean)));
  return seedPoagLevels[index];
}

/**
 * Which level a goal breaks down into.
 *
 * One step down from the scope, not every level at once: a district goal's next
 * question is "which school", and a school goal's is "which grade". A class or
 * individual goal has nothing below it worth grouping.
 */
export function breakdownLevelFor(goal: Goal): "school" | "grade" | null {
  if (goal.scopeType === "district") return "school";
  if (goal.scopeType === "school") return "grade";
  return null;
}

/* ── Permissions (Sheet 2) ────────────────────────────────────────────── */

/**
 * Who the signed-in admin is, as far as the matrix is concerned.
 *
 * `schoolId` null means the district office. Faculty and student actors are not
 * modelled: this is the admin portal, and inventing a faculty session here
 * would let a screen claim an authorisation nobody checked.
 */
export type AdminActor = { role: "district_admin" | "school_admin"; schoolId: string | null };

/** Scope levels this actor may create at (Sheet 2, rows 1–5). */
export function creatableScopes(actor: AdminActor): ScopeType[] {
  // District-wide is the superintendent's office only.
  return actor.role === "district_admin"
    ? [...SCOPE_TYPES]
    : ["school", "grade", "class", "student"];
}

/**
 * May this actor edit the goal's definition — title, target, dates?
 *
 * "Creator owns the definition. Admins may edit goals created at a level below
 * them." So a district admin may edit a school admin's goal; a school admin may
 * not edit the district's (Open decision Q1: view and report only, escalate).
 * Faculty- and student-created goals are never editable by an admin, and the
 * student case is the hardest rule in the book.
 */
export function canEditDefinition(actor: AdminActor, goal: Goal): boolean {
  if (goal.creatorRole === "student" || goal.creatorRole === "faculty") return false;
  if (actor.role === "district_admin") return true;
  // School admin: their own school's goals, never the district's.
  if (goal.creatorRole === "district_admin") return false;
  return goalSchoolId(goal) === actor.schoolId;
}

/**
 * May this actor set a student's status on this goal?
 *
 * Broader than editing: an admin may advance progress on admin- and
 * faculty-created goals. Never on a student-authored one — Sheet 5 F6 spells
 * out that staff "cannot edit or re-status" those, and Sheet 2 calls them
 * read-only to all others. That is the rule protecting student ownership.
 *
 * Auto goals are excluded whoever is asking: the engine computes those, and a
 * hand-set value would be overwritten at the next evaluation.
 */
export function canSetStatus(actor: AdminActor, goal: Goal): boolean {
  if (goal.measurementType === "auto") return false;
  if (goal.creatorRole === "student") return false;
  if (actor.role === "district_admin") return true;
  return goalSchoolId(goal) === actor.schoolId;
}

/** Archive is a definition-level act, so it follows the same rule. */
export function canArchive(actor: AdminActor, goal: Goal): boolean {
  return canEditDefinition(actor, goal);
}

/** Why an action is unavailable, for the UI to say rather than just disable. */
export function whyReadOnly(actor: AdminActor, goal: Goal): string | null {
  if (goal.creatorRole === "student") {
    return "Student-authored goals are read-only to staff.";
  }
  if (goal.creatorRole === "faculty") {
    return "Created by faculty — only its author may change the definition.";
  }
  if (actor.role === "school_admin" && goal.creatorRole === "district_admin") {
    return "Set by the district office. View and report only.";
  }
  if (goalSchoolId(goal) !== null && goalSchoolId(goal) !== actor.schoolId && actor.role === "school_admin") {
    return "Belongs to another school.";
  }
  return null;
}

/** Visibility: broad, unlike editing. A school admin sees all in their school. */
export function visibleTo(actor: AdminActor, goal: Goal): boolean {
  if (actor.role === "district_admin") return true;
  const schoolId = goalSchoolId(goal);
  // A district-wide goal covers their school's students, so they see it.
  return schoolId === null || schoolId === actor.schoolId;
}

/* ── Seeds ────────────────────────────────────────────────────────────── */

type Seed = Omit<Goal, "id" | "isActive"> & { key: string; isActive?: boolean };

/* Deliberately spread across all five scope levels and both measurement types,
   and across all four creator roles — the permission rules are most of what
   this screen is, and they cannot be seen at all with one kind of goal. */
const SEEDS: Seed[] = [
  {
    key: "district-reading",
    title: "Read six books outside the syllabus",
    description:
      "Every student keeps a short written response to each and shares two with their class.",
    createdBy: "District Office",
    creatorRole: "district_admin",
    scopeType: "district",
    scopeId: "",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-full",
    startDate: "2026-08-24",
    endDate: "2027-06-11"
  },
  {
    key: "district-critical-thinking",
    title: "Reach Applying in Critical Thinking",
    description:
      "District Portrait of a Graduate priority for the year. Measured from the POAG rating, not reported by hand.",
    createdBy: "District Office",
    creatorRole: "district_admin",
    scopeType: "district",
    scopeId: "",
    measurementType: "auto",
    metricKey: "poag_level.Critical Thinker & Problem Solver",
    targetOperator: "gte",
    targetValue: "Applying",
    academicSessionId: "2026-full",
    startDate: "2026-08-24",
    endDate: "2027-06-11"
  },
  {
    key: "ehs-attendance-plan",
    title: "Attendance improvement plan",
    description: "Structured goal for students below 85% attendance last semester.",
    createdBy: "R. Whitmore",
    creatorRole: "school_admin",
    scopeType: "school",
    scopeId: "edison-hs",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "ehs-communication",
    title: "Reach Building in Effective Communication",
    description: "School-wide focus following the spring review of the Portrait of a Graduate.",
    createdBy: "R. Whitmore",
    creatorRole: "school_admin",
    scopeType: "school",
    scopeId: "edison-hs",
    measurementType: "auto",
    metricKey: "poag_level.Effective Communicator",
    targetOperator: "gte",
    targetValue: "Building",
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "ehs-10-own-goal",
    title: "Write and review one personal academic goal",
    description: "Each student drafts a goal and reviews it with their advisor in the first month.",
    createdBy: "R. Whitmore",
    creatorRole: "school_admin",
    scopeType: "grade",
    scopeId: "edison-hs:10",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "ehs-9-study-skills",
    title: "Complete the study skills programme",
    description: "Six sessions across the first semester, run through homeroom.",
    createdBy: "District Office",
    creatorRole: "district_admin",
    scopeType: "grade",
    scopeId: "edison-hs:9",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "geo-a-mastery",
    title: "Master coordinate geometry proofs",
    description: "Every student completes the proof set and re-sits any question they missed.",
    createdBy: "Mr. D. Okafor",
    creatorRole: "faculty",
    scopeType: "class",
    scopeId: "geo-a",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "chem-a-lab",
    title: "Write up every lab within a week",
    description: "Turn each practical into a written record while the results are still fresh.",
    createdBy: "Ms. L. Chen",
    creatorRole: "faculty",
    scopeType: "class",
    scopeId: "chem-a",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "michael-portfolio",
    title: "Complete art portfolio for college applications",
    description:
      "Create 12-15 original pieces showcasing range in mediums and styles for art school applications.",
    createdBy: "Michael Andrew",
    creatorRole: "student",
    scopeType: "student",
    scopeId: "michael-andrew",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-full",
    startDate: "2026-08-24",
    endDate: "2027-06-11"
  },
  {
    key: "michael-speaking",
    title: "Join public speaking club",
    description: "Attend weekly meetings and deliver at least 3 presentations to build confidence.",
    createdBy: "Michael Andrew",
    creatorRole: "student",
    scopeType: "student",
    scopeId: "michael-andrew",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "nick-resilience",
    title: "Develop a time management system",
    description:
      "Create and follow a weekly planner to balance academics, art projects, and extracurriculars.",
    createdBy: "Ms. R. Bhatt",
    creatorRole: "faculty",
    scopeType: "student",
    scopeId: "nick-johnson",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "ems-numeracy",
    title: "Close the numeracy gap by one grade level",
    description: "Middle school priority carried over from the spring diagnostic.",
    createdBy: "District Office",
    creatorRole: "district_admin",
    scopeType: "school",
    scopeId: "edison-ms",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18"
  },
  {
    key: "ehs-archived-pilot",
    title: "Weekly reading log pilot",
    description: "Withdrawn after four weeks — replaced by the district reading goal.",
    createdBy: "R. Whitmore",
    creatorRole: "school_admin",
    scopeType: "grade",
    scopeId: "edison-hs:11",
    measurementType: "manual",
    metricKey: null,
    targetOperator: null,
    targetValue: null,
    academicSessionId: "2026-fall",
    startDate: "2026-08-24",
    endDate: "2026-12-18",
    isActive: false
  }
];

export const seedGoals: Goal[] = SEEDS.map(({ key, isActive, ...rest }) => ({
  id: `goal-${key}`,
  isActive: isActive ?? true,
  ...rest
}));
