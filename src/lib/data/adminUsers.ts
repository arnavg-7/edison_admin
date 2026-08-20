// TODO: replace with the real Admin DB user-management contract. Every admin
// account here is created manually on this screen — there is no Genesis (or
// any other) sync for the small set of people who get admin-level access to
// the portal. Regular student/faculty accounts stay on Student & Faculty 360
// and never appear here unless someone deliberately adds them as an admin too.

import { SECTIONS, type SectionId } from "@/lib/nav";
import { schools } from "./schools";
import type { StatusTone } from "./types";

/**
 * The four roles this portal grants.
 *
 * Super Admin and School Admin are the same job at two reaches — the district's
 * or one school's — which is why they are two roles and not one role plus a
 * setting: what a School Admin may hand out is narrower than what they hold,
 * and that is a property of the role rather than of the data they see.
 *
 * IT Administrator is narrow but not junior. It holds few sections and is one
 * of only two roles that can grant any of them, because keeping data flowing
 * and deciding who may sign in are the same job at Edison.
 */
export type AdminRole = "super_admin" | "it_admin" | "school_admin" | "leadership";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  it_admin: "IT / Systems Administrator",
  school_admin: "School Admin",
  leadership: "District & School Leadership"
};

/** For badges and table cells, where the full name does not fit. */
export const ADMIN_ROLE_SHORT_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  it_admin: "IT",
  school_admin: "School Admin",
  leadership: "Leadership"
};

/**
 * Roles renamed on the way to the three above, so an account already in
 * localStorage keeps the access it was granted rather than losing its role and
 * quietly becoming an account with none.
 */
const LEGACY_ROLE_NAMES: Record<string, AdminRole> = {
  super_admin: "super_admin",
  it_admin: "it_admin",
  it_administrator: "it_admin",
  school_admin: "school_admin",
  portal_administrator: "school_admin",
  leadership: "leadership"
};

/**
 * Widest authority first, which is also the order they are granted in — not
 * widest reach: IT opens three sections and School Admin opens nine, but IT is
 * the role that can hand School Admin out.
 */
export const ADMIN_ROLE_ORDER: AdminRole[] = [
  "super_admin",
  "it_admin",
  "school_admin",
  "leadership"
];

/** Roles a School Admin may hand out: their own, and nothing above it. */
export const SCHOOL_ADMIN_GRANTABLE: AdminRole[] = ["school_admin"];

/**
 * What an account may do with one section.
 *
 * The level is per section and per account, not per role: the role picks a
 * sensible starting grid and the person granting access adjusts it for the one
 * person in front of them. A principal who reads the district's reporting but
 * edits only their own school's goals is one account, not two roles.
 */
export type SectionLevel = "none" | "view" | "edit";

export const SECTION_LEVEL_LABELS: Record<SectionLevel, string> = {
  none: "No access",
  view: "View",
  edit: "Edit"
};

export const SECTION_LEVEL_ORDER: SectionLevel[] = ["none", "view", "edit"];

/** Section id → level. Sections absent from the map are "none". */
export type SectionAccessMap = Record<string, SectionLevel>;

export function roleAssignmentsInclude(roles: AdminRole[], role: AdminRole): boolean {
  return roles.includes(role);
}

/**
 * Accepts the bare `AdminRole[]` this holds now, the `{ role, permission }[]`
 * it held while levels were per role, and the older names for the roles
 * themselves. An account already in storage keeps the access it was granted.
 */
export function normalizeRoles(roles: unknown): AdminRole[] {
  if (!Array.isArray(roles)) return [];

  const named = roles.flatMap((entry) => {
    const raw =
      typeof entry === "string"
        ? entry
        : ((entry as { role?: string })?.role ?? "");
    const role = LEGACY_ROLE_NAMES[raw];
    return role ? [role] : [];
  });

  // Two legacy roles can map to the same one, and holding it twice is not a
  // different amount of access.
  return ADMIN_ROLE_ORDER.filter((role) => named.includes(role));
}

/**
 * The grid as stored, with anything unreadable dropped rather than guessed.
 *
 * Both halves are checked: a level this build does not recognise, and a section
 * that no longer exists. A stale section id would otherwise sit in the grid
 * forever — never rendered, never removed, and counted by anything that asks
 * how much access an account has.
 */
export function normalizeAccess(access: unknown): SectionAccessMap {
  if (!access || typeof access !== "object") return {};

  const known = new Set<string>(SECTIONS.map((section) => section.id));

  return Object.entries(access as Record<string, unknown>).reduce<SectionAccessMap>(
    (map, [section, level]) => {
      if (!known.has(section)) return map;
      if (level === "none" || level === "view" || level === "edit") map[section] = level;
      return map;
    },
    {}
  );
}

