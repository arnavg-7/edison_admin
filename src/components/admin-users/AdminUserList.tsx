"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit02Icon,
  UserBlock01Icon,
  UserCheck01Icon
} from "@hugeicons/core-free-icons";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_ORDER,
  ADMIN_STATUS_TONE,
  SCHOOL_ADMIN_GRANTABLE,
  adminUsers as seededAdminUsers,
  roleAssignmentsInclude,
  scopeLabel,
  type AdminRole,
  type AdminUser,
  type AdminUserStatus
} from "@/lib/data/adminUsers";
import { schools } from "@/lib/data/schools";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { useAdminScope } from "@/lib/admin-scope";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { Button, styles as buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/lib/utils/cx";
import { AdminRoleBadges } from "@/components/admin-users/AdminRoleBadges";
import { EditAdminUserModal } from "@/components/admin-users/EditAdminUserModal";
import { BulkRoleReassignModal } from "@/components/admin-users/BulkRoleReassignModal";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

type SortOrder = "recent" | "oldest";

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All roles" },
  ...ADMIN_ROLE_ORDER.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }))
];

const STATUS_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All statuses" },
  ...ADMIN_STATUS_ORDER.map((status) => ({
    value: status,
    label: ADMIN_STATUS_LABELS[status]
  }))
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

/** The bulk status change that makes sense for the slice being viewed. */
function bulkStatusAction(slice: AdminUserStatus | undefined): {
  label: string;
  status: AdminUserStatus;
  color: "secondary" | "secondary-destructive";
} {
  if (slice === "Inactive") return { label: "Reactivate", status: "Active", color: "secondary" };
  return { label: "Bulk deactivate", status: "Inactive", color: "secondary-destructive" };
}

export type AdminUserListProps = {
  /**
   * Fixed status slice for the Active tab. Omitted on All Users, which offers
   * Status as a filter instead — a filter over one status would only ever be a
   * no-op or empty the table.
   */
  status?: AdminUserStatus;
  /** Panel heading. */
  heading: string;
  /** Plural noun for the count line and empty states, e.g. "revoked users". */
  noun: string;
  /** Shown when the slice itself is empty, rather than filtered to nothing. */
  emptyTitle: string;
  emptyMessage: string;
};

/**
 * The admin account table, shared by All Users and each status tab: the status
 * tabs are filtered slices of one list, the same way Alert History is a slice
 * of alerts, so they run the same filters, bulk actions and row actions rather
 * than four near-copies of them.
 */
