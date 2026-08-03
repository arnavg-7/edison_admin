"use client";

import { useMemo } from "react";
import { scopeLabel } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { AdminRoleBadges } from "@/components/admin-users/AdminRoleBadges";

/** Invites sent but not yet accepted — a filtered slice of the same admin
    user list, the same way Alert History is a filtered slice of alerts. */
export default function PendingInvitationsPage() {
  const { adminUsers, updateUser, removeUser } = useAdminUsers();

  const pending = useMemo(
    () =>
      adminUsers
        .filter((user) => user.status === "Pending Invite")
        .slice()
        .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)),
    [adminUsers]
  );

  const resend = (id: string) => {
    // TODO: no email backend yet — this only bumps the sent date so the
    // admin can see the resend registered.
    updateUser(id, { dateAdded: new Date().toISOString() });
  };

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Pending invitations</h2>
        <span className="sf-panel-note">{pending.length} awaiting response</span>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          title="No pending invites"
          message="Every invited admin account has been accepted, or nothing has been invited yet."
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role(s)</th>
                <th scope="col">Scope</th>
                <th scope="col">Invited by</th>
                <th scope="col">Invited</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <AdminRoleBadges roles={user.roles} />
                  </td>
                  <td>{scopeLabel(user.scope)}</td>
                  <td>{user.invitedBy}</td>
                  <td>{formatDateTime(user.dateAdded)}</td>
                  <td>
                    <div className="sf-row-actions">
                      <button type="button" className="sf-btn sf-btn--sm" onClick={() => resend(user.id)}>
                        Resend
                      </button>
                      <button
                        type="button"
                        className="sf-btn sf-btn--sm sf-btn--danger"
                        onClick={() => removeUser(user.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
