"use client";

import { useMemo, useState } from "react";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  adminUsers as seededAdminUsers,
  roleAssignmentsInclude,
  scopeLabel,
  type AdminRole,
  type AdminUser
} from "@/lib/data/adminUsers";
import { schools } from "@/lib/data/schools";
import { useAdminUsers } from "@/lib/admin-users-store";
import { inviteHref, inviteUrl } from "@/lib/data/adminInvites";
import { useMounted } from "@/lib/use-mounted";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { AdminRoleBadges } from "@/components/admin-users/AdminRoleBadges";
import { Button } from "@/components/base/buttons/button";

type SortOrder = "recent" | "oldest";

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All roles" },
  ...ADMIN_ROLE_ORDER.map((role) => ({ value: role, label: ADMIN_ROLE_LABELS[role] }))
];

const SCOPE_OPTIONS: ComboboxOption[] = [
  { value: "all", label: "All scopes" },
  { value: "district", label: "District-wide" },
  ...schools.map((school) => ({ value: school.id, label: school.name }))
];

/* Sorted on when the invite was sent, not last login: a pending account has
   never signed in, so the All Users tab's login sort has nothing to order by
   here. Oldest-first is how you find the invites going stale. */
const SORT_OPTIONS: ComboboxOption[] = [
  { value: "recent", label: "Invited: newest first" },
  { value: "oldest", label: "Invited: oldest first" }
];

/** Invites sent but not yet accepted — a filtered slice of the same admin
    user list, the same way Alert History is a filtered slice of alerts. */
export default function PendingInvitationsPage() {
  const { adminUsers: storedAdminUsers, updateUser } = useAdminUsers();
  const mounted = useMounted();

  // Seed until this page hydrates — see useMounted.
  const adminUsers = mounted ? storedAdminUsers : seededAdminUsers;

  /* Same controls as the All Users tab, minus Status: every row here is a
     Pending Invite by definition, so a status filter would only ever be a no-op
     or empty the table. */
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState<SortOrder>("recent");

  const matchesScope = (user: AdminUser) => {
    if (scope === "all") return true;
    if (scope === "district") return user.scope.type === "district";
    return user.scope.type === "school" && user.scope.schoolId === scope;
  };

  const allPending = useMemo(
    () => adminUsers.filter((user) => user.status === "Pending Invite"),
    [adminUsers]
  );

  const pending = useMemo(() => {
    const term = query.trim().toLowerCase();

    return allPending
      .filter((user) => (role === "all" ? true : roleAssignmentsInclude(user.roles, role as AdminRole)))
      .filter(matchesScope)
      .filter((user) =>
        term === "" ? true : `${user.name} ${user.email}`.toLowerCase().includes(term)
      )
      .slice()
      .sort((a, b) =>
        sort === "recent"
          ? b.dateAdded.localeCompare(a.dateAdded)
          : a.dateAdded.localeCompare(b.dateAdded)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPending, query, role, scope, sort]);

  const resend = (id: string) => {
    // TODO: no email backend yet — this only bumps the sent date so the
    // admin can see the resend registered.
    updateUser(id, { dateAdded: new Date().toISOString() });
  };

  /* The address in the email, put on the clipboard. Confirmed on the button
     itself rather than in a toast: the app has no toast layer, and the answer
     to "did that work" belongs on the control that was pressed. */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = async (user: AdminUser) => {
    const url = inviteUrl(user, window.location.origin);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(user.id);
      window.setTimeout(() => setCopiedId((current) => (current === user.id ? null : current)), 2000);
    } catch {
      /* Clipboard access is refused in some browsers and over plain http.
         Opening the invite is the next best thing — it is the link itself, and
         the address bar then holds what could not be copied. */
      window.open(inviteHref(user), "_blank", "noopener");
    }
  };

  /* Moves the invite to Revoked Users rather than deleting it, so a revoked
     invite can be restored — it goes back to Pending Invite, not straight to
     approved, since nobody has accepted it. */
  const revoke = (id: string) => {
    updateUser(id, { status: "Revoked", revokedFrom: "Pending Invite" });
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
          {pending.length} of {allPending.length} pending invites
        </p>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Pending invitations</h2>
          <span className="sf-panel-note">{pending.length} awaiting response</span>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            title={allPending.length === 0 ? "No pending invites" : "No matching invites"}
            message={
              allPending.length === 0
                ? "Every invited admin account has been accepted, or nothing has been invited yet."
                : "Try a different search term, or widen the role and scope filters."
            }
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
                        {/* The link the email carries. Copyable here because
                            this build sends no mail — and because it is how an
                            invite gets reviewed before it goes out. */}
                        <Button color="secondary" size="xs" onClick={() => copyLink(user)}>
                          {copiedId === user.id ? "Link copied" : "Copy invite link"}
                        </Button>
                        <Button color="secondary" size="xs" onClick={() => resend(user.id)}>
                          Resend
                        </Button>
                        <Button
                          color="secondary-destructive"
                          size="xs"
                          onClick={() => revoke(user.id)}
                        >
                          Revoke
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
