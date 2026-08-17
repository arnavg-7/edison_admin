// TODO: replace with the real Admin DB skills-and-development contract.
//
// Content is scoped per school AND per grade (changed 2026-08-03). Previously
// it was one dataset per school level (HS / KG); an admin now picks a school,
// then a grade within it, and edits that grade's areas and skills.
//
// SCOPE FLAG — the committed scope now names HS only (brief §8 item 6). The
// Kindergarten Center and its seeded content were removed on request
// (2026-08-03) along with the school itself in schools.ts. Genesis lists four
// schools now, so all four appear in the picker, but only Edison High School
// has seeded content. Grades at the elementary and middle schools open empty
// and say so. They are out of scope, not broken, and filling them is a scope
// decision.
//
// Two things previously in this section were removed on request and are not
// gaps to fill: the HS/KG layout & branding editors (2026-07-17) and the
// Faculty Dashboard component toggles (2026-08-03). Both are listed in the
// screen inventory, so re-adding either is a scope change.

import { schools, scopeKey } from "./schools";

/**
 * Development areas are two levels: an area is the coloured heading a student
 * sees (Strengths, Room To Grow…) and it holds the individual skills listed
 * under it.
 *
 * The faculty portal colours these cards by :nth-child, which silently
 * reassigns colours when a card is added, removed or reordered. Here the tone
 * is a property of the area, so it survives editing.
 */
export type DevAreaTone = "blue" | "green" | "cyan" | "orange" | "violet" | "rose";

export type DevAreaIcon = "check" | "bolt" | "smile" | "target" | "book" | "star";

export const DEV_AREA_TONES: { value: DevAreaTone; label: string }[] = [
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "cyan", label: "Cyan" },
  { value: "orange", label: "Orange" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" }
];

export const DEV_AREA_ICONS: { value: DevAreaIcon; label: string }[] = [
  { value: "check", label: "Check" },
  { value: "bolt", label: "Bolt" },
  { value: "smile", label: "Smile" },
  { value: "target", label: "Target" },
  { value: "book", label: "Book" },
  { value: "star", label: "Star" }
];

export type DevSkill = {
  id: string;
  label: string;
};

/**
 * What an area is for, and how long it runs. Held per area rather than per
 * grade: a grade can run one area for the full year and another for a single
 * semester, and the two need to say so independently.
 */
export type DevAreaPeriod = {
  /** e.g. "Fall 2026", "Semester 1", "2026–27". */
  name: string;
  /** ISO dates (YYYY-MM-DD), no time component. */
  from: string;
  to: string;
};

export type DevelopmentArea = {
  id: string;
  title: string;
  tone: DevAreaTone;
  icon: DevAreaIcon;
  published: boolean;
  /** Optional: an area can be left undated until its term is decided. */
  period?: DevAreaPeriod;
  /**
   * Subjects this area belongs to, as `subjects.id` from System Settings.
   *
   * Empty means every subject — how the areas that describe a student rather
   * than a course ("Strengths", "Interests") stay, since a strength is not a
   * Maths strength. Scoping an area to Mathematics puts it in front of that
   * subject's teachers and nobody else's, which is what makes "Word Problems"
   * a sensible thing to list under Room To Grow.
   */
  subjectIds: string[];
  skills: DevSkill[];
};

/** Empty subject list means every subject, so an unscoped area matches all. */
export function areaAppliesToSubject(area: DevelopmentArea, subjectId: string): boolean {
  return area.subjectIds.length === 0 || area.subjectIds.includes(subjectId);
}

/**
 * Skills profile is also two levels, but unlike development areas the colour
 * belongs to the sub-skill rather than the group: each sub-skill is rated
 * High / Middle / Elementary and the pill takes its colour from that rating.
 * Groups are plain white cards.
 */
export type SkillLevel = "high" | "middle" | "elementary";

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "high", label: "High Skill" },
  { value: "middle", label: "Middle Skill" },
  { value: "elementary", label: "Elementary Skill" }
];

export type SubSkill = {
  id: string;
  label: string;
  level: SkillLevel;
  /** Shown on hover/focus of the pill. */
  description: string;
};

export type SkillGroup = {
  id: string;
  title: string;
  published: boolean;
  subSkills: SubSkill[];
};

/** One configurable scope: a single grade at a single school. */
export type GradeScope = {
  schoolId: string;
  schoolName: string;
  grade: string;
  /** Whether this grade is inside the committed HS/KG scope. */
  inScope: boolean;
};

/** HS only — Kindergarten removed 2026-08-03 along with the school itself. */
const IN_SCOPE_SCHOOLS = new Set(["edison-hs"]);

export function isSchoolInScope(schoolId: string): boolean {
  return IN_SCOPE_SCHOOLS.has(schoolId);
}