/** The sections an account can open at all, in whatever order the map has. */
export function grantedSections(access: SectionAccessMap): string[] {
  return Object.entries(access)
    .filter(([, level]) => level !== "none")
    .map(([section]) => section);
}

/** "Edit" where the account can change anything at all, else "View". */
export function highestLevel(access: SectionAccessMap): SectionLevel {
  const levels = Object.values(access);
  if (levels.includes("edit")) return "edit";
  return levels.includes("view") ? "view" : "none";
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Plain-language summary of what an account can actually do, read off the grid
 * rather than off the roles: the grid is what was saved, and after any
 * adjustment it is the only thing that still describes them accurately.
 *
 * Takes the section labels rather than importing them, so this module stays
 * free of the nav it would otherwise depend on.
 *
 * Returns "" when nothing is granted, so callers can fall back to a prompt.
 */
export function accessSummary(
  name: string,
  access: SectionAccessMap,
  sectionLabels: Record<string, string>
): string {
  const label = (section: string) => sectionLabels[section] ?? section;
  const at = (level: SectionLevel) =>
    Object.entries(access)
      .filter(([, value]) => value === level)
      .map(([section]) => label(section));

  const clauses = [
    ["edit", at("edit")] as const,
    ["view", at("view")] as const
  ].flatMap(([level, sections]) =>
    sections.length === 0
      ? []
      : [`${level === "edit" ? "edit" : "view-only"} access to ${formatList(sections)}`]
  );

  if (clauses.length === 0) return "";

  const who = name.trim() || "This person";
  return `${who} will have ${formatList(clauses)}.`;
}

/**
 * What each role is for, and the access it starts an account with.
 *
 * A role here is a preset, not a cage. Granting one fills the account's grid
 * with these levels; whoever is granting it can then change any row before
 * saving, and the grid is what the account actually holds. That is the
 * difference between a role list and an access control, and it is why the two
 * can legitimately disagree for one person.
 *
 * Reporting is `view` even for a Super Admin: the section is read-only by
 * construction — every figure on it comes from a Salesforce report — so `edit`
 * would be a level the screen has no way to honour.
 *
 * TODO: replace with the real Admin DB role contract. The shape is what that
 * table needs: a row per role, a level per section.
 */

export type RolePreset = {
  /** The job, in one line. */
  purpose: string;
  /** Who does it, day to day. */
  who: string;
  /** Level per section. Anything absent is "none". */
  access: SectionAccessMap;
  /** Stated as out of reach, whether or not this portal has a screen for it. */
  excluded: string[];
  /** What this role can hand out, for a role that grants access itself. */
  grants?: AdminRole[];
  /** Asked for by the brief, with no section here to point at. */
  notBuilt?: string[];
};

/** Every section at one level — the shorthand the two admin roles are built on. */
function everySection(level: SectionLevel, overrides: SectionAccessMap = {}): SectionAccessMap {
  return SECTIONS.reduce<SectionAccessMap>((map, section) => {
    map[section.id] = overrides[section.id] ?? level;
    return map;
  }, {});
}

export const ROLE_PRESETS: Record<AdminRole, RolePreset> = {
  super_admin: {
    purpose: "Runs the portal for the whole district, and decides who else can.",
    who: "District administration, or Ken42 technical ops.",
    access: everySection("edit", { reporting: "view" }),
    excluded: [],
    grants: ADMIN_ROLE_ORDER
  },
  school_admin: {
    purpose: "The same job at one school: its configuration, its goals, its people.",
    who: "A principal's office, or whoever administers that school day to day.",
    /* Every section, like a Super Admin — the narrowing is the account's scope,
       not its sections. What is genuinely narrower is what they may hand out:
       another School Admin for their own school, and nothing above it. */
    access: everySection("edit", { reporting: "view" }),
    excluded: ["Granting Super Admin", "Granting Leadership", "Other schools' accounts"],
    grants: ["school_admin"]
  },
  it_admin: {
    purpose: "Keeps data flowing correctly, and controls who has access.",
    who: "District IT, or Ken42 technical ops.",
    /* Few sections, and only one of them at edit. What IT owns in System
       Settings is the audit log — a record, which is read — and the academic
       configuration sharing that section is not theirs; the route gate holds
       the same line for the IT persona, see SECTION_LIMITS in nav.ts. */
    access: { home: "view", "user-management": "edit", "system-settings": "view" },
    excluded: ["Portal configuration", "Goals", "Alerts", "Other schools' data"],
    grants: ADMIN_ROLE_ORDER,
    notBuilt: ["Integrations — Genesis/SIS ingest and Classroom sync have no section yet"]
  },
  leadership: {
    purpose: "A fast read on how the platform and their students and faculty are doing.",
    who: "Superintendent, principal, assistant principal.",
    access: { reporting: "view" },
    excluded: [
      "Portal configuration",
      "Goals configuration",
      "Alerts configuration",
      "System Settings",
      "User Management"
    ]
  }
};

/** The grid a set of roles starts an account with — the widest level wins. */
export function presetAccess(roles: AdminRole[]): SectionAccessMap {
  const rank: Record<SectionLevel, number> = { none: 0, view: 1, edit: 2 };

  return roles.reduce<SectionAccessMap>((map, role) => {
    for (const [section, level] of Object.entries(ROLE_PRESETS[role].access)) {
      if (rank[level] > rank[map[section] ?? "none"]) map[section] = level;
    }
    return map;
  }, {});
}

/** Filled out for every section, so a grid never has a row with no answer. */
export function fullAccess(access: SectionAccessMap): SectionAccessMap {
  return SECTIONS.reduce<SectionAccessMap>((map, section) => {
    map[section.id] = access[section.id] ?? "none";
    return map;
  }, {});
}

/** Whether the grid still matches what its roles would have given it. */
export function matchesPreset(roles: AdminRole[], access: SectionAccessMap): boolean {
  const preset = fullAccess(presetAccess(roles));
  const current = fullAccess(access);
  return SECTIONS.every((section) => preset[section.id] === current[section.id]);
}

/** Section id → label, for the screens that summarise a grid in words. */
export const SECTION_LABELS: Record<SectionId, string> = SECTIONS.reduce(
  (map, section) => {
    map[section.id] = section.label;
    return map;
  },
  {} as Record<SectionId, string>
);

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
  /** The roles granted, which seed the grid below and label the account. */
  roles: AdminRole[];
  /**
   * What this account may actually do, section by section.
   *
   * Seeded from the roles when access is granted, then adjustable for this one
   * person — so it can differ from what the roles imply, and it, not the roles,
   * is what the portal should read.
   */
  access: SectionAccessMap;
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

type AdminUserSeed = Omit<AdminUser, "access">;

/**
 * Seeded accounts carry roles only. Their grid is what those roles grant —
 * built here rather than written out, so a seed cannot drift from the preset
 * it is supposed to be an example of.
 */
const seededAccounts: AdminUserSeed[] = [
  /* The account the district is run from, and the one every other account here
     was invited by. Without it the seed has no Super Admin, and the role that
     grants the rest reads as one nobody holds. */
  {
    id: "ken-oyelaran-admin",
    name: "Ken Oyelaran",
    email: "koyelaran@edison.example.org",
    roles: ["super_admin"],
    scope: { type: "district" },
    status: "Active",
    lastLogin: "2026-07-17T13:40:00-04:00",
    dateAdded: "2025-08-01T08:00:00-04:00",
    invitedBy: "System"
  },
  {
    id: "priya-nair-admin",
    name: "Priya Nair",
    email: "pnair@edison.example.org",
    roles: ["it_admin"],
    scope: { type: "district" },
    status: "Active",
    lastLogin: "2026-07-17T12:05:00-04:00",
    dateAdded: "2025-08-14T09:00:00-04:00",
    invitedBy: "Ken Oyelaran"
  },
  {
    id: "dana-whitfield-admin",
    name: "Dana Whitfield",
    email: "dwhitfield@edison.example.org",
    roles: ["leadership", "school_admin"],
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
    roles: ["school_admin"],
    scope: { type: "school", schoolId: "lincoln-es" },
    status: "Inactive",
    lastLogin: "2026-04-02T11:20:00-04:00",
    dateAdded: "2025-08-20T14:00:00-04:00",
    invitedBy: "Priya Nair"
  },
  {
    id: "alicia-gomez-admin",
    name: "Alicia Gomez",
    email: "agomez@edison.example.org",
    roles: ["it_admin"],
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
    roles: ["school_admin"],
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
    roles: ["school_admin"],
    scope: { type: "school", schoolId: "edison-ms" },
    status: "Revoked",
    revokedFrom: "Active",
    lastLogin: "2026-05-29T08:47:00-04:00",
    dateAdded: "2025-08-22T11:15:00-04:00",
    invitedBy: "Priya Nair"
  }
];

export const adminUsers: AdminUser[] = seededAccounts.map((seed) => ({
  ...seed,
  access: fullAccess(presetAccess(seed.roles))
}));
