"use client";

import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  defaultRolePermission,
  findRoleAssignment,
  type AdminRole,
  type AdminRoleAssignment
} from "@/lib/data/adminUsers";
import { ROLE_LEVEL_LABELS, ROLE_PERMISSIONS } from "@/lib/data/rolePermissions";
import { SECTIONS } from "@/lib/nav";

/** "Home, Goals and 3 more" — what the role opens, without a wall of chips. */
function sectionSummary(role: AdminRole): string {
  const labels = SECTIONS.filter((section) =>
    ROLE_PERMISSIONS[role].sections.includes(section.id)
  ).map((section) => section.label);

  if (labels.length === 0) return "No sections";
  if (labels.length <= 3) return labels.join(", ");
  return `${labels.slice(0, 2).join(", ")} and ${labels.length - 2} more`;
}

/**
 * Roles are a checkbox group, not a dropdown — an admin account can hold more
 * than one at once (a principal who is mostly Leadership but also keeps the
 * portal's goals current), and a single-select combobox cannot express that.
 *
 * Each role states what it grants, because that is the decision being made:
 * ticking a box here is what someone can open on Monday, and an admin should
 * not have to hold three role definitions in their head to send an invitation.
 *
 * There is no permission control any more. The level belongs to the role, not
 * to the account holding it — see FIXED_ROLE_PERMISSION — so it is stated
 * beside the name rather than offered as a choice that has one answer.
 */
export function RoleCheckboxes({
  value,
  onChange,
  legend = "Roles",
  error
}: {
  value: AdminRoleAssignment[];
  onChange: (roles: AdminRoleAssignment[]) => void;
  legend?: string;
  error?: string;
}) {
  const toggle = (role: AdminRole) => {
    onChange(
      findRoleAssignment(value, role)
        ? value.filter((entry) => entry.role !== role)
        : [...value, { role, permission: defaultRolePermission(role) }]
    );
  };

  return (
    <fieldset className="sf-checkbox-group" aria-describedby={error ? "role-group-error" : undefined}>
      <legend>{legend}</legend>

      {ADMIN_ROLE_ORDER.map((role) => {
        const assignment = findRoleAssignment(value, role);
        const permission = ROLE_PERMISSIONS[role];

        return (
          <div className="sf-role-option" key={role}>
            <label className="sf-checkbox-option">
              <input type="checkbox" checked={Boolean(assignment)} onChange={() => toggle(role)} />
              <span>{ADMIN_ROLE_LABELS[role]}</span>
              <span className="sf-role-fixed-note">{ROLE_LEVEL_LABELS[permission.level]}</span>
            </label>

            {/* What the tick actually hands over. Stated for every role, not
                only the checked one: choosing between them is the point. */}
            <p className="sf-role-grant">{sectionSummary(role)}</p>
          </div>
        );
      })}

      {error ? (
        <p className="sf-field-error" id="role-group-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
