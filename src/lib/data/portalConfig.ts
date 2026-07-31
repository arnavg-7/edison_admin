import type { ListEditorItem } from "@/components/shared/ListEditor";

// TODO: replace with the real Admin DB portal-configuration contract.
//
// Scope note: the committed scope names HS and KG only. ES/MS are deliberately
// absent until the team confirms whether they need their own layout screens
// (brief §8 item 6).

export type SchoolLevel = "HS" | "KG";

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

export const developmentAreas: Record<string, ListEditorItem[]> = {
  HS: [
    {
      id: "da-hs-1",
      title: "Critical thinking",
      detail: "Analysis, evaluation, and reasoned argument across subjects.",
      status: { tone: "ok", label: "Published" },
      meta: "Grades 9–12"
    },
    {
      id: "da-hs-2",
      title: "Collaboration",
      detail: "Working effectively in teams toward a shared outcome.",
      status: { tone: "ok", label: "Published" },
      meta: "Grades 9–12"
    },
    {
      id: "da-hs-3",
      title: "Digital literacy",
      detail: "Responsible and effective use of digital tools.",
      status: { tone: "neutral", label: "Draft" },
      meta: "Grades 11–12"
    }
  ],
  KG: [
    {
      id: "da-kg-1",
      title: "Social readiness",
      detail: "Sharing, turn-taking, and group participation.",
      status: { tone: "ok", label: "Published" },
      meta: "Kindergarten"
    },
    {
      id: "da-kg-2",
      title: "Fine motor skills",
      detail: "Pencil grip, cutting, and manipulation tasks.",
      status: { tone: "neutral", label: "Draft" },
      meta: "Kindergarten"
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
