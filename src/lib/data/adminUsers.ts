/**
 * Who can sign in to this portal, and over which schools.
 *
 * Two roles, and they differ only in reach:
 *
 *   Super Admin   every section, every school in the district
 *   School Admin  every section, one assigned school
 *
 * That is the whole access model. A School Admin is not a cut-down Super Admin
 * with some screens taken away — it is the same job over one institution, which
 * is why there is no per-section grid here. Access follows the role, so two
 * School Admins cannot silently differ, and "School Admin · Edison High School"
 * tells you everything about what someone can do without opening their record.
 *
 * An account is created against an email the district has already issued. The
 * mailbox exists first; this screen attaches a role to it and sends the invite.
 * A personal address cannot be deprovisioned when someone leaves, so their
 * access would outlive their employment and the audit log would point at an
 * address the district does not control.
 *
 * TODO: replace with the real Admin DB accounts contract. Invites are tracked
 * locally until there is an identity provider to hand them to.
 */

import { schools } from "./schools";
import type { StatusTone } from "./types";

export type AdminRole = "super_admin" | "school_admin";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin"
};

/** Widest reach first, which is also the order the create form offers them. */
export const ADMIN_ROLE_ORDER: AdminRole[] = ["super_admin", "school_admin"];

/**
 * What the role grants, in the words the create form and the reference tab both
 * read. Written once so the two cannot disagree about what an admin just agreed
 * to.
 */
export const ADMIN_ROLE_GRANTS: Record<AdminRole, { reach: string; grants: string[]; denies: string[] }> = {
  super_admin: {
    reach: "Every school in the district",
    grants: [
      "Every section of the portal, read and write",
      "Reporting across all schools, and per school",
      "Creates and manages other admin accounts"
    ],
    denies: []
  },
  school_admin: {
    reach: "One assigned school",
    grants: [
      "Every section of the portal, read and write",
      "That school's grades, goals, skills, students and faculty",
      "Reporting for that school"
    ],
    denies: [
      "No other school's data, in any section or report",
      "Cannot create or manage admin accounts"
    ]
  }
};

/** A School Admin without a school could not be scoped to anything. */
export function roleNeedsSchool(role: AdminRole): boolean {
  return role === "school_admin";
}

export type AdminScope = { type: "district" } | { type: "school"; schoolId: string };

/** "All schools" or the school's name — what the row and the invite both show. */
export function scopeLabel(scope: AdminScope): string {
  if (scope.type === "district") return "All schools";
  return schools.find((school) => school.id === scope.schoolId)?.name ?? "Unknown school";
}

/** Role and reach in one phrase: "School Admin · Edison High School". */
export function roleScopeLabel(user: Pick<AdminUser, "role" | "scope">): string {
  return user.role === "super_admin"
    ? ADMIN_ROLE_LABELS.super_admin
    : `${ADMIN_ROLE_LABELS.school_admin} · ${scopeLabel(user.scope)}`;
}

/* ── Status ───────────────────────────────────────────────────────────── */

/**
 * Three states, and each is a fact about the invitation rather than a category
 * someone was filed under.
 *
 * `Disabled` rather than "Inactive": it is something an admin did, not something
 * that drifted. The record is kept either way — an account that signed in for a
 * year is part of the audit trail, and deleting the row would take the trail
 * with it.
 */
export type AdminUserStatus = "Invited" | "Active" | "Disabled";

export const ADMIN_STATUS_TONE: Record<AdminUserStatus, StatusTone> = {
  Invited: "warn",
  Active: "ok",
  Disabled: "neutral"
};

export const ADMIN_STATUS_ORDER: AdminUserStatus[] = ["Invited", "Active", "Disabled"];

export const ADMIN_STATUS_HINTS: Record<AdminUserStatus, string> = {
  Invited: "Invitation sent. They have not signed in yet.",
  Active: "Accepted the invitation and can sign in.",
  Disabled: "Access withdrawn. The record and its history are kept."
};

export function normalizeStatus(status: unknown): AdminUserStatus {
  return ADMIN_STATUS_ORDER.includes(status as AdminUserStatus)
    ? (status as AdminUserStatus)
    : "Invited";
}

/* ── The record ───────────────────────────────────────────────────────── */

export type AdminUser = {
  id: string;
  name: string;
  /** The district-issued address the account is attached to. */
  email: string;
  role: AdminRole;
  /** District for a Super Admin; the assigned school for a School Admin. */
  scope: AdminScope;
  status: AdminUserStatus;
  lastLogin: string | null;
  dateAdded: string;
  invitedBy: string;
  /** When the current invitation was sent — reset each time it is resent. */
  inviteSentAt: string | null;
  /** How many times it has been sent, first send included. */
  inviteSends: number;
};

/** How long an invitation stands before it has to be sent again. */
export const INVITE_VALID_DAYS = 7;

export function inviteExpiresAt(sentAt: string): string {
  const expiry = new Date(sentAt);
  expiry.setDate(expiry.getDate() + INVITE_VALID_DAYS);
  return expiry.toISOString();
}

/**
 * Whether the standing invitation has run out.
 *
 * Worth showing rather than leaving to be discovered: an invite nobody accepted
 * in a week is usually one that went to the wrong address or the wrong person,
 * and "Invited" alone does not distinguish that from one sent this morning.
 */
export function isInviteExpired(user: AdminUser, now: Date = new Date()): boolean {
  if (user.status !== "Invited" || !user.inviteSentAt) return false;
  return new Date(inviteExpiresAt(user.inviteSentAt)) < now;
}

