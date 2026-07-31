"use client";

import { useRole } from "@/lib/role/RoleContext";
import { ROLE_LABELS, type Role } from "@/lib/role/roles";

const ROLE_ORDER: Role[] = ["leadership", "portal_admin", "it_admin"];

// Demo aid only — replaced by real authentication when SSO/IAM lands.
export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="role-switcher">
      <label htmlFor="role-switcher-select">Viewing as</label>
      <select
        id="role-switcher-select"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
      >
        {ROLE_ORDER.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value]}
          </option>
        ))}
      </select>
      <p className="role-switcher-note">Stands in for sign-in until SSO is wired up.</p>
    </div>
  );
}
