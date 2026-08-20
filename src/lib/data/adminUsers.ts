// TODO: replace with the real Admin DB user-management contract. Every admin
// account here is created manually on this screen — there is no Genesis (or
// any other) sync for the small set of people who get admin-level access to
// the portal. Regular student/faculty accounts stay on Student & Faculty 360
// and never appear here unless someone deliberately adds them as an admin too.

import { schools } from "./schools";
import type { StatusTone } from "./types";

export type AdminRole = "leadership" | "portal_administrator" | "it_administrator";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  it_administrator: "IT Administrator",
  portal_administrator: "Portal Administrator",
  leadership: "Leadership"
};

/** IT Administrator first — the role that owns this screen. */
export const ADMIN_ROLE_ORDER: AdminRole[] = ["it_administrator", "portal_administrator", "leadership"];

/**
 * Permission level, held per role rather than per account: someone can be a
 * view-only IT Administrator and an editing Portal Administrator at the same
 * time, so a single boolean on the user can't express what they're allowed to do.
 */
export type AdminPermission = "view" | "edit";

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  view: "View only",
  edit: "Can edit"
};

/**
 * Roles whose level is fixed by design and so isn't offered as a choice —
 * Leadership is a read-only audience (dashboards and reports), never an
 * editing one, so it has no "Can edit" to pick.
 */
export const FIXED_ROLE_PERMISSION: Partial<Record<AdminRole, AdminPermission>> = {
  leadership: "view"
};

export type AdminRoleAssignment = { role: AdminRole; permission: AdminPermission };

/** New assignments default to "Can edit" except where the role is pinned to view. */
export function defaultRolePermission(role: AdminRole): AdminPermission {
  return FIXED_ROLE_PERMISSION[role] ?? "edit";
}

export function findRoleAssignment(
  assignments: AdminRoleAssignment[],
  role: AdminRole
): AdminRoleAssignment | undefined {
  return assignments.find((entry) => entry.role === role);
}

export function roleAssignmentsInclude(assignments: AdminRoleAssignment[], role: AdminRole): boolean {
  return assignments.some((entry) => entry.role === role);
}

/**
 * Accepts either the current `{ role, permission }` shape or the bare
 * `AdminRole[]` this used to be — accounts already persisted in localStorage
 * (and CSV rows that omit a level) predate per-role permissions.
 */