export function findGradeScope(schoolId: string, grade: string): GradeScope | null {
  const school = schools.find((entry) => entry.id === schoolId);
  if (!school || !school.grades.includes(grade)) {
    return null;
  }
  return {
    schoolId: school.id,
    schoolName: school.name,
    grade,
    inScope: isSchoolInScope(school.id)
  };
}

/** Every school/grade pair, for route generation and the picker screens. */
export function allGradeScopes(): GradeScope[] {
  return schools.flatMap((school) =>
    school.grades.map((grade) => ({
      schoolId: school.id,
      schoolName: school.name,
      grade,
      inScope: isSchoolInScope(school.id)
    }))
  );
}

// ---------------------------------------------------------------------------
// Seeds
//
// Areas and groups are built from compact seeds so the per-grade datasets stay
// readable. Ids embed the scope key, so two grades never collide even when they
// carry the same area title.
// ---------------------------------------------------------------------------

type AreaSeed = {
  /** Subject ids; omitted means the area applies to every subject. */
  subjectIds?: string[];
  key: string;
  title: string;
  tone: DevAreaTone;
  icon: DevAreaIcon;
  published?: boolean;
  skills: string[];
};

/** Every area in one build shares the term it was configured for. */
function buildAreas(
  scope: string,
  seeds: AreaSeed[],
  period?: DevAreaPeriod
): DevelopmentArea[] {
  return seeds.map((seed) => ({
    id: `da-${scope}-${seed.key}`,
    title: seed.title,
    tone: seed.tone,
    icon: seed.icon,
    published: seed.published ?? true,
    period,
    subjectIds: seed.subjectIds ?? [],
    skills: seed.skills.map((label, index) => ({
      id: `sk-${scope}-${seed.key}-${index}`,
      label
    }))
  }));
}

type GroupSeed = {
  key: string;
  title: string;
  published?: boolean;
  subSkills: [label: string, level: SkillLevel, description: string][];
};

function buildGroups(scope: string, seeds: GroupSeed[]): SkillGroup[] {
  return seeds.map((seed) => ({
    id: `sg-${scope}-${seed.key}`,
    title: seed.title,
    published: seed.published ?? true,
    subSkills: seed.subSkills.map(([label, level, description], index) => ({
      id: `ss-${scope}-${seed.key}-${index}`,
      label,
      level,
      description
    }))
  }));
}

/**
 * Strengths and Room To Grow read the same across the high-school grades — they
 * describe how a student works, not what year they are in. Interests and Future
 * Goals are where the grades actually diverge, so those are per-grade.
 */
const HS_SHARED_AREAS: AreaSeed[] = [
  {
    key: "strengths",
    title: "Strengths",
    tone: "blue",
    icon: "check",
    skills: ["Analytical Thinker", "Problem Solver", "Detail-Oriented"]
  },
  {
    key: "grow",
    title: "Room To Grow",
    tone: "green",
    icon: "bolt",
    /* The one seeded area that is plainly about a course rather than a person:
       "Word Problems" and "Speed in Tests" are Maths, and a Music teacher has
       no view on either. Strengths and Interests stay unscoped. */
    subjectIds: ["sub-math"],
    skills: ["Speed in Tests", "Word Problems", "Time Management"]
  }
];

const HS_GRADE_AREAS: Record<string, AreaSeed[]> = {
  "9": [
    {
      key: "interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      skills: ["Mathematics", "Robotics Club", "Chess"]
    },
    {
      // Ninth-graders have not committed to a pathway yet, so this area exists
      // but is still a draft. It also exercises the Draft badge on this screen.
      key: "goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      published: false,
      skills: ["Explore STEM Electives"]
    }
  ],
  "10": [
    {
      key: "interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      skills: ["Mathematics", "Physics", "Chess"]
    },
    {
      key: "goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      skills: ["Engineering School", "STEM Career", "Research Internship"]
    }
  ],
  "11": [
    {
      key: "interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      skills: ["Physics", "Computer Science", "Debate"]
    },
    {
      key: "goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      skills: ["College Applications", "Summer Research", "AP Coursework"]
    },
    {
      key: "readiness",
      title: "College Readiness",
      tone: "violet",
      icon: "book",
      skills: ["Standardised Testing", "Essay Writing", "Recommendations"]
    }
  ],
  "12": [
    {
      key: "interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      skills: ["Computer Science", "Entrepreneurship", "Debate"]
    },
    {
      key: "goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      skills: ["University Placement", "Apprenticeship", "Gap-Year Plan"]
    },
    {
      key: "transition",
      title: "Transition Skills",
      tone: "rose",
      icon: "star",
      skills: ["Financial Literacy", "Independent Study", "Interviewing"]
    }
  ]
};

/**
 * The six graduate-profile groups. Critical Thinking and Emotionally
 * Intelligent are assessed from grade 10, so at grade 9 they sit unpublished as
 * drafts rather than being absent.
 */