/* ── Email ────────────────────────────────────────────────────────────── */

/**
 * Admin access is only ever granted to a district-issued institutional account.
 *
 * TODO: read the real allow-list from the district identity config; there is no
 * settings contract for it yet, so the seed domain is hardcoded here.
 */
export const INSTITUTIONAL_EMAIL_DOMAINS = ["edison.example.org"];

export const INSTITUTIONAL_DOMAINS_LABEL = INSTITUTIONAL_EMAIL_DOMAINS.map(
  (domain) => `@${domain}`
).join(" or ");

export function isEmailShaped(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isInstitutionalEmail(email: string): boolean {
  const at = email.trim().toLowerCase().lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.trim().toLowerCase().slice(at + 1);
  return INSTITUTIONAL_EMAIL_DOMAINS.includes(domain);
}

/**
 * A display name from the address, since the mailbox is created before the
 * account and nobody should have to retype what the directory already knows.
 *
 * "pnair" gives "Pnair", which is wrong often enough that the field stays
 * editable — this only saves the common case from being blank.
 */
export function nameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function newAdminUserId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "admin"}-${Date.now()}`;
}

/* ── Seeds ────────────────────────────────────────────────────────────── */

/* One of each role in each state worth standing in, including an invitation
   that has run out — the case an admin most needs to see and the one a list of
   healthy rows never shows. */
export const adminUsers: AdminUser[] = [
  {
    id: "ken-oyelaran-admin",
    name: "Ken Oyelaran",
    email: "koyelaran@edison.example.org",
    role: "super_admin",
    scope: { type: "district" },
    status: "Active",
    lastLogin: "2026-09-02T13:40:00-04:00",
    dateAdded: "2025-08-01T08:00:00-04:00",
    invitedBy: "System",
    inviteSentAt: "2025-08-01T08:00:00-04:00",
    inviteSends: 1
  },
  {
    id: "priya-nair-admin",
    name: "Priya Nair",
    email: "pnair@edison.example.org",
    role: "super_admin",
    scope: { type: "district" },
    status: "Active",
    lastLogin: "2026-09-02T12:05:00-04:00",
    dateAdded: "2025-08-14T09:00:00-04:00",
    invitedBy: "Ken Oyelaran",
    inviteSentAt: "2025-08-14T09:00:00-04:00",
    inviteSends: 1
  },
  {
    id: "dana-whitfield-admin",
    name: "Dana Whitfield",
    email: "dwhitfield@edison.example.org",
    role: "school_admin",
    scope: { type: "school", schoolId: "edison-hs" },
    status: "Active",
    lastLogin: "2026-09-01T09:14:00-04:00",
    dateAdded: "2025-08-14T09:05:00-04:00",
    invitedBy: "Priya Nair",
    inviteSentAt: "2025-08-14T09:05:00-04:00",
    inviteSends: 2
  },
  {
    id: "marcus-reyes-admin",
    name: "Marcus Reyes",
    email: "mreyes@edison.example.org",
    role: "school_admin",
    scope: { type: "school", schoolId: "edison-ms" },
    status: "Active",
    lastLogin: "2026-08-28T16:42:00-04:00",
    dateAdded: "2025-09-02T10:30:00-04:00",
    invitedBy: "Priya Nair",
    inviteSentAt: "2025-09-02T10:30:00-04:00",
    inviteSends: 1
  },
  {
    id: "tom-bradley-admin",
    name: "Tom Bradley",
    email: "tbradley@edison.example.org",
    role: "school_admin",
    scope: { type: "school", schoolId: "james-madison-intermediate" },
    status: "Invited",
    lastLogin: null,
    dateAdded: "2026-09-01T14:03:00-04:00",
    invitedBy: "Dana Whitfield",
    inviteSentAt: "2026-09-01T14:03:00-04:00",
    inviteSends: 1
  },
  {
    id: "alicia-gomez-admin",
    name: "Alicia Gomez",
    email: "agomez@edison.example.org",
    role: "super_admin",
    scope: { type: "district" },
    status: "Invited",
    lastLogin: null,
    // Sent in July and never accepted: the expired case.
    dateAdded: "2026-07-15T10:20:00-04:00",
    invitedBy: "Priya Nair",
    inviteSentAt: "2026-07-15T10:20:00-04:00",
    inviteSends: 2
  },
  {
    id: "sam-okonkwo-admin",
    name: "Sam Okonkwo",
    email: "sokonkwo@edison.example.org",
    role: "school_admin",
    scope: { type: "school", schoolId: "lincoln-es" },
    status: "Disabled",
    lastLogin: "2026-04-02T11:20:00-04:00",
    dateAdded: "2025-08-20T14:00:00-04:00",
    invitedBy: "Priya Nair",
    inviteSentAt: "2025-08-20T14:00:00-04:00",
    inviteSends: 1
  },
  {
    id: "erin-castellano-admin",
    name: "Erin Castellano",
    email: "ecastellano@edison.example.org",
    role: "school_admin",
    scope: { type: "school", schoolId: "edison-ms" },
    status: "Disabled",
    lastLogin: "2026-05-29T08:47:00-04:00",
    dateAdded: "2025-08-22T11:15:00-04:00",
    invitedBy: "Priya Nair",
    inviteSentAt: "2025-08-22T11:15:00-04:00",
    inviteSends: 1
  }
];
