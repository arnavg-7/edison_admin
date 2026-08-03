// TODO: replace with the real Admin DB user-management contract. Every admin
// account here is created manually on this screen — there is no Genesis (or
// any other) sync for the small set of people who get admin-level access to
// the portal. Regular student/faculty accounts stay on Student & Faculty 360
// and never appear here unless someone deliberately adds them as an admin too.

import { schools } from "./schools";

export type AdminRole = "leadership" | "portal_administrator" | "it_administrator";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  it_administrator: "IT Administrator",
  portal_administrator: "Portal Administrator",
  leadership: "Leadership"
};

/** IT Administrator first — the role that owns this screen. */
export const ADMIN_ROLE_ORDER: AdminRole[] = ["it_administrator", "portal_administrator", "leadership"];

export type AdminScope = { type: "district" } | { type: "school"; schoolId: string };

export function scopeLabel(scope: AdminScope): string {
  if (scope.type === "district") return "District-wide";
  return schools.find((school) => school.id === scope.schoolId)?.name ?? "Unknown school";
}

export type AdminUserStatus = "Active" | "Pending Invite" | "Inactive";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  roles: AdminRole[];
  scope: AdminScope;
  status: AdminUserStatus;
  lastLogin: string | null;
  dateAdded: string;
  invitedBy: string;
};

export function newAdminUserId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "admin"}-${Date.now()}`;
}

export const adminUsers: AdminUser[] = [
  {
    id: "priya-nair-admin",
    name: "Priya Nair",
    email: "pnair@edison.example.org",
    roles: ["it_administrator"],
    scope: { type: "district" },
    status: "Active",
    lastLogin: "2026-07-17T12:05:00-04:00",
    dateAdded: "2025-08-14T09:00:00-04:00",
    invitedBy: "System"
  },
  {
    id: "dana-whitfield-admin",
    name: "Dana Whitfield",
    email: "dwhitfield@edison.example.org",
    roles: ["leadership", "portal_administrator"],
    scope: { type: "school", schoolId: "edison-hs" },
    status: "Active",
    lastLogin: "2026-07-17T09:14:00-04:00",
    dateAdded: "2025-08-14T09:05:00-04:00",
    invitedBy: "Priya Nair"
  },
  {
    id: "marcus-reyes-admin",
    name: "Marcus Reyes",
    email: "mreyes@edison.example.org",
    roles: ["leadership"],
    scope: { type: "school", schoolId: "edison-ms" },
    status: "Active",
    lastLogin: "2026-07-16T16:42:00-04:00",
    dateAdded: "2025-09-02T10:30:00-04:00",
    invitedBy: "Priya Nair"
  },
  {
    id: "sam-okonkwo-admin",
    name: "Sam Okonkwo",
    email: "sokonkwo@edison.example.org",
    roles: ["portal_administrator"],
    scope: { type: "district" },
    status: "Inactive",
    lastLogin: "2026-04-02T11:20:00-04:00",
    dateAdded: "2025-08-20T14:00:00-04:00",
    invitedBy: "Priya Nair"
  },
  {
    id: "alicia-gomez-admin",
    name: "Alicia Gomez",
    email: "agomez@edison.example.org",
    roles: ["it_administrator"],
    scope: { type: "district" },
    status: "Pending Invite",
    lastLogin: null,
    dateAdded: "2026-07-15T10:20:00-04:00",
    invitedBy: "Priya Nair"
  },
  {
    id: "tom-bradley-admin",
    name: "Tom Bradley",
    email: "tbradley@edison.example.org",
    roles: ["portal_administrator"],
    scope: { type: "school", schoolId: "james-madison-intermediate" },
    status: "Pending Invite",
    lastLogin: null,
    dateAdded: "2026-07-16T14:03:00-04:00",
    invitedBy: "Dana Whitfield"
  }
];
