"use client";

import { SECTIONS } from "@/lib/nav";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  roleAssignmentsInclude,
  adminUsers as seededAdminUsers,
  type AdminRole
} from "@/lib/data/adminUsers";
import { ROLE_LEVEL_LABELS, ROLE_PERMISSIONS } from "@/lib/data/rolePermissions";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * The three jobs this portal grants, and what each one gets.
 *
 * Reference rather than a form: the roles come from the personas brief and are
 * not something an admin invents on a Tuesday. What this screen is for is the
 * question asked immediately before every invitation — "if I tick Portal
 * Administrator, what have I just given them?" — which was previously answered
 * only by knowing.
 *
 * One card per role rather than a matrix. A matrix reads across, and the useful
 * reading here is downward: a role is a job, and the sections, the level and
 * the exclusions are three facts about that one job.
 */
export default function RolesAndPermissionsPage() {
  const { adminUsers: storedAdminUsers } = useAdminUsers();
  const mounted = useMounted();

  // Seed until this page hydrates — see useMounted.
  const adminUsers = mounted ? storedAdminUsers : seededAdminUsers;

  /** Live accounts holding this role, which is what a change to it would reach. */
  const holders = (role: AdminRole) =>
    adminUsers.filter(
      (user) => user.status === "Active" && roleAssignmentsInclude(user.roles, role)
    ).length;

  return (
    <>
      <p className="sf-card-hint">
        An account can hold more than one role, and gets everything its roles grant between them.
        Scope is separate and set per account: the same role covers the district for one person and
        a single school for another.
      </p>

      {ADMIN_ROLE_ORDER.map((role) => {
        const permission = ROLE_PERMISSIONS[role];
        const granted = SECTIONS.filter((section) => permission.sections.includes(section.id));
        const count = holders(role);

        return (
          <div className="sf-panel" key={role}>
            <div className="sf-panel-head">
              <h2>{ADMIN_ROLE_LABELS[role]}</h2>
              <div className="sf-panel-head-end">
                <StatusBadge tone={permission.level === "read-write" ? "ok" : "neutral"}>
                  {ROLE_LEVEL_LABELS[permission.level]}
                </StatusBadge>
                <span className="sf-panel-note">
                  {count} {count === 1 ? "account" : "accounts"}
                </span>
              </div>
            </div>

            <p className="sf-card-hint">
              {permission.purpose} <span className="sf-role-who">{permission.who}</span>
            </p>

            <dl className="sf-role-grid">
              <div>
                <dt>Can open</dt>
                <dd>
                  <ul className="sf-role-chips">
                    {granted.map((section) => (
                      <li key={section.id}>{section.label}</li>
                    ))}
                  </ul>
                </dd>
              </div>

              <div>
                <dt>No access to</dt>
                <dd>
                  <ul className="sf-role-chips is-excluded">
                    {permission.excluded.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>

            {/* Where the brief grants something this portal has no screen for.
                On the role that was promised it, so the gap is read by whoever
                is about to hand that role out. */}
            {permission.notBuilt?.length ? (
              <p className="sf-card-hint">
                <strong>Not built yet:</strong> {permission.notBuilt.join("; ")}.
              </p>
            ) : null}

            {/* System Settings is one section holding two jobs' work, and only
                IT's half is IT's. Said here because the chip above says the
                section's name, not which half. */}
            {role === "it_administrator" ? (
              <p className="sf-card-hint">
                Within System Settings this role holds the audit log only — grade levels,
                subjects, the calendar and announcements belong to the Portal Administrator.
              </p>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
