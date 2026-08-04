"use client";

import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  FIXED_ROLE_PERMISSION,
  defaultRolePermission,
  findRoleAssignment,
  type AdminPermission,
  type AdminRole,
  type AdminRoleAssignment
} from "@/lib/data/adminUsers";

const PERMISSION_ORDER: AdminPermission[] = ["view", "edit"];

/**
 * Roles are a checkbox group, not a dropdown — the brief is explicit that an
 * admin account can hold more than one role at once (e.g. a Principal who's
 * mostly Leadership but sometimes needs Portal Administrator edit access), and
 * a single-select combobox can't express that.
 *
 * Each checked role carries its own permission level, revealed inline beneath
 * the checkbox, because the levels aren't account-wide: the same person can be
 * view-only in one role and an editor in another. Roles pinned by
 * `FIXED_ROLE_PERMISSION` (Leadership) show a static label instead of a control
 * — there's no choice to make, so offering one would imply a capability that
 * doesn't exist.
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

  const setPermission = (role: AdminRole, permission: AdminPermission) => {
    onChange(value.map((entry) => (entry.role === role ? { ...entry, permission } : entry)));
  };

  return (
    <fieldset className="sf-checkbox-group" aria-describedby={error ? "role-group-error" : undefined}>
      <legend>{legend}</legend>

      {ADMIN_ROLE_ORDER.map((role) => {
        const assignment = findRoleAssignment(value, role);
        const fixed = FIXED_ROLE_PERMISSION[role];
        const label = ADMIN_ROLE_LABELS[role];

        return (
          <div className="sf-role-option" key={role}>
            <label className="sf-checkbox-option">
              <input type="checkbox" checked={Boolean(assignment)} onChange={() => toggle(role)} />
              <span>{label}</span>
              {fixed ? (
                <span className="sf-role-fixed-note">Always view only</span>
              ) : null}
            </label>

            {assignment && !fixed ? (
              <div
                className="sf-permission-toggle"
                role="radiogroup"
                aria-label={`${label} permission level`}
              >
                {PERMISSION_ORDER.map((permission) => (
                  <button
                    key={permission}
                    type="button"
                    role="radio"
                    aria-checked={assignment.permission === permission}
                    className={
                      assignment.permission === permission
                        ? "sf-permission-choice is-active"
                        : "sf-permission-choice"
                    }
                    onClick={() => setPermission(role, permission)}
                  >
                    {ADMIN_PERMISSION_LABELS[permission]}
                  </button>
                ))}
              </div>
            ) : null}
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
