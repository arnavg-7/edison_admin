"use client";

import { useState } from "react";
import {
  managedUsers,
  provisioningRequests,
  type ManagedUser
} from "@/lib/data/systemSettings";
import { auditLog } from "@/lib/data/systemSettings";
import {
  ROLE_LABELS,
  SECTIONS,
  SECTION_ACCESS,
  type Role
} from "@/lib/role/roles";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { SettingsScreenGuard } from "@/components/settings/SettingsScreenGuard";
import { userSummary } from "@/lib/data/users";

const ROLE_ORDER: Role[] = ["leadership", "portal_admin", "it_admin"];

export default function UserManagementPage() {
  const [users, setUsers] = useState<ManagedUser[]>(managedUsers);

  const changeRole = (id: string, role: Role) => {
    setUsers((current) => current.map((user) => (user.id === id ? { ...user, role } : user)));
  };

  const recentChanges = auditLog.filter((entry) => entry.action === "Changed role").length;

  return (
    <SettingsScreenGuard screen="users">
      <div className="admin-content-panel">
        <h2>Overview</h2>
        <div className="home-panel-stats">
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
        <FreshnessStamp asOf={userSummary.asOf} source="admin_db" cadence="Immediate on write" />
      </div>

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Pending provisioning requests</h2>
          <StatusBadge tone={provisioningRequests.length > 0 ? "warn" : "ok"}>
            {provisioningRequests.length} pending
          </StatusBadge>
        </div>

        <table className="admin-table">
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
                <td>{ROLE_LABELS[request.requestedRole]}</td>
                <td>{formatDateTime(request.requestedOn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-content-panel">
        <h2>Role assignments</h2>
        <table className="admin-table">
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
                    className="inline-select"
                    value={user.role}
                    onChange={(event) => changeRole(user.id, event.target.value as Role)}
                  >
                    {ROLE_ORDER.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
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

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Permissions by role</h2>
          <span className="config-status-summary">
            The same model the sidebar and every section guard read
          </span>
        </div>

        <table className="admin-table permission-matrix">
          <thead>
            <tr>
              <th scope="col">Section</th>
              {ROLE_ORDER.map((role) => (
                <th scope="col" key={role}>{ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((section) => (
              <tr key={section.id}>
                <td>{section.label}</td>
                {ROLE_ORDER.map((role) => (
                  <td key={role}>
                    {SECTION_ACCESS[section.id].includes(role) ? (
                      <StatusBadge tone="ok">Access</StatusBadge>
                    ) : (
                      <span className="permission-none">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsScreenGuard>
  );
}
