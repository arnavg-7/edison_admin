import type { ListEditorItem } from "@/components/shared/ListEditor";

// TODO: replace with the real Admin DB Academic Goals contract.

export const goalTemplates: ListEditorItem[] = [
  {
    id: "gt-1",
    title: "Personalized Own Academic Goal (POAG) — Semester",
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

export type ProgressTracking = {
  facultyEnabled: boolean;
  studentEnabled: boolean;
  activeGoals: number;
  updatedLast30Days: number;
  asOf: string;
};

export const progressTracking: ProgressTracking = {
  facultyEnabled: true,
  studentEnabled: false,
  activeGoals: 1422,
  updatedLast30Days: 968,
  asOf: "2026-07-17T13:02:00-04:00"
};
