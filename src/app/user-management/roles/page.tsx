"use client";

import { SECTIONS } from "@/lib/nav";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ROLE_PRESETS,
  SECTION_LEVEL_LABELS,
  adminUsers as seededAdminUsers,
  fullAccess,
  roleAssignmentsInclude,
  type AdminRole
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * The three roles this portal grants, and the access each one starts with.
 *
 * Reference, not a form. A role is a preset here: granting it fills an
 * account's grid with these levels, and whoever grants it can then change any
 * row for that person before saving. So this screen answers "what am I about to
 * hand over", and the account itself answers "what did they end up with".
 *
 * A matrix rather than cards: the useful reading is across, because the
 * decision being made is which of three columns a section should sit in.
 */
export default function RolesAndPermissionsPage() {
  const { adminUsers: storedAdminUsers } = useAdminUsers();
  const mounted = useMounted();

  // Seed until this page hydrates — see useMounted.
  const adminUsers = mounted ? storedAdminUsers : seededAdminUsers;

  const holders = (role: AdminRole) =>
    adminUsers.filter(
      (user) => user.status === "Active" && roleAssignmentsInclude(user.roles, role)
    ).length;

  return (
    <>
      <p className="sf-card-hint">
        Roles are a starting point. Every account keeps its own grid, so one person can hold
        School Admin and still be view-only somewhere the role would have granted edit &mdash;
        the account is where that is set, and where it is read back.
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>What each role grants</h2>
          <span className="sf-panel-note">Applied when the role is granted, then adjustable</span>
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
                    const level = fullAccess(ROLE_PRESETS[role].access)[section.id];
                    return (
                      <td key={role}>
                        {level === "none" ? (
                          <span className="list-editor-item-detail">&mdash;</span>
                        ) : (
                          <StatusBadge tone={level === "edit" ? "ok" : "neutral"}>
                            {SECTION_LEVEL_LABELS[level]}
                          </StatusBadge>
                        )}
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
              <span className="sf-panel-note">
                {count} {count === 1 ? "account" : "accounts"}
              </span>
            </div>

            <p className="sf-card-hint">
              {preset.purpose} <span className="sf-role-who">{preset.who}</span>
            </p>

            {preset.grants ? (
              <p className="sf-card-hint">
                <strong>Can grant:</strong>{" "}
                {preset.grants.map((entry) => ADMIN_ROLE_LABELS[entry]).join(", ")}.
              </p>
            ) : (
              <p className="sf-card-hint">
                <strong>Can grant:</strong> nothing &mdash; this role does not open User Management.
              </p>
            )}

            {preset.excluded.length > 0 ? (
              <ul className="sf-role-chips is-excluded">
                {preset.excluded.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
