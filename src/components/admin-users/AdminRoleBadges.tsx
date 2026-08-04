import { ADMIN_ROLE_LABELS, type AdminRoleAssignment } from "@/lib/data/adminUsers";

/**
 * A person can hold more than one admin role — shown as one chip per role,
 * with the role's own permission level, since two roles on the same account can
 * differ (edit on one, view-only on the other).
 */
export function AdminRoleBadges({ roles }: { roles: AdminRoleAssignment[] }) {
  return (
    <span className="sf-role-badges">
      {roles.map(({ role, permission }) => (
        <span className="sf-role-badge" key={role}>
          {ADMIN_ROLE_LABELS[role]}
          <span className="sf-role-badge-level">{permission === "edit" ? "Edit" : "View"}</span>
        </span>
      ))}
    </span>
  );
}
