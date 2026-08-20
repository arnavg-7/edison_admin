"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useRoleAccess } from "@/lib/role-access-store";
import { useAdminScope } from "@/lib/admin-scope";
import { findInvite } from "@/lib/data/adminInvites";
import { sectionsForRoles } from "@/lib/data/roleAccess";
import {
  ADMIN_PERMISSION_LABELS,
  ADMIN_ROLE_LABELS,
  scopeLabel,
  type AdminUser
} from "@/lib/data/adminUsers";
import { SECTIONS, landingHref } from "@/lib/nav";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * What the invited person opens from their email.
 *
 * Deliberately not a portal screen: no sidebar section holds it, and whoever
 * follows the link has no session yet — see the ungated prefixes in nav.ts. It
 * states what is being granted before it is accepted, because "you have been
 * given admin access" is not something anyone should have to accept blind: the
 * roles, the level, the schools, and the actual list of screens those roles come
 * to under the district's current configuration.
 */
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { adminUsers } = useAdminUsers();

  const user = findInvite(adminUsers, decodeURIComponent(token));

  if (!user) {
    return (
      <section className="sf-main">
        <h1 className="sf-page-title">Invitation not found</h1>
        <EmptyState
          title="This link is no longer valid"
          message="The invitation may have been revoked, or the account removed. Ask whoever invited you to send a new one."
        />
      </section>
    );
  }

  return <InviteView user={user} />;
}

/**
 * Accepting is the one moment an account goes from invited to real, so it does
 * three things at once — approves the account, signs the session in as them, and
 * lands them where their access starts.
 */
function InviteView({ user }: { user: AdminUser }) {
  const { updateUser } = useAdminUsers();
  const { access } = useRoleAccess();
  const { signInAs } = useAdminScope();
  const router = useRouter();
  const [declined, setDeclined] = useState(false);

  const roles = user.roles.map((assignment) => assignment.role);
  const held = sectionsForRoles(access, roles);
  const sections = SECTIONS.filter((section) => held.includes(section.id));

  /* An invite that was accepted, revoked or handed back is not an invite any
     more, and the screen says which rather than offering a button that would
     quietly do nothing. */
  if (declined || user.status !== "Pending Invite") {
    const heading =
      declined || user.status === "Revoked"
        ? "This invitation was declined"
        : user.status === "Active"
          ? "This invitation has already been accepted"
          : "This invitation is no longer open";

    return (
      <section className="sf-main">
        <h1 className="sf-page-title">{heading}</h1>
        <EmptyState
          title={heading}
          message={
            user.status === "Active"
              ? `${user.name} already has access. Sign in as normal.`
              : "Ask whoever invited you to send a new invitation."
          }
        />
      </section>
    );
  }

  const accept = () => {
    updateUser(user.id, {
      // "Active" is the stored value the Approved tab reads — see
      // ADMIN_STATUS_LABELS, which is where the two names are reconciled.
      status: "Active",
      lastLogin: new Date().toISOString()
    });
    signInAs(user.id);
    router.replace(landingHref(held, user.scope.type === "school" ? user.scope.schoolId : null));
  };

  const decline = () => {
    updateUser(user.id, { status: "Revoked", revokedFrom: "Pending Invite" });
    setDeclined(true);
  };

  const viewOnly = user.roles.every((assignment) => assignment.permission === "view");

  return (
    <section className="sf-main sf-invite">
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h1 className="sf-page-title">Edison360 Admin</h1>
          <span className="sf-panel-note">Invitation</span>
        </div>

        <p className="sf-page-sub">
          {user.invitedBy} has given <strong>{user.name}</strong> ({user.email}) admin access to
          the Edison360 portal.
        </p>

        <dl className="sf-stat-row">
          <div>
            <dt>Role{user.roles.length === 1 ? "" : "s"}</dt>
            <dd className="sf-stat-small">
              {user.roles
                .map(
                  (assignment) =>
                    `${ADMIN_ROLE_LABELS[assignment.role]} · ${ADMIN_PERMISSION_LABELS[
                      assignment.permission
                    ].toLowerCase()}`
                )
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt>Schools</dt>
            <dd className="sf-stat-small">{scopeLabel(user.scope)}</dd>
          </div>
          <div>
            <dt>Sections</dt>
            <dd className="sf-stat-small">{sections.length}</dd>
          </div>
        </dl>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>What you will be able to open</h2>
          <span className="sf-panel-note">As the district has these roles configured today</span>
        </div>

        {sections.length === 0 ? (
          <EmptyState
            title="No sections yet"
            message="The roles on this invitation currently open nothing. You can still accept — whoever invited you can grant sections at any time, and they appear without a new invitation."
          />
        ) : (
          <ul className="sf-invite-sections">
            {sections.map((section) => (
              <li key={section.id}>
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
                {section.label}
              </li>
            ))}
          </ul>
        )}

        {viewOnly ? (
          <p className="sf-card-hint">
            <StatusBadge tone="neutral">View only</StatusBadge> You will be able to read these
            screens but not change anything on them.
          </p>
        ) : null}
      </div>

      <div className="sf-invite-actions">
        <Button onClick={accept}>Accept and open the portal</Button>
        <Button color="secondary" onClick={decline}>
          Decline
        </Button>
      </div>
    </section>
  );
}