const HS_GROUPS: GroupSeed[] = [
  {
    key: "resilience",
    title: "Resilience",
    subSkills: [
      ["Perseverance", "high", "Keeps working at a problem after early attempts fail."],
      [
        "Flexibility",
        "middle",
        "Accepts change, learns from mistakes, and stays positive in the face of setbacks."
      ],
      ["Adaptability", "elementary", "Adjusts approach when circumstances or expectations shift."]
    ]
  },
  {
    key: "communication",
    title: "Effective Communication",
    subSkills: [
      ["Reasoning", "high", "Builds a clear, evidenced argument others can follow."],
      ["Clarity", "middle", "Expresses ideas concisely in speech and writing."],
      ["Active Listening", "elementary", "Listens to understand before responding."]
    ]
  },
  {
    key: "community",
    title: "Engaged Community Member",
    subSkills: [
      ["Service", "high", "Contributes time and effort to the wider school community."],
      ["Empathy", "middle", "Recognises and responds to how others are feeling."],
      ["Respect", "elementary", "Treats peers and staff with consideration."]
    ]
  },
  {
    key: "lifelong",
    title: "Lifelong Learner",
    subSkills: [
      ["Initiative", "high", "Starts work without being prompted."],
      ["Collaboration", "middle", "Works productively with others toward a shared goal."],
      ["Curiosity", "elementary", "Asks questions and explores beyond what is required."]
    ]
  },
  {
    key: "emotional",
    title: "Emotionally Intelligent",
    subSkills: [
      ["Accountability", "high", "Owns outcomes, including mistakes."],
      ["Self-Regulation", "middle", "Manages impulses and emotions under pressure."],
      ["Self-Awareness", "elementary", "Recognises personal strengths and limits."]
    ]
  },
  {
    key: "critical",
    title: "Critical Thinking",
    subSkills: [
      ["Innovation", "high", "Generates original approaches to open-ended problems."],
      ["Analysis", "middle", "Breaks a problem into parts and evaluates each."],
      ["Reasoning", "elementary", "Draws conclusions that follow from the evidence."]
    ]
  }
];

/** The term the live configuration is running for. */
const CURRENT_TERM: DevAreaPeriod = {
  name: "Fall 2026",
  from: "2026-08-24",
  to: "2026-12-18"
};

function hsAreasFor(grade: string): DevelopmentArea[] {
  const scope = scopeKey("edison-hs", grade);
  return buildAreas(scope, [...HS_SHARED_AREAS, ...(HS_GRADE_AREAS[grade] ?? [])], CURRENT_TERM);
}

function hsGroupsFor(grade: string): SkillGroup[] {
  const scope = scopeKey("edison-hs", grade);
  const draftAtGrade9 = new Set(["emotional", "critical"]);
  return buildGroups(
    scope,
    HS_GROUPS.map((seed) =>
      grade === "9" && draftAtGrade9.has(seed.key) ? { ...seed, published: false } : seed
    )
  );
}

/**
 * Seeded content, keyed by `schoolId:grade`. A missing key means the grade has
 * never been configured — the screen says so rather than showing a bare editor
 * that reads like a loading failure.
 */
export const developmentAreasByGrade: Record<string, DevelopmentArea[]> = {
  [scopeKey("edison-hs", "9")]: hsAreasFor("9"),
  [scopeKey("edison-hs", "10")]: hsAreasFor("10"),
  [scopeKey("edison-hs", "11")]: hsAreasFor("11"),
  [scopeKey("edison-hs", "12")]: hsAreasFor("12")
};

export const skillsProfileByGrade: Record<string, SkillGroup[]> = {
  [scopeKey("edison-hs", "9")]: hsGroupsFor("9"),
  [scopeKey("edison-hs", "10")]: hsGroupsFor("10"),
  [scopeKey("edison-hs", "11")]: hsGroupsFor("11"),
  [scopeKey("edison-hs", "12")]: hsGroupsFor("12")
};

export function developmentAreasFor(schoolId: string, grade: string): DevelopmentArea[] {
  return developmentAreasByGrade[scopeKey(schoolId, grade)] ?? [];
}

export function skillsProfileFor(schoolId: string, grade: string): SkillGroup[] {
  return skillsProfileByGrade[scopeKey(schoolId, grade)] ?? [];
}

// ---------------------------------------------------------------------------
// Term history
//
// What a grade's areas and skills looked like in an earlier year or term.
// Archives are read-only: they are the record of what students actually saw
// then, so editing one would rewrite history rather than correct it. Each
// archive carries both halves of the scope, and the two screens each read the
// half they own.
// ---------------------------------------------------------------------------

