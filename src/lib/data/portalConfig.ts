import type { ListEditorItem } from "@/components/shared/ListEditor";

// TODO: replace with the real Admin DB portal-configuration contract.
//
// Scope note: the committed scope names HS and KG only. ES/MS are deliberately
// absent until the team confirms whether they need their own layout screens
// (brief §8 item 6).

export type SchoolLevel = "HS" | "KG";

// Confirmed 2026-07-31: HS and KG only. ES/MS are deliberately absent rather
// than pending, so adding them is a scope change, not a gap to fill in.
export const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: "HS", label: "High School" },
  { value: "KG", label: "Kindergarten" }
];

export type LayoutSetting = {
  id: string;
  label: string;
  value: string;
  configured: boolean;
};

export const layoutSettings: Record<SchoolLevel, LayoutSetting[]> = {
  HS: [
    { id: "hs-theme", label: "Theme", value: "Edison Navy", configured: true },
    { id: "hs-logo", label: "Logo", value: "edison-hs-crest.svg", configured: true },
    { id: "hs-landing", label: "Landing widget order", value: "Schedule, Goals, Assignments", configured: true },
    { id: "hs-banner", label: "Welcome banner", value: "Not set", configured: false },
    { id: "hs-accent", label: "Accent color", value: "Not set", configured: false }
  ],
  KG: [
    { id: "kg-theme", label: "Theme", value: "Bright Primary", configured: true },
    { id: "kg-logo", label: "Logo", value: "Not set", configured: false },
    { id: "kg-landing", label: "Landing widget order", value: "Not set", configured: false },
    { id: "kg-banner", label: "Welcome banner", value: "Not set", configured: false },
    { id: "kg-accent", label: "Accent color", value: "Not set", configured: false }
  ]
};

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

export type DevelopmentArea = {
  id: string;
  title: string;
  tone: DevAreaTone;
  icon: DevAreaIcon;
  published: boolean;
  skills: DevSkill[];
};

export const developmentAreas: Record<SchoolLevel, DevelopmentArea[]> = {
  HS: [
    {
      id: "da-hs-strengths",
      title: "Strengths",
      tone: "blue",
      icon: "check",
      published: true,
      skills: [
        { id: "sk-1", label: "Analytical Thinker" },
        { id: "sk-2", label: "Problem Solver" },
        { id: "sk-3", label: "Detail-Oriented" }
      ]
    },
    {
      id: "da-hs-grow",
      title: "Room To Grow",
      tone: "green",
      icon: "bolt",
      published: true,
      skills: [
        { id: "sk-4", label: "Speed in Tests" },
        { id: "sk-5", label: "Word Problems" },
        { id: "sk-6", label: "Time Management" }
      ]
    },
    {
      id: "da-hs-interests",
      title: "Interests",
      tone: "cyan",
      icon: "smile",
      published: true,
      skills: [
        { id: "sk-7", label: "Mathematics" },
        { id: "sk-8", label: "Physics" },
        { id: "sk-9", label: "Chess" }
      ]
    },
    {
      id: "da-hs-goals",
      title: "Future Goals",
      tone: "orange",
      icon: "target",
      published: true,
      skills: [
        { id: "sk-10", label: "Engineering School" },
        { id: "sk-11", label: "STEM Career" },
        { id: "sk-12", label: "Research Internship" }
      ]
    }
  ],
  KG: [
    {
      id: "da-kg-strengths",
      title: "Strengths",
      tone: "blue",
      icon: "check",
      published: true,
      skills: [
        { id: "sk-k1", label: "Shares Willingly" },
        { id: "sk-k2", label: "Listens Well" }
      ]
    },
    {
      id: "da-kg-grow",
      title: "Room To Grow",
      tone: "green",
      icon: "bolt",
      published: false,
      skills: [{ id: "sk-k3", label: "Pencil Grip" }]
    }
  ]
};

export const skillsProfile: Record<string, ListEditorItem[]> = {
  HS: [
    {
      id: "sk-hs-1",
      title: "Mathematics — Problem solving",
      detail: "Multi-step problems with justification.",
      status: { tone: "ok", label: "Published" },
      meta: "Mathematics · Grades 9–12"
    },
    {
      id: "sk-hs-2",
      title: "Science — Experimental design",
      detail: "Hypothesis, controls, and analysis of results.",
      status: { tone: "ok", label: "Published" },
      meta: "Science · Grades 10–12"
    },
    {
      id: "sk-hs-3",
      title: "English — Source evaluation",
      detail: "Assessing credibility and bias in sources.",
      status: { tone: "neutral", label: "Draft" },
      meta: "English · Grades 9–10"
    }
  ],
  KG: [
    {
      id: "sk-kg-1",
      title: "Literacy — Letter recognition",
      detail: "Recognizing and naming upper and lowercase letters.",
      status: { tone: "ok", label: "Published" },
      meta: "Literacy · Kindergarten"
    }
  ]
};

export type FacultyDashboardComponent = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const facultyDashboardComponents: FacultyDashboardComponent[] = [
  {
    id: "fd-schedule",
    label: "Schedule strip",
    description: "Today's classes across the top of the faculty dashboard.",
    enabled: true
  },
  {
    id: "fd-attendance",
    label: "Attendance summary",
    description: "Class attendance percentage tile.",
    enabled: true
  },
  {
    id: "fd-alerts",
    label: "Student alerts",
    description: "Open alerts requiring faculty attention.",
    enabled: true
  },
  {
    id: "fd-skills",
    label: "Skills profile",
    description: "Per-student skills breakdown panel.",
    enabled: false
  },
  {
    id: "fd-goals",
    label: "Goal progress",
    description: "Academic goal status for the teacher's students.",
    enabled: true
  }
];
