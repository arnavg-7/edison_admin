"use client";

import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ROLE_PRESETS,
  type AdminRole
} from "@/lib/data/adminUsers";

/**
 * Which roles an account holds.
 *
 * A checkbox group, not a dropdown: an account can hold more than one at once —
 * a principal who reads the district's reporting and administers their own
 * school — and a single-select cannot express that.
 *
 * Ticking one fills the access grid below with that role's levels. It is a
 * starting point and says so, because the grid beneath is what actually gets
 * saved and can differ from any role in the list.
 *
 * `grantable` is what the person doing the granting is allowed to hand out. A
 * School Admin cannot create a Super Admin, so that row is not offered — absent
 * rather than disabled, since it is not a thing they can ask for.
 */
export function RoleCheckboxes({
  value,
  onChange,
  grantable = ADMIN_ROLE_ORDER,
  legend = "Roles",
  error
}: {
  value: AdminRole[];
  onChange: (roles: AdminRole[]) => void;
  grantable?: AdminRole[];
  legend?: string;
  error?: string;
}) {
  const toggle = (role: AdminRole) =>
    onChange(
      value.includes(role)
        ? value.filter((entry) => entry !== role)
        : ADMIN_ROLE_ORDER.filter((entry) => entry === role || value.includes(entry))
    );

  return (
    <fieldset className="sf-checkbox-group" aria-describedby={error ? "role-group-error" : undefined}>
      <legend>{legend}</legend>

      {ADMIN_ROLE_ORDER.filter((role) => grantable.includes(role)).map((role) => (
        <div className="sf-role-option" key={role}>
          <label className="sf-checkbox-option">
            <input
              type="checkbox"
              checked={value.includes(role)}
              onChange={() => toggle(role)}
            />
            <span>{ADMIN_ROLE_LABELS[role]}</span>
          </label>
          <p className="sf-role-grant">{ROLE_PRESETS[role].purpose}</p>
        </div>
      ))}

      {error ? (
        <p className="sf-field-error" id="role-group-error">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