export type ArchivedTerm = {
  id: string;
  /** Display label for the year or term, e.g. "Spring 2026". */
  term: string;
  /** The period the configuration was in force. ISO dates (YYYY-MM-DD). */
  from: string;
  to: string;
  areas: DevelopmentArea[];
  groups: SkillGroup[];
};

type TermSeed = {
  key: string;
  term: string;
  from: string;
  to: string;
  areas: AreaSeed[];
  groups: GroupSeed[];
};

function buildTermHistory(schoolId: string, grade: string, seeds: TermSeed[]): ArchivedTerm[] {
  return seeds.map((seed) => {
    // The term key joins the scope key so an archived area never collides with
    // its live counterpart, or with the same area in another term.
    const scope = `${scopeKey(schoolId, grade)}-${seed.key}`;
    return {
      id: `term-${scope}`,
      term: seed.term,
      from: seed.from,
      to: seed.to,
      // An archived area carries the term it ran for, same as a live one.
      areas: buildAreas(scope, seed.areas, {
        name: seed.term,
        from: seed.from,
        to: seed.to
      }),
      groups: buildGroups(scope, seed.groups)
    };
  });
}

/**
 * Fall 2025 predates the two graduate-profile groups that were added when the
 * profile was completed, so its archive is genuinely thinner than today's —
 * which is the whole reason an admin looks back at it.
 */
const PRIOR_YEAR_GROUPS: GroupSeed[] = HS_GROUPS.filter(
  (seed) => seed.key !== "critical" && seed.key !== "emotional"
);

function hsHistoryFor(grade: string): ArchivedTerm[] {
  const gradeAreas = HS_GRADE_AREAS[grade] ?? [];
  return buildTermHistory("edison-hs", grade, [
    {
      key: "spring-2026",
      term: "Spring 2026",
      from: "2026-01-12",
      to: "2026-05-22",
      areas: [...HS_SHARED_AREAS, ...gradeAreas],
      groups: HS_GROUPS
    },
    {
      key: "fall-2025",
      term: "Fall 2025",
      from: "2025-08-25",
      to: "2025-12-19",
      areas: [...HS_SHARED_AREAS, ...gradeAreas.slice(0, 1)],
      groups: PRIOR_YEAR_GROUPS
    }
  ]);
}

/** Newest term first, so the history screens open on the most recent archive. */
export const termHistoryByGrade: Record<string, ArchivedTerm[]> = {
  [scopeKey("edison-hs", "9")]: hsHistoryFor("9"),
  [scopeKey("edison-hs", "10")]: hsHistoryFor("10"),
  [scopeKey("edison-hs", "11")]: hsHistoryFor("11"),
  [scopeKey("edison-hs", "12")]: hsHistoryFor("12")
};

export function termHistoryFor(schoolId: string, grade: string): ArchivedTerm[] {
  return termHistoryByGrade[scopeKey(schoolId, grade)] ?? [];
}

/**
 * Resolve a student's 360 (school name + display group, e.g. "Grade 10") back
 * to the school/grade scope that configures their skills and development
 * content. Returns null when it cannot be resolved — a school with no grades
 * data, or a faculty member with no grade at all.
 */
export function resolveGradeScope(schoolName: string, group: string): { schoolId: string; grade: string } | null {
  const school = schools.find((entry) => entry.name === schoolName);
  const grade = group.replace(/^grade\s+/i, "").trim();
  if (!school || !school.grades.includes(grade)) {
    return null;
  }
  return { schoolId: school.id, grade };
}

/**
 * Deep link from a student's 360 to the grade that configures their content.
 * Falls back to the school list when it cannot be resolved rather than
 * producing a 404.
 */
export function gradeConfigHref(schoolName: string, group: string): string {
  const scope = resolveGradeScope(schoolName, group);
  if (!scope) {
    return "/skills-development";
  }
  return `/skills-development/${scope.schoolId}/${encodeURIComponent(scope.grade)}`;
}

/** Counts for the school and grade pickers, so an admin can see what is set up. */
export function gradeConfigSummary(schoolId: string, grade: string) {
  const areas = developmentAreasFor(schoolId, grade);
  const groups = skillsProfileFor(schoolId, grade);
  return {
    areas: areas.length,
    skills: areas.reduce((sum, area) => sum + area.skills.length, 0),
    groups: groups.length,
    subSkills: groups.reduce((sum, group) => sum + group.subSkills.length, 0),
    published:
      areas.filter((area) => area.published).length +
      groups.filter((group) => group.published).length,
    configured: areas.length > 0 || groups.length > 0
  };
}

export function schoolConfigSummary(schoolId: string) {
  const school = schools.find((entry) => entry.id === schoolId);
  const grades = school?.grades ?? [];
  const configured = grades.filter((grade) => gradeConfigSummary(schoolId, grade).configured);
  return { grades: grades.length, configuredGrades: configured.length };
}
