"use client";

import { useMemo, useState } from "react";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  roleAssignmentsInclude,
  scopeLabel,
  type AdminRole,
  type AdminUser,
  type AdminUserStatus
} from "@/lib/data/adminUsers";
import { schools } from "@/lib/data/schools";
import { useAdminUsers } from "@/lib/admin-users-store";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { AdminRoleBadges } from "@/components/admin-users/AdminRoleBadges";
import { EditAdminUserModal } from "@/components/admin-users/EditAdminUserModal";
import { BulkRoleReassignModal } from "@/components/admin-users/BulkRoleReassignModal";

type SortOrder = "recent" | "oldest";

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All roles" },
  ...ADMIN_ROLE_ORDER.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }))
];

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Pending Invite", label: "Pending Invite" },
  { value: "Inactive", label: "Inactive" }
];

const SCOPE_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All scopes" },
  { value: "district", label: "District-wide" },
  ...schools.map((school) => ({ value: school.id, label: school.name }))
];

const SORT_OPTIONS: ComboboxOption[] = [
  { value: "recent", label: "Last login: most recent" },
  { value: "oldest", label: "Last login: oldest first" }
];

const STATUS_TONE: Record<AdminUserStatus, "ok" | "warn" | "neutral"> = {
  Active: "ok",
  "Pending Invite": "warn",
  Inactive: "neutral"
};

export default function AdminUsersPage() {
  const { adminUsers, updateUsers } = useAdminUsers();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [selected, setSelected] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  const matchesScope = (user: AdminUser) => {
    if (scope === "all") return true;
    if (scope === "district") return user.scope.type === "district";
    return user.scope.type === "school" && user.scope.schoolId === scope;
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = adminUsers
      .filter((user) => (role === "all" ? true : roleAssignmentsInclude(user.roles, role as AdminRole)))
      .filter((user) => (status === "all" ? true : user.status === status))
      .filter(matchesScope)
      .filter((user) =>
        term === "" ? true : `${user.name} ${user.email}`.toLowerCase().includes(term)
      );

    return filtered.slice().sort((a, b) => {
      if (!a.lastLogin && !b.lastLogin) return 0;
      if (!a.lastLogin) return 1;
      if (!b.lastLogin) return -1;
      return sort === "recent"
        ? b.lastLogin.localeCompare(a.lastLogin)
        : a.lastLogin.localeCompare(b.lastLogin);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUsers, query, role, status, scope, sort]);

  const selectedIds = selected.filter((id) => results.some((user) => user.id === id));
  const allSelected = results.length > 0 && selectedIds.length === results.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : results.map((user) => user.id));
  };

  const toggleOne = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const bulkDeactivate = () => {
    updateUsers(selectedIds, { status: "Inactive" });
    setSelected([]);
  };

  return (
    <>
      <div className="sf-filter-bar sf-filter-bar--flush">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="Name or email"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="sf-field">
          <span>Role</span>
          <Combobox options={ROLE_OPTIONS} value={role} onChange={setRole} placeholder="All roles" />
        </label>

        <label className="sf-field">
          <span>Status</span>
          <Combobox options={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder="All statuses" />
        </label>

        <label className="sf-field">
          <span>Scope</span>
          <Combobox options={SCOPE_OPTIONS} value={scope} onChange={setScope} placeholder="All scopes" />
        </label>

        <label className="sf-field">
          <span>Sort</span>
          <Combobox
            options={SORT_OPTIONS}
            value={sort}
            onChange={(next) => setSort(next as SortOrder)}
            placeholder="Sort"
          />
        </label>

        <p className="sf-filter-note">
          {results.length} of {adminUsers.length} admin users
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Admin users</h2>
          {selectedIds.length > 0 ? (
            <div className="sf-row-actions">
              <span className="sf-panel-note">{selectedIds.length} selected</span>
              <button type="button" className="sf-btn sf-btn--sm" onClick={() => setIsReassigning(true)}>
                Reassign role
              </button>
              <button type="button" className="sf-btn sf-btn--sm sf-btn--danger" onClick={bulkDeactivate}>
                Bulk deactivate
              </button>
            </div>
          ) : (
            <span className="sf-panel-note">Select a row to edit role, scope or status</span>
          )}
        </div>

        {results.length === 0 ? (
          <EmptyState
            title={adminUsers.length === 0 ? "No admin users yet" : "No matching admin users"}
            message={
              adminUsers.length === 0
                ? "Invite the first Leadership, Portal Administrator or IT Administrator account."
                : "Try a different search term, or widen the role, status and scope filters."
            }
          />
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all admin users"
                    />
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role(s)</th>
                  <th scope="col">Scope</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Login</th>
                  {/* dateAdded stays on the record — it just isn't a column here. */}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleOne(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <AdminRoleBadges roles={user.roles} />
                    </td>
                    <td>{scopeLabel(user.scope)}</td>
                    <td>
                      <StatusBadge tone={STATUS_TONE[user.status]}>{user.status}</StatusBadge>
                    </td>
                    <td>{user.lastLogin ? formatDateTime(user.lastLogin) : "—"}</td>
                    <td>
                      <button type="button" className="sf-btn sf-btn--sm" onClick={() => setEditingUser(user)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser ? (
        <EditAdminUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      ) : null}

      {isReassigning ? (
        <BulkRoleReassignModal
          count={selectedIds.length}
          ids={selectedIds}
          onClose={() => {
            setIsReassigning(false);
            setSelected([]);
          }}
        />
      ) : null}
    </>
  );
}