export function AdminUserList({ status: slice, heading, noun, emptyTitle, emptyMessage }: AdminUserListProps) {
  const { adminUsers: storedAdminUsers, updateUser, updateUsers, removeUser } = useAdminUsers();
  const mounted = useMounted();

  /**
   * The provider lives in the root layout, so it can commit — and swap the seed
   * for localStorage data — before this page's boundary hydrates. Rendering the
   * seed until this component has hydrated keeps the first client render
   * identical to the server HTML; the stored accounts appear one render later.
   */
  const stored = mounted ? storedAdminUsers : seededAdminUsers;

  /**
   * A school admin administers their school, and that includes who else does.
   *
   * So the list is their school's accounts, and the roles they can hand out
   * stop at their own — no Super Admin, no Leadership, and nobody at another
   * school. It is the same rule the rest of the portal follows for scope, with
   * one addition: an account that outranks them is not theirs to edit either,
   * so it is not in the list at all rather than in it and refused.
   */
  const { schoolId: scopedSchoolId } = useAdminScope();
  const grantable = scopedSchoolId ? SCHOOL_ADMIN_GRANTABLE : ADMIN_ROLE_ORDER;

  const allAdminUsers = useMemo(
    () =>
      scopedSchoolId
        ? stored.filter(
            (user) =>
              user.scope.type === "school" &&
              user.scope.schoolId === scopedSchoolId &&
              user.roles.every((role) => SCHOOL_ADMIN_GRANTABLE.includes(role))
          )
        : stored,
    [scopedSchoolId, stored]
  );

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [selected, setSelected] = useState<string[]>([]);
  /* The id, not the record: the edit modal writes Active/Inactive straight to
     the store, so holding a copy of the user here froze it against those writes
     — the modal's own toggle rendered from a snapshot that could never change. */
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);

  const editingUser = editingUserId
    ? (allAdminUsers.find((user) => user.id === editingUserId) ?? null)
    : null;

  /* The tab's own slice — the denominator in the count line, and what the
     "nothing here yet" empty state is measured against. */
  const adminUsers = useMemo(
    () => (slice ? allAdminUsers.filter((user) => user.status === slice) : allAdminUsers),
    [allAdminUsers, slice]
  );

  const matchesScope = (user: AdminUser) => {
    if (scope === "all") return true;
    if (scope === "district") return user.scope.type === "district";
    return user.scope.type === "school" && user.scope.schoolId === scope;
  };

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = adminUsers
      .filter((user) => (role === "all" ? true : roleAssignmentsInclude(user.roles, role as AdminRole)))
      .filter((user) => (slice || status === "all" ? true : user.status === status))
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
  }, [adminUsers, slice, query, role, status, scope, sort]);

  const selectedIds = selected.filter((id) => results.some((user) => user.id === id));
  const allSelected = results.length > 0 && selectedIds.length === results.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : results.map((user) => user.id));
  };

  const toggleOne = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  };

  const bulkAction = bulkStatusAction(slice);

  const applyBulkStatus = () => {
    updateUsers(selectedIds, { status: bulkAction.status });
    setSelected([]);
  };

  /* Turning access off keeps the record: Inactive is an account that exists and
     cannot sign in, which is the state to come back from. Remove is the
     permanent one, and is offered on an inactive row only — deleting somebody
     who still has access should take the deliberate step of switching it off
     first. */
  const deactivate = (user: AdminUser) => {
    updateUser(user.id, { status: "Inactive" });
    setSelected((current) => current.filter((id) => id !== user.id));
  };

  const reactivate = (user: AdminUser) => {
    updateUser(user.id, { status: "Active" });
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

        {slice ? null : (
          <label className="sf-field">
            <span>Status</span>
            <Combobox options={STATUS_OPTIONS} value={status} onChange={setStatus} placeholder="All statuses" />
          </label>
        )}

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
          {results.length} of {adminUsers.length} {noun}
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>{heading}</h2>
          {selectedIds.length > 0 ? (
            <div className="sf-row-actions">
              <span className="sf-panel-note">{selectedIds.length} selected</span>
              <Button color="secondary" size="xs" onClick={() => setIsReassigning(true)}>
                Reassign role
              </Button>
              <Button color={bulkAction.color} size="xs" onClick={applyBulkStatus}>
                {bulkAction.label}
              </Button>
            </div>
          ) : (
            <span className="sf-panel-note">Select a row to edit role, scope or status</span>
          )}
        </div>

        {results.length === 0 ? (
          <EmptyState
            title={adminUsers.length === 0 ? emptyTitle : `No matching ${noun}`}
            message={
              adminUsers.length === 0
                ? emptyMessage
                : `Try a different search term, or widen the ${slice ? "role and scope" : "role, status and scope"} filters.`
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
                      aria-label={`Select all ${noun}`}
                    />
                  </th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role(s)</th>
                  <th scope="col">Scope</th>
                  {/* Redundant on a single-status tab — every badge would read
                      the same as the tab you're already on. */}
                  {slice ? null : <th scope="col">Status</th>}
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
                      <AdminRoleBadges roles={user.roles} access={user.access} />
                    </td>
                    <td>{scopeLabel(user.scope)}</td>
                    {slice ? null : (
                      <td>
                        <StatusBadge tone={ADMIN_STATUS_TONE[user.status]}>
                          {ADMIN_STATUS_LABELS[user.status]}
                        </StatusBadge>
                      </td>
                    )}
                    <td>{user.lastLogin ? formatDateTime(user.lastLogin) : "—"}</td>
                    <td>
                      <div className="sf-row-actions">
                        {user.status === "Inactive" ? (
                          <>
                            <Button
                              color="secondary"
                              size="xs"
                              onClick={() => reactivate(user)}
                              iconLeading={<HugeiconsIcon icon={UserCheck01Icon} size={16} strokeWidth={2} />}
                            >
                              Reactivate
                            </Button>

                            <AlertDialog>
                              {/* AlertDialogTrigger stays on Base UI (it can't be
                                  the Untitled Button — see the note on
                                  AlertDialogAction below), but borrows that
                                  button's exact classes via the shared `styles`
                                  export so it still looks like one. */}
                              <AlertDialogTrigger
                                className={cx(
                                  buttonStyles.common.root,
                                  buttonStyles.sizes.xs.root,
                                  buttonStyles.colors["secondary-destructive"].root
                                )}
                              >
                                {/* A plain child, not `iconLeading`: this trigger is
                                    not the Untitled Button, only its classes, so it
                                    has no icon prop to pass. Those classes already
                                    lay the root out as a flex row with a gap, so the
                                    icon sits like the Restore button's. */}
                                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                                Remove
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This deletes the account for good — they&rsquo;ll no longer appear
                                    on any tab, and it can&rsquo;t be reactivated. This can&rsquo;t be
                                    undone from here.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogClose
                                    variant="destructive"
                                    onClick={() => {
                                      removeUser(user.id);
                                      setSelected((current) => current.filter((id) => id !== user.id));
                                    }}
                                  >
                                    Remove
                                  </AlertDialogClose>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <>
                            <Button
                              color="secondary"
                              size="xs"
                              onClick={() => setEditingUserId(user.id)}
                              iconLeading={
                                <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />
                              }
                            >
                              Edit
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger
                                className={cx(
                                  buttonStyles.common.root,
                                  buttonStyles.sizes.xs.root,
                                  buttonStyles.colors["secondary-destructive"].root
                                )}
                              >
                                <HugeiconsIcon icon={UserBlock01Icon} size={16} strokeWidth={2} />
                                Deactivate
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Deactivate {user.name}&rsquo;s access?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {user.status === "Invited"
                                      ? "The invitation stops working and the account becomes Inactive. Reactivating it puts them back where they were, still waiting to accept."
                                      : "They lose admin access immediately. The account becomes Inactive, where you can reactivate it or remove it for good."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  {/* Close, not Action: this re-badges the row instead
                                      of removing it, so on All Users the dialog's own
                                      subtree survives the click and would sit there
                                      open. */}
                                  <AlertDialogClose
                                    variant="destructive"
                                    onClick={() => deactivate(user)}
                                  >
                                    Deactivate
                                  </AlertDialogClose>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUser ? (
        <EditAdminUserModal
          user={editingUser}
          grantable={grantable}
          onClose={() => setEditingUserId(null)}
        />
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
