import type { SectionId } from "@/lib/nav";
import type { AdminRole } from "./adminUsers";

/**
 * What each admin role is for, and what holding it gets you.
 *
 * Straight from the personas brief §4, which describes three jobs rather than
 * three ranks: Leadership reads the numbers, the Portal Administrator keeps
 * what students and faculty see current, and IT keeps the data arriving and
 * decides who gets in. None of them is a subset of another — the Portal
 * Administrator has write access to more screens than Leadership can open, and
 * IT holds the one section neither of the others can see.
 *
 * `level` belongs to the role and not to the account holding it. The brief is
 * unambiguous: Leadership is a read-only audience, and the other two have full
 * read and write on what they own. An admin picking "view only" for a Portal
 * Administrator would be inventing a fourth job.
 *
 * `excluded` is written out rather than inferred from the sections above it.
 * "No access to Integrations or the audit log" is a statement someone signed
 * off, and it stays legible even where the portal has no section to point at.
 *
 * TODO: replace with the real Admin DB role contract. The shape is what that
 * table needs — a row per role, the sections it grants, the level it grants
 * them at.
 */

export type RoleLevel = "read" | "read-write";

export const ROLE_LEVEL_LABELS: Record<RoleLevel, string> = {
  read: "Read-only",
  "read-write": "Full read & write"
};

export type RolePermission = {
  /** The job, in the brief's own words. */
  purpose: string;
  /** Who this is, day to day. */
  who: string;
  level: RoleLevel;
  /** Sections of this portal the role opens. */
  sections: SectionId[];
  /** Named as out of reach, whether or not this portal has a screen for it. */
  excluded: string[];
  /**
   * Things the brief asks for that this portal has no section for, so the
   * gap is visible on the screen rather than discovered in review.
   */
  notBuilt?: string[];
};

export const ROLE_PERMISSIONS: Record<AdminRole, RolePermission> = {
  leadership: {
    purpose: "A fast read on how the platform and their students and faculty are doing.",
    who: "Superintendent, principal, assistant principal.",
    level: "read",
    sections: ["reporting"],
    excluded: [
      "Portal configuration",
      "Goals configuration",
      "Alerts configuration",
      "System Settings",
      "User Management",
      "Integrations"
    ]
  },
  portal_administrator: {
    purpose: "Keeps what students and faculty see up to date, day to day.",
    who: "Ken42 implementation team, or a district instructional-technology lead.",
    level: "read-write",
    /* Portal Configuration in the brief is this portal's Skills & Development:
       the development areas and skills profile configured per grade are exactly
       what that row lists. */
    sections: ["home", "skills-development", "academic-goals", "alerts", "system-settings"],
    excluded: ["Integrations internals", "User Management", "Audit log"],
    notBuilt: ["Resources & Content — confirmed as not going on this portal"]
  },
  it_administrator: {
    purpose: "Keeps data flowing correctly, and controls who has access.",
    who: "District IT, or Ken42 technical ops.",
    level: "read-write",
    /* System Settings is theirs only in part — the audit log, not the academic
       configuration that shares the section. The route gate holds the same line;
       see SECTION_LIMITS in nav.ts. */
    sections: ["home", "user-management", "system-settings"],
    excluded: ["Portal configuration", "Goals", "Alerts", "Resources content"],
    notBuilt: ["Integrations — Genesis/SIS ingest and Classroom sync have no section yet"]
  }
};

export function roleLevel(role: AdminRole): RoleLevel {
  return ROLE_PERMISSIONS[role].level;
}

export function roleSections(role: AdminRole): SectionId[] {
  return ROLE_PERMISSIONS[role].sections;
}
