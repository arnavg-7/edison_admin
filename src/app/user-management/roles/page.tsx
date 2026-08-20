"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { LockedIcon } from "@hugeicons/core-free-icons";
import { SECTIONS } from "@/lib/nav";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  FIXED_ROLE_PERMISSION,
  LOCKED_ROLE,
  defaultRolePermission,
  type AdminRole
} from "@/lib/data/adminUsers";
import { useRoleAccess } from "@/lib/role-access-store";
import { useAdminUsers } from "@/lib/admin-users-store";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * What each role can open, configured rather than coded.
 *
 * A role in this portal is not a rank — it is a list of sections, and this is
 * where that list is written. Ticking a section grants it to every account
 * holding the role, on their next render; unticking takes it away from them
 * just as immediately, including from anyone signed in right now.
 *
 * Roles down the side, sections across: the shape of the question an admin
 * actually asks, which is "who can get into System Settings" as often as it is
 * "what can Leadership do". A matrix answers both readings; a list of
 * checkboxes per role answers only the second.
 *
 * Super Admin is shown and locked. It is the role that configures the others,
 * and a portal where its User Management tick can be removed is one nobody can
 * get back into.
 */
export default function RolesAndAccessPage() {
  const { access, toggleSection, resetRole, isEdited } = useRoleAccess();
  const { adminUsers } = useAdminUsers();

  /** How many live accounts a change to this role would reach. */
  const holders = (role: AdminRole) =>
    adminUsers.filter(
      (user) => user.status === "Active" && user.roles.some((entry) => entry.role === role)
    ).length;

  return (
    <>
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Sections each role can open</h2>
          <span className="sf-panel-note">
            Applies to every account holding the role, immediately
          </span>
        </div>

        <p className="sf-card-hint">
          A role with no sections ticked can sign in and has nowhere to go — which is a legitimate
          way to park access without revoking it, and reads as exactly that on the account.
        </p>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Role</th>
                {SECTIONS.map((section) => (
                  <th key={section.id} scope="col">
                    {section.label}
                  </th>
                ))}
                <th scope="col">Accounts</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {ADMIN_ROLE_ORDER.map((role) => {
                const locked = role === LOCKED_ROLE;
                const held = access[role] ?? [];
                const fixed = FIXED_ROLE_PERMISSION[role];

                return (
                  <tr key={role}>
                    <td>
                      <div className="list-editor-item-title">
                        {ADMIN_ROLE_LABELS[role]}
                        {locked ? (
                          <HugeiconsIcon
                            icon={LockedIcon}
                            size={14}
                            strokeWidth={2}
                            className="ml-1.5 inline align-[-2px] opacity-60"
                          />
                        ) : null}
                      </div>
                      {/* The level is a property of the role, not of this
                          matrix — it is picked per account on the invite — but
                          a role pinned to one level can never be anything else,
                          which belongs next to its name. */}
                      <div className="list-editor-item-detail">
                        {fixed
                          ? `${ADMIN_PERMISSION_LABELS[fixed]}, always`
                          : `Defaults to ${ADMIN_PERMISSION_LABELS[
                              defaultRolePermission(role)
                            ].toLowerCase()}`}
                      </div>
                    </td>

                    {SECTIONS.map((section) => (
                      <td key={section.id}>
                        {/* Bare input: theme.css styles every checkbox in the
                            app, and a cell in a matrix has its column heading
                            as its visible label — the aria-label restates the
                            pair for anyone not reading across. */}
                        <input
                          type="checkbox"
                          checked={locked || held.includes(section.id)}
                          disabled={locked}
                          onChange={() => toggleSection(role, section.id)}
                          aria-label={`${ADMIN_ROLE_LABELS[role]} can open ${section.label}`}
                        />
                      </td>
                    ))}

                    <td>{holders(role)}</td>
                    <td>
                      <div className="sf-row-actions">
                        {locked ? (
                          <StatusBadge tone="neutral">Every section</StatusBadge>
                        ) : isEdited(role) ? (
                          <Button color="secondary" size="xs" onClick={() => resetRole(role)}>
                            Reset<span className="sf-sr-only"> {ADMIN_ROLE_LABELS[role]}</span>
                          </Button>
                        ) : (
                          <StatusBadge tone="neutral">As shipped</StatusBadge>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>What a role does not decide</h2>
        </div>
        <p className="sf-card-hint">
          <strong>Which schools.</strong> Scope is set per account, not per role: the same Super
          Admin role covers the district for one person and a single school for another.
        </p>
        <p className="sf-card-hint">
          <strong>View or edit.</strong> Picked per account when the invite is sent, since one
          person can hold a role to edit and another to read. Leadership is the exception and is
          always view-only.
        </p>
      </div>
    </>
  );
}
