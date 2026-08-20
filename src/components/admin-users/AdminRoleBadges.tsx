import {
  ADMIN_ROLE_SHORT_LABELS,
  SECTION_LEVEL_LABELS,
  highestLevel,
  type AdminRole,
  type SectionAccessMap
} from "@/lib/data/adminUsers";

/**
 * One chip per role, and one for what the account can actually do.
 *
 * The level comes off the grid, not off the roles: the grid is what was saved,
 * and after any adjustment it is the only thing that still describes the
 * account accurately. An account whose grid has been narrowed to nothing says
 * so rather than showing a role it cannot use.
 */
export function AdminRoleBadges({
  roles,
  access
}: {
  roles: AdminRole[];
  access: SectionAccessMap;
}) {
  const level = highestLevel(access);

  return (
    <span className="sf-role-badges">
      {roles.map((role) => (
        <span className="sf-role-badge" key={role}>
          {ADMIN_ROLE_SHORT_LABELS[role]}
        </span>
      ))}
      <span className="sf-role-badge-level">{SECTION_LEVEL_LABELS[level]}</span>
    </span>
  );
}
