"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAdd01Icon } from "@hugeicons/core-free-icons";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_ORDER,
  ADMIN_STATUS_HINTS,
  ADMIN_STATUS_ORDER,
  ADMIN_STATUS_TONE,
  INVITE_VALID_DAYS,
  inviteExpiresAt,
  isInviteExpired,
  scopeLabel,
  type AdminRole,
  type AdminUser,
  type AdminUserStatus
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useAdminScope } from "@/lib/admin-scope";
import { useMounted } from "@/lib/use-mounted";
import { schools } from "@/lib/data/schools";
import { formatDate, formatSalesforceStamp } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InviteUserDrawer } from "./InviteUserDrawer";

const ALL = "all";

/**
 * Every admin account, and what to do about each one.
 *
 * One table rather than a tab per status. A status is a fact about an account,
 * not a place to stand: an admin arriving here is either adding someone or
 * dealing with a specific person, and both start by finding the row. Status is a
 * filter, with the counts on the filter itself so nothing has to be opened to be
 * seen.
 *
 * The actions on a row follow its status, because they are different acts. An
 * invitation that has not been accepted can be re-sent or withdrawn — there is
 * nothing to keep. An account that has signed in is disabled instead: it is part
 * of the audit trail, and deleting the row would take the trail with it.
 */
export function AdminUserList({
  status: fixedStatus,
  heading
}: {
  /** Locks the table to one status, for the tabs that are about one. */
  status?: AdminUserStatus;
  heading?: string;
}) {
  const { adminUsers, isLoaded } = useAdminUsers();
  const { roleLabel } = useAdminScope();
  const mounted = useMounted();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>(fixedStatus ?? ALL);
  const [role, setRole] = useState<string>(ALL);
  const [school, setSchool] = useState<string>(ALL);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const effectiveStatus = fixedStatus ?? status;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return adminUsers
      .filter((user) => effectiveStatus === ALL || user.status === effectiveStatus)
      .filter((user) => role === ALL || user.role === role)
      .filter((user) => school === ALL || (user.scope.type === "school" && user.scope.schoolId === school))
      .filter((user) => !term || `${user.name} ${user.email}`.toLowerCase().includes(term))
      /* Invited first, then Active, then Disabled: the rows that need doing
         something about come before the rows that are simply fine. */
      .sort((a, b) => {
        const byStatus =
          ADMIN_STATUS_ORDER.indexOf(a.status) - ADMIN_STATUS_ORDER.indexOf(b.status);
        return byStatus !== 0 ? byStatus : a.name.localeCompare(b.name);
      });
  }, [adminUsers, effectiveStatus, role, school, query]);

  const filtered = query.trim() !== "" || role !== ALL || school !== ALL || (!fixedStatus && status !== ALL);

  if (!mounted) return null;

  return (
    <>
      <div className="sf-panel-head">
        <h2>{heading ?? "Admin accounts"}</h2>
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {visible.length} of {adminUsers.length}
          </span>
          <Button
            size="sm"
            onClick={() => setInviting(true)}
            iconLeading={<HugeiconsIcon icon={MailAdd01Icon} size={16} strokeWidth={2} />}
          >
            Invite an admin
          </Button>
        </div>
      </div>

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

        {/* Absent on a tab that is already one status — a filter that can only
            hold the value it is locked to is a control with nothing to do. */}
        {fixedStatus ? null : (
          <label className="sf-field">
            <span>Status</span>
            <Combobox
              options={[
                { value: ALL, label: "All statuses" },
                ...ADMIN_STATUS_ORDER.map((entry) => ({ value: entry, label: entry }))
              ]}
              value={status}
              onChange={setStatus}
            />
          </label>
        )}

        <label className="sf-field">
          <span>Role</span>
          <Combobox
            options={[
              { value: ALL, label: "Both roles" },
              ...ADMIN_ROLE_ORDER.map((entry) => ({
                value: entry,
                label: ADMIN_ROLE_LABELS[entry]
              }))
            ]}
            value={role}
            onChange={setRole}
          />
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={[
              { value: ALL, label: "Any school" },
              ...schools.map((entry) => ({ value: entry.id, label: entry.name }))
            ]}
            value={school}
            onChange={setSchool}
          />
        </label>
      </div>

      {!isLoaded ? null : visible.length === 0 ? (
        <EmptyState
          title={filtered ? "No accounts match these filters" : "No admin accounts yet"}
          message={
            filtered
              ? "Clear the search, or widen the status, role and school filters."
              : "Invite the first admin against a district email address."
          }
          action={
            filtered ? undefined : (
              <Button size="sm" onClick={() => setInviting(true)}>
                Invite an admin
              </Button>
            )
          }
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table sf-table--roomy">
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Role</th>
                <th scope="col">Administers</th>
                <th scope="col">Status</th>
                <th scope="col">Invitation</th>
                <th scope="col">Last sign-in</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => {
                const expired = isInviteExpired(user);

                return (
                  <tr key={user.id}>
                    <td>
                      {/* The name opens their record — access, invitation and
                          what they have changed. Edit stays on the row for the
                          common case of moving a role. */}
                      <Link className="sf-bar-group-link" href={`/user-management/${user.id}`}>
                        {user.name}
                      </Link>
                      <div className="list-editor-item-detail">{user.email}</div>
                    </td>
                    <td>{ADMIN_ROLE_LABELS[user.role]}</td>
                    <td>{scopeLabel(user.scope)}</td>
                    <td>
                      <StatusBadge tone={expired ? "error" : ADMIN_STATUS_TONE[user.status]}>
                        {expired ? "Invite expired" : user.status}
                      </StatusBadge>
                    </td>
                    <td>
                      {user.status === "Invited" && user.inviteSentAt ? (
                        <>
                          <div className="list-editor-item-title">
                            Sent {formatDate(user.inviteSentAt)}
                          </div>
                          <div className="list-editor-item-detail">
                            {/* The date it runs out, and how many times it has
                                gone — a third send usually means the address is
                                wrong, not that the person is slow. */}
                            {expired
                              ? `Expired ${formatDate(inviteExpiresAt(user.inviteSentAt))}`
                              : `Valid until ${formatDate(inviteExpiresAt(user.inviteSentAt))}`}
                            {user.inviteSends > 1 ? ` · sent ${user.inviteSends}×` : ""}
                          </div>
                        </>
                      ) : (
                        <span className="list-editor-item-detail">
                          {user.status === "Active" ? "Accepted" : "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      {user.lastLogin ? (
                        formatSalesforceStamp(user.lastLogin)
                      ) : (
                        <span className="list-editor-item-detail">Never</span>
                      )}
                    </td>
                    <td>
                      {/* Edit is the only row action. Everything a row could do
                          to an account — its role, its school, whether they may
                          sign in — is one form, applied once, in their record. */}
                      <div className="sf-row-actions">
                        <Button color="secondary" size="xs" onClick={() => setEditing(user)}>
                          Edit<span className="sf-sr-only"> {user.name}</span>
                        </Button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* The three statuses in one line, since the badges are the only place
          they appear and "Disabled" versus "Invite expired" is worth stating. */}
      <p className="sf-panel-note">
        {ADMIN_STATUS_ORDER.map((entry) => `${entry}: ${ADMIN_STATUS_HINTS[entry]}`).join(" ")}{" "}
        An invitation stands for {INVITE_VALID_DAYS} days.
      </p>

      {inviting ? (
        <InviteUserDrawer invitedBy={roleLabel} onClose={() => setInviting(false)} />
      ) : null}

      {editing ? (
        <InviteUserDrawer
          user={editing}
          invitedBy={roleLabel}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
