import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/data/adminUsers";

/** A person can hold more than one admin role — shown as one chip per role. */
export function AdminRoleBadges({ roles }: { roles: AdminRole[] }) {
  return (
    <span className="sf-role-badges">
      {roles.map((role) => (
        <span className="sf-role-badge" key={role}>
          {ADMIN_ROLE_LABELS[role]}
        </span>
      ))}
    </span>
  );
}
