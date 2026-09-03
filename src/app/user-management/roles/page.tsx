"use client";

import {
  ADMIN_ROLE_GRANTS,
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * What each role grants — reference, not configuration.
 *
 * There is nothing to set here on purpose. Access follows the role, so two
 * School Admins cannot differ, and there is no per-section switch to drift from
 * what the role is understood to mean. This page is the answer to "what am I
 * about to give this person", read from the same definition the invite drawer
 * shows them.
 */
export default function RolesPage() {
  const { adminUsers } = useAdminUsers();
  const mounted = useMounted();

  return (
    <div className="role-cards">
      {ADMIN_ROLE_ORDER.map((role) => {
        const grants = ADMIN_ROLE_GRANTS[role];
        const held = mounted
          ? adminUsers.filter((user) => user.role === role && user.status !== "Disabled").length
          : 0;

        return (
          <section className="sf-panel role-card" key={role}>
            <div className="sf-panel-head">
              <h2>{ADMIN_ROLE_LABELS[role]}</h2>
              <StatusBadge tone={held > 0 ? "ok" : "neutral"}>
                {held} {held === 1 ? "account" : "accounts"}
              </StatusBadge>
            </div>

            <p className="role-card-reach">{grants.reach}</p>

            <ul className="role-grant-list">
              {grants.grants.map((line) => (
                <li className="is-granted" key={line}>
                  {line}
                </li>
              ))}
              {grants.denies.map((line) => (
                <li className="is-denied" key={line}>
                  {line}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {/* Says why the page has no controls, so its absence reads as a decision. */}
      <p className="sf-panel-note role-cards-note">
        Access follows the role — there is nothing to configure per person. A School Admin does the
        same job as a Super Admin over one assigned school, so changing what someone can do means
        changing their role or their school on their account.
      </p>
    </div>
  );
}
