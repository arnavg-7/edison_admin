import type { ListEditorItem } from "@/components/shared/ListEditor";
import type { UserRole } from "./userRoles";

// TODO: replace with the real Admin DB system-settings contract.

export const gradeLevels: ListEditorItem[] = [
  {
    id: "gl-k",
    title: "Kindergarten",
    detail: "Edison Kindergarten Center",
    status: { tone: "ok", label: "Active" },
    meta: "1 school · 118 students"
  },
  {
    id: "gl-1-5",
    title: "Grades 1–5",
    detail: "Lincoln Elementary, Franklin Elementary",
    status: { tone: "ok", label: "Active" },
    meta: "2 schools · 642 students"
  },
  {
    id: "gl-6-8",
    title: "Grades 6–8",
    detail: "Edison Middle School",
    status: { tone: "ok", label: "Active" },
    meta: "1 school · 588 students"
  },
  {
    id: "gl-9-12",
    title: "Grades 9–12",
    detail: "Edison High School",
    status: { tone: "ok", label: "Active" },
    meta: "1 school · 782 students"
  }
];

export const subjects: ListEditorItem[] = [
  {
    id: "sub-math",
    title: "Mathematics",
    detail: "Mapped to grades K–12.",
    status: { tone: "ok", label: "Mapped" },
    meta: "14 courses"
  },
  {
    id: "sub-english",
    title: "English Language Arts",
    detail: "Mapped to grades K–12.",
    status: { tone: "ok", label: "Mapped" },
    meta: "12 courses"
  },
  {
    id: "sub-science",
    title: "Science",
    detail: "Mapped to grades 3–12.",
    status: { tone: "ok", label: "Mapped" },
    meta: "11 courses"
  },
  {
    id: "sub-arts",
    title: "Visual & Performing Arts",
    detail: "Not yet mapped to grade levels.",
    status: { tone: "warn", label: "Unmapped" },
    meta: "6 courses"
  }
];

export const announcements: ListEditorItem[] = [
  {
    id: "ann-1",
    title: "Term 4 progress reports due",
    detail: "Faculty must submit progress reports by August 8.",
    status: { tone: "ok", label: "Active" },
    meta: "All faculty · expires Aug 08, 2026"
  },
  {
    id: "ann-2",
    title: "Summer portal maintenance",
    detail: "The portal will be unavailable Saturday 02:00–06:00.",
    status: { tone: "ok", label: "Active" },
    meta: "All users · expires Aug 03, 2026"
  },
  {
    id: "ann-3",
    title: "Welcome back, class of 2030",
    detail: "Orientation details for incoming grade 9 students.",
    status: { tone: "neutral", label: "Scheduled" },
    meta: "Grade 9 · starts Aug 24, 2026"
  }
];

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastActive: string;
};

export const managedUsers: ManagedUser[] = [
  {
    id: "u-1",
    name: "Dana Whitfield",
    email: "dwhitfield@edison.example.org",
    role: "school_leader",
    lastActive: "2026-07-17T09:14:00-04:00"
  },
  {
    id: "u-2",
    name: "Marcus Reyes",
    email: "mreyes@edison.example.org",
    role: "school_leader",
    lastActive: "2026-07-16T16:42:00-04:00"
  },
  {
    id: "u-3",
    name: "Priya Nair",
    email: "pnair@edison.example.org",
    role: "super_admin",
    lastActive: "2026-07-17T12:05:00-04:00"
  },
  {
    id: "u-4",
    name: "Sam Okonkwo",
    email: "sokonkwo@edison.example.org",
    role: "support_staff",
    lastActive: "2026-07-17T11:38:00-04:00"
  }
];

export type ProvisioningRequest = {
  id: string;
  name: string;
  requestedRole: UserRole;
  requestedOn: string;
};

export const provisioningRequests: ProvisioningRequest[] = [
  {
    id: "pr-1",
    name: "Alicia Gomez",
    requestedRole: "super_admin",
    requestedOn: "2026-07-15T10:20:00-04:00"
  },
  {
    id: "pr-2",
    name: "Tom Bradley",
    requestedRole: "support_staff",
    requestedOn: "2026-07-16T14:03:00-04:00"
  }
];

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};

export const auditLog: AuditEntry[] = [
  {
    id: "al-1",
    actor: "Priya Nair",
    action: "Updated alert rule",
    target: "Attendance below 80%",
    at: "2026-07-17T12:41:00-04:00"
  },
  {
    id: "al-2",
    actor: "Sam Okonkwo",
    action: "Changed role",
    target: "Marcus Reyes → School Leader",
    at: "2026-07-17T10:12:00-04:00"
  },
  {
    id: "al-3",
    actor: "Priya Nair",
    action: "Published development area",
    target: "Collaboration (HS)",
    at: "2026-07-16T15:55:00-04:00"
  },
  {
    id: "al-4",
    actor: "Sam Okonkwo",
    action: "Re-ran Genesis ingest",
    target: "2026-07-16 daily file",
    at: "2026-07-16T08:07:00-04:00"
  },
  {
    id: "al-5",
    actor: "Dana Whitfield",
    action: "Exported report",
    target: "Faculty class performance · Edison HS",
    at: "2026-07-15T17:20:00-04:00"
  }
];
