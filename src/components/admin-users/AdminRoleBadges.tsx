import { ADMIN_ROLE_SHORT_LABELS, type AdminRoleAssignment } from "@/lib/data/adminUsers";
import { ROLE_PERMISSIONS } from "@/lib/data/rolePermissions";

/**
 * A person can hold more than one admin role — one chip per role, with the
 * level that role carries.
 *
 * Short names here: these sit in a table cell beside four other columns, and
 * "Portal / Program Administrator" spelled out three times to a row turns the
 * column into prose. The full names are on Roles & Permissions, one click away.
 *
 * The level is the role's own — read the note on FIXED_ROLE_PERMISSION — so it
 * is looked up rather than read off the assignment, which cannot disagree with
 * it but could be stale in storage.
 */
export function AdminRoleBadges({ roles }: { roles: AdminRoleAssignment[] }) {
  return (
    <span className="sf-role-badges">
      {roles.map(({ role }) => (
        <span className="sf-role-badge" key={role}>
          {ADMIN_ROLE_SHORT_LABELS[role]}
          <span className="sf-role-badge-level">
            {ROLE_PERMISSIONS[role].level === "read-write" ? "Edit" : "View"}
          </span>
        </span>
      ))}
    </span>
  );
}
