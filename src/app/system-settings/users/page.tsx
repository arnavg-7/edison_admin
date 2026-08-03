"use client";

import { useState } from "react";
import {
  auditLog,
  managedUsers,
  provisioningRequests,
  type ManagedUser
} from "@/lib/data/systemSettings";
import { USER_ROLE_LABELS, USER_ROLE_ORDER, type UserRole } from "@/lib/data/userRoles";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { userSummary } from "@/lib/data/users";

/**
 * v2 has a single Super Admin role for Admin access, so v1's section-by-role
 * permission matrix is gone — there is nothing left to gate. What remains is the
 * user directory: who exists, what they are, and what changed recently.
 */
export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>(managedUsers);

  const changeRole = (id: string, role: UserRole) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
  };

  const recentChanges = auditLog.filter((entry) => entry.action === "Changed role").length;

  return (
    <>
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Overview</h2>
        </div>

        <div className="sf-stat-row">
          <div>
            <dt>Total users</dt>
            <dd>{formatNumber(userSummary.totalUsers)}</dd>
          </div>
          <div>
            <dt>Pending provisioning</dt>
            <dd>{provisioningRequests.length}</dd>
          </div>
          <div>
            <dt>Recent access changes</dt>
            <dd>{recentChanges}</dd>
          </div>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Pending provisioning requests</h2>
          <StatusBadge tone={provisioningRequests.length > 0 ? "warn" : "ok"}>
            {provisioningRequests.length} pending
          </StatusBadge>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Requested role</th>
                <th scope="col">Requested</th>
              </tr>
            </thead>
            <tbody>
              {provisioningRequests.map((request) => (
                <tr key={request.id}>
                  <td>{request.name}</td>
                  <td>{USER_ROLE_LABELS[request.requestedRole]}</td>
                  <td>{formatDateTime(request.requestedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Role assignments</h2>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Last active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="sf-input"
                      value={user.role}
                      aria-label={`Role for ${user.name}`}
                      onChange={(event) => changeRole(user.id, event.target.value as UserRole)}
                    >
                      {USER_ROLE_ORDER.map((role) => (
                        <option key={role} value={role}>
                          {USER_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{formatDateTime(user.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Directory by role</h2>
        </div>

        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Role</th>
                <th scope="col">People</th>
              </tr>
            </thead>
            <tbody>
              {userSummary.byRole.map((entry) => (
                <tr key={entry.role}>
                  <td>{USER_ROLE_LABELS[entry.role]}</td>
                  <td>{formatNumber(entry.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