export function normalizeRoleAssignments(roles: unknown): AdminRoleAssignment[] {
  if (!Array.isArray(roles)) return [];

  return roles.flatMap((entry) => {
    if (typeof entry === "string") {
      const role = entry as AdminRole;
      return ADMIN_ROLE_ORDER.includes(role) ? [{ role, permission: defaultRolePermission(role) }] : [];
    }

    const candidate = entry as Partial<AdminRoleAssignment>;
    if (!candidate?.role || !ADMIN_ROLE_ORDER.includes(candidate.role)) return [];

    return [
      {
        role: candidate.role,
        // A fixed role ignores whatever was stored — Leadership can't be edit.
        permission:
          FIXED_ROLE_PERMISSION[candidate.role] ??
          (candidate.permission === "view" ? "view" : "edit")
      }
    ];
  });
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Plain-language summary of what an account can actually do, e.g. "Dana will
 * have edit access to Portal Administrator and view-only access to Leadership."
 * Returns "" when nothing is assigned, so callers can fall back to a prompt.
 */
export function accessSummary(name: string, assignments: AdminRoleAssignment[]): string {
  if (assignments.length === 0) return "";

  const ordered = ADMIN_ROLE_ORDER.flatMap((role) => {
    const assignment = findRoleAssignment(assignments, role);
    return assignment ? [assignment] : [];
  });

  const clauses = (["edit", "view"] as AdminPermission[]).flatMap((permission) => {
    const roles = ordered
      .filter((entry) => entry.permission === permission)
      .map((entry) => ADMIN_ROLE_LABELS[entry.role]);
    if (roles.length === 0) return [];
    return [`${permission === "edit" ? "edit" : "view-only"} access to ${formatList(roles)}`];
  });

  const who = name.trim() || "This person";
  return `${who} will have ${formatList(clauses)}.`;
}

export type AdminScope = { type: "district" } | { type: "school"; schoolId: string };

export function scopeLabel(scope: AdminScope): string {
  if (scope.type === "district") return "District-wide";
  return schools.find((school) => school.id === scope.schoolId)?.name ?? "Unknown school";
}

export type AdminUserStatus = "Active" | "Pending Invite" | "Inactive" | "Revoked";

/**
 * Display vocabulary for statuses. The stored value stays "Active" — accounts
 * already in localStorage carry it — but the UI calls that state Approved,
 * matching the Approved Users tab: access was granted and taken up, as opposed
 * to still pending, handed back (Revoked) or dormant (Inactive).
 */
export const ADMIN_STATUS_LABELS: Record<AdminUserStatus, string> = {
  Active: "Approved",
  "Pending Invite": "Pending Invite",
  Revoked: "Revoked",
  Inactive: "Inactive"
};

export const ADMIN_STATUS_TONE: Record<AdminUserStatus, StatusTone> = {
  Active: "ok",
  "Pending Invite": "warn",
  Revoked: "error",
  Inactive: "neutral"
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  /** One entry per role held, each with its own permission level. */
  roles: AdminRoleAssignment[];
  /** Role-independent: scope applies across every role the account holds. */
  scope: AdminScope;
  status: AdminUserStatus;
  /**
   * Status the account held before it was revoked, so Restore can put it back
   * where it was: a revoked invite returns to Pending Invite rather than
   * becoming a live Active account nobody ever accepted.
   */
  revokedFrom?: AdminUserStatus;
  lastLogin: string | null;
  dateAdded: string;
  invitedBy: string;
};

/**
 * Admin access is only ever granted to a district-issued institutional
 * account. A personal mailbox can't be deprovisioned when someone leaves, so
 * their portal access would outlive their employment — and the audit log would
 * point at an address the district doesn't control.
 *
 * TODO: read the real allow-list from the district identity config; there's no
 * settings contract for it yet, so the seed domain is hardcoded here.
 */
export const INSTITUTIONAL_EMAIL_DOMAINS = ["edison.example.org"];

/** "@edison.example.org", or "@a or @b" if the district ever runs more than one. */
export const INSTITUTIONAL_DOMAINS_LABEL = INSTITUTIONAL_EMAIL_DOMAINS.map((domain) => `@${domain}`).join(
  " or "
);

/** Shape check only — shared so the manual and CSV invites can't drift apart. */
export function isEmailShaped(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * True when the address sits on an allowed institutional domain. Subdomains
 * count (`staff.edison.example.org`), since districts routinely split staff and
 * student mail that way.
 */
export function isInstitutionalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at === -1) return false;

  const domain = normalized.slice(at + 1);
  return INSTITUTIONAL_EMAIL_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
}

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
    roles: [{ role: "it_administrator", permission: "edit" }],
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
    roles: [
      { role: "leadership", permission: "view" },
      { role: "portal_administrator", permission: "edit" }
    ],
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
    roles: [{ role: "leadership", permission: "view" }],
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
    roles: [{ role: "portal_administrator", permission: "view" }],
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
    roles: [{ role: "it_administrator", permission: "edit" }],
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
    roles: [{ role: "portal_administrator", permission: "edit" }],
    scope: { type: "school", schoolId: "james-madison-intermediate" },
    status: "Pending Invite",
    lastLogin: null,
    dateAdded: "2026-07-16T14:03:00-04:00",
    invitedBy: "Dana Whitfield"
  },
  {
    id: "erin-castellano-admin",
    name: "Erin Castellano",
    email: "ecastellano@edison.example.org",
    roles: [{ role: "portal_administrator", permission: "edit" }],
    scope: { type: "school", schoolId: "edison-ms" },
    status: "Revoked",
    revokedFrom: "Active",
    lastLogin: "2026-05-29T08:47:00-04:00",
    dateAdded: "2025-08-22T11:15:00-04:00",
    invitedBy: "Priya Nair"
  }
];
