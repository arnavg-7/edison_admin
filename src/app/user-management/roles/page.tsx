"use client";

import { SECTIONS } from "@/lib/nav";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ROLE_PRESETS,
  SECTION_LEVEL_LABELS,
  SECTION_LEVEL_ORDER,
  adminUsers as seededAdminUsers,
  roleAssignmentsInclude,
  type AdminRole
} from "@/lib/data/adminUsers";
import { useRoleConfig } from "@/lib/role-config-store";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * What each role grants — set here, not in the code.
 *
 * A role is the starting grid an invitation copies onto an account. Changing it
 * changes what the next person granted that role receives; it does not reach
 * back into accounts already granted it, because their grid was saved when
 * access was given and rewriting it would change what people can do without
 * anyone deciding to. Each role says how many accounts that is.
 *
 * Reporting has no Edit. The section is read-only by construction — every
 * figure on it is a Salesforce report — so the level would be one no screen can
 * honour.
 *
 * A matrix, because the useful reading is across: the decision being made is
 * which column a section belongs in.
 */
const READ_ONLY_SECTIONS = new Set(["reporting"]);

export default function RolesAndPermissionsPage() {
  const { config, setLevel, resetRole, isEdited } = useRoleConfig();
  const { adminUsers: storedAdminUsers } = useAdminUsers();
  const mounted = useMounted();

  // Seed until this page hydrates — see useMounted.
  const adminUsers = mounted ? storedAdminUsers : seededAdminUsers;

  const holders = (role: AdminRole) =>
    adminUsers.filter(
      (user) => user.status !== "Inactive" && roleAssignmentsInclude(user.roles, role)
    ).length;

  return (
    <>
      <p className="sf-card-hint">
        These are the four roles this portal grants. Setting a level here decides what the{" "}
        <em>next</em> account granted that role starts with — accounts that already hold it keep
        the access they were given, which is on the account itself.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>What each role grants</h2>
          <span className="sf-panel-note">Saved as you change it</span>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Section</th>
                {ADMIN_ROLE_ORDER.map((role) => (
                  <th key={role} scope="col">
                    {ADMIN_ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <tr key={section.id}>
                  <td>{section.label}</td>
                  {ADMIN_ROLE_ORDER.map((role) => {
                    const current = config[role]?.[section.id] ?? "none";
                    const levels = READ_ONLY_SECTIONS.has(section.id)
                      ? SECTION_LEVEL_ORDER.filter((level) => level !== "edit")
                      : SECTION_LEVEL_ORDER;

                    return (
                      <td key={role}>
                        <div
                          className="sf-access-levels"
                          role="radiogroup"
                          aria-label={`${ADMIN_ROLE_LABELS[role]} access to ${section.label}`}
                        >
                          {levels.map((level) => (
                            <button
                              key={level}
                              type="button"
                              role="radio"
                              aria-checked={current === level}
                              className={
                                current === level
                                  ? "sf-access-choice is-active"
                                  : "sf-access-choice"
                              }
                              data-level={level}
                              onClick={() => setLevel(role, section.id, level)}
                            >
                              {SECTION_LEVEL_LABELS[level]}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ADMIN_ROLE_ORDER.map((role) => {
        const preset = ROLE_PRESETS[role];
        const count = holders(role);

        return (
          <div className="sf-panel" key={role}>
            <div className="sf-panel-head">
              <h2>{ADMIN_ROLE_LABELS[role]}</h2>
              <div className="sf-panel-head-end">
                <span className="sf-panel-note">
                  {count} {count === 1 ? "account" : "accounts"}
                </span>
                {isEdited(role) ? (
                  <Button color="secondary" size="xs" onClick={() => resetRole(role)}>
                    Reset<span className="sf-sr-only"> {ADMIN_ROLE_LABELS[role]}</span>
                  </Button>
                ) : (
                  <StatusBadge tone="neutral">As shipped</StatusBadge>
                )}
              </div>
            </div>

            <p className="sf-card-hint">
              {preset.purpose} <span className="sf-role-who">{preset.who}</span>
            </p>

            <p className="sf-card-hint">
              <strong>Can grant:</strong>{" "}
              {preset.grants
                ? preset.grants.map((entry) => ADMIN_ROLE_LABELS[entry]).join(", ")
                : "nothing — this role does not open User Management."}
            </p>

            {preset.notBuilt?.length ? (
              <p className="sf-card-hint">
                <strong>Not built yet:</strong> {preset.notBuilt.join("; ")}.
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
