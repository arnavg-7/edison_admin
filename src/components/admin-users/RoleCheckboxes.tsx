"use client";

import { ADMIN_ROLE_LABELS, ADMIN_ROLE_ORDER, type AdminRole } from "@/lib/data/adminUsers";

/**
 * Roles are a checkbox group, not a dropdown — the brief is explicit that an
 * admin account can hold more than one role at once (e.g. a Principal who's
 * mostly Leadership but sometimes needs Portal Administrator edit access), and
 * a single-select combobox can't express that.
 */
export function RoleCheckboxes({
  value,
  onChange,
  legend = "Roles"
}: {
  value: AdminRole[];
  onChange: (roles: AdminRole[]) => void;
  legend?: string;
}) {
  const toggle = (role: AdminRole) => {
    onChange(value.includes(role) ? value.filter((entry) => entry !== role) : [...value, role]);
  };

  return (
    <fieldset className="sf-checkbox-group">
      <legend>{legend}</legend>
      {ADMIN_ROLE_ORDER.map((role) => (
        <label className="sf-checkbox-option" key={role}>
          <input type="checkbox" checked={value.includes(role)} onChange={() => toggle(role)} />
          <span>{ADMIN_ROLE_LABELS[role]}</span>
        </label>
      ))}
    </fieldset>
  );
}
