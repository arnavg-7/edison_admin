"use client";

import { useAdminScope } from "@/lib/admin-scope";
import { ADMIN_ROLE_LABELS, scopeLabel } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Combobox } from "@/components/shared/Combobox";

/**
 * Whose portal you are looking at.
 *
 * Every account that can sign in was invited, given roles and given a scope on
 * User Management, and this reads that list back: pick a person and the portal
 * becomes theirs — the nav they were granted, the school they administer, the
 * read-only rules their permission level implies. There is nothing to configure
 * here, which is the point. Configuration happens where access is granted.
 *
 * Approved accounts only. A pending invite has not been accepted, and a revoked
 * or inactive account cannot sign in — offering them here would let the portal
 * demonstrate a state the real one refuses.
 *
 * TODO: with real auth this is the session, not a control. It exists so every
 * configured view can be reviewed from one browser, and is the piece to delete
 * when authentication lands — the label says as much rather than passing it off
 * as an account menu.
 */
export function SessionSwitcher() {
  const { user, signInAs, roles, sections, canEdit, school } = useAdminScope();
  const { adminUsers } = useAdminUsers();

  const options = adminUsers
    .filter((entry) => entry.status === "Active")
    .map((entry) => ({
      value: entry.id,
      label: `${entry.name} · ${entry.roles.map((role) => ADMIN_ROLE_LABELS[role.role]).join(" + ")}`
    }));

  return (
    <div className="sf-scope-switcher group-data-[collapsible=icon]:hidden">
      <label className="sf-field">
        <span>Signed in as</span>
        <Combobox
          options={options}
          value={user?.id ?? ""}
          onChange={signInAs}
          placeholder="Pick an account"
          ariaLabel="The admin account you are signed in as"
        />
      </label>

      {/* Says plainly what this is. Without it the control reads as a real
          account menu, and the difference matters to anyone reviewing it. */}
      <p className="sf-scope-switcher-note">
        Demo control &mdash; real access comes from your account.
      </p>

      {/* What this account was granted, in the terms User Management granted it:
          the roles, then how much of the district, then how many sections those
          roles came to. A role reconfigured there changes this line. */}
      <p className="sf-scope-switcher-note">
        {roles.length === 0
          ? "No role assigned — this account has nothing to open."
          : `${roles.map((role) => ADMIN_ROLE_LABELS[role]).join(" + ")} · ${
              canEdit ? "can edit" : "view only"
            }`}
      </p>

      <p className="sf-scope-switcher-note">
        {user ? scopeLabel(user.scope) : "District-wide"} · {sections.length}{" "}
        {sections.length === 1 ? "section" : "sections"}
      </p>

      {school ? (
        <p className="sf-scope-switcher-note">
          Screens below are limited to this school. Other schools are not listed.
        </p>
      ) : null}
    </div>
  );
}
