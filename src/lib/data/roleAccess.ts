import { SECTIONS, type SectionId } from "@/lib/nav";
import { ADMIN_ROLE_ORDER, LOCKED_ROLE, type AdminRole } from "./adminUsers";

/**
 * What each role can reach, as data rather than as a rule in the code.
 *
 * This is the seed. The live map is edited on User Management → Roles & Access
 * and kept in role-access-store, because which sections a role holds is a
 * decision the district makes about its own staff, not one this codebase should
 * be making for them. A role with no sections is legal and means exactly what it
 * says: the account can sign in and has nowhere to go.
 *
 * Super Admin is the exception and holds everything, always — see LOCKED_ROLE.
 * An account's own sections are the union of the roles it holds, so somebody
 * carrying Leadership and Portal Administrator sees both sets.
 *
 * TODO: replace with the real Admin DB role contract. The shape is what that
 * table needs — a row per role, a column per section — so swapping the source
 * is a data change, not a code change.
 */
export type RoleAccessMap = Record<AdminRole, SectionId[]>;

export const seedRoleAccess: RoleAccessMap = {
  // Every section, and not editable: this is the role that configures the rest.
  super_admin: SECTIONS.map((section) => section.id),
  /* Owns who can sign in and the structure they sign in to — accounts, the
     district hierarchy, and the settings that are not academic content. */
  it_administrator: ["home", "user-management", "school-setup", "system-settings"],
  /* Keeps what students and faculty see current: the grade-level configuration
     and the goals set against it, plus the alerts that go out. */
  portal_administrator: [
    "home",
    "skills-development",
    "academic-goals",
    "alerts",
    "system-settings"
  ],
  // A read on the numbers, and nothing else.
  leadership: ["reporting"]
};

/** Whether this role's sections can be changed on Roles & Access. */
export function isRoleEditable(role: AdminRole): boolean {
  return role !== LOCKED_ROLE;
}

/** Every section the roles held add up to, in the order SECTIONS declares. */
export function sectionsForRoles(access: RoleAccessMap, roles: AdminRole[]): SectionId[] {
  const held = new Set(roles.flatMap((role) => access[role] ?? []));
  return SECTIONS.filter((section) => held.has(section.id)).map((section) => section.id);
}

/** Role names in display order, for a summary line. */
export function orderedRoles(roles: AdminRole[]): AdminRole[] {
  return ADMIN_ROLE_ORDER.filter((role) => roles.includes(role));
}
