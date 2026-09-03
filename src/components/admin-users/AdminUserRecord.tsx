"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import {
  ACTIVITY_KIND_LABELS,
  activityFor,
  portalLabel,
  portalsTouched,
  sectionsTouched,
  type AdminActivityKind
} from "@/lib/data/adminActivity";
import {
  ADMIN_ROLE_GRANTS,
  ADMIN_ROLE_LABELS,
  ADMIN_STATUS_TONE,
  inviteExpiresAt,
  isInviteExpired,
  scopeLabel
} from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useAdminScope } from "@/lib/admin-scope";
import { useMounted } from "@/lib/use-mounted";
import { formatDate, formatSalesforceStamp } from "@/lib/format";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { InviteUserDrawer } from "./InviteUserDrawer";

const ALL = "all";
/** Enough to read a working pattern without a wall of rows. */
const FIRST_PAGE = 10;

/**
 * One account's record: identity and access at the top, then its history.
 *
 * The history is the point of the page. "What has this person been changing, and
 * where" is the question an admin opens an account to answer — before disabling
 * someone, before widening a role, or after something changed that nobody owns up
 * to. So every entry names the portal as well as the section: for a Super Admin
 * working across five schools, the section alone says almost nothing.
 */
export function AdminUserRecord({ id }: { id: string }) {
  const { adminUsers, isLoaded } = useAdminUsers();
  const { roleLabel } = useAdminScope();
  const mounted = useMounted();

  const [editing, setEditing] = useState(false);
  const [section, setSection] = useState<string>(ALL);
  const [portal, setPortal] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);
  const [showAll, setShowAll] = useState(false);

  const user = adminUsers.find((entry) => entry.id === id);

  const entries = useMemo(() => (user ? activityFor(user) : []), [user]);

  const visible = useMemo(
    () =>
      entries
        .filter((entry) => section === ALL || entry.section === section)
        .filter((entry) => portal === ALL || (entry.schoolId ?? "district") === portal)
        .filter((entry) => kind === ALL || entry.kind === kind),
    [entries, section, portal, kind]
  );

  if (!mounted || !isLoaded) return null;

  if (!user) {
    return (
      <EmptyState
        title="No such account"
        message="That admin account does not exist, or it has been removed."
        action={
          <Button size="sm" href="/user-management">
            Back to all users
          </Button>
        }
      />
    );
  }

  const grants = ADMIN_ROLE_GRANTS[user.role];
  const expired = isInviteExpired(user);
  const shown = showAll ? visible : visible.slice(0, FIRST_PAGE);
  const hidden = visible.length - shown.length;

  return (
    <>
      <div className="sf-scope-head sf-scope-head--actions">
        <h1 className="sf-page-title sf-page-title--with-back">
          <Link href="/user-management" className="sf-back-btn" aria-label="Back to all users">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          </Link>
          {user.name}
        </h1>
        <div className="sf-row-actions">
          <Button
            size="sm"
            onClick={() => setEditing(true)}
            iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
          >
            Edit access
          </Button>
        </div>
      </div>

      <p className="sf-page-sub">
        {user.email} · {ADMIN_ROLE_LABELS[user.role]} · {scopeLabel(user.scope)}
      </p>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Access</h2>
          <StatusBadge tone={expired ? "error" : ADMIN_STATUS_TONE[user.status]}>
            {expired ? "Invite expired" : user.status}
          </StatusBadge>
        </div>

        <dl className="record-facts">
          <div>
            <dt>Role</dt>
            <dd>
              {ADMIN_ROLE_LABELS[user.role]}
              <span className="record-facts-sub">{grants.reach}</span>
            </dd>
          </div>
          <div>
            <dt>Administers</dt>
            <dd>{scopeLabel(user.scope)}</dd>
          </div>
          <div>
            <dt>Invited by</dt>
            <dd>
              {user.invitedBy}
              <span className="record-facts-sub">{formatDate(user.dateAdded)}</span>
            </dd>
          </div>
          <div>
            <dt>Invitation</dt>
            <dd>
              {user.status === "Invited" && user.inviteSentAt ? (
                <>
                  Sent {formatDate(user.inviteSentAt)}
                  <span className="record-facts-sub">
                    {expired ? "Expired" : "Valid until"}{" "}
                    {formatDate(inviteExpiresAt(user.inviteSentAt))}
                    {user.inviteSends > 1 ? ` · sent ${user.inviteSends}×` : ""}
                  </span>
                </>
              ) : (
                <>
                  Accepted
                  <span className="record-facts-sub">
                    {user.inviteSends > 1 ? `Sent ${user.inviteSends}× before accepting` : "First send"}
                  </span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt>Last sign-in</dt>
            <dd>{user.lastLogin ? formatSalesforceStamp(user.lastLogin) : "Never"}</dd>
          </div>
        </dl>
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Recent activity</h2>
          <span className="sf-panel-note">
            {visible.length} of {entries.length} entries
          </span>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            message={
              user.status === "Invited"
                ? "They have not signed in, so there is nothing to show. An invitation is not activity."
                : "No sign-ins or changes recorded against this account."
            }
          />
        ) : (
          <>
            <div className="sf-filter-bar sf-filter-bar--flush">
              <label className="sf-field">
                <span>Section</span>
                <Combobox
                  options={[
                    { value: ALL, label: "Every section" },
                    ...sectionsTouched(entries).map((entry) => ({ value: entry, label: entry }))
                  ]}
                  value={section}
                  onChange={(next) => {
                    setSection(next);
                    setShowAll(false);
                  }}
                />
              </label>

              {/* Only worth offering when they have worked in more than one —
                  a School Admin has exactly one portal, and a filter with a
                  single value is a control with nothing to do. */}
              {portalsTouched(entries).length > 1 ? (
                <label className="sf-field">
                  <span>Portal</span>
                  <Combobox
                    options={[
                      { value: ALL, label: "Every portal" },
                      ...portalsTouched(entries).map((entry) => ({
                        value: entry ?? "district",
                        label: portalLabel(entry)
                      }))
                    ]}
                    value={portal}
                    onChange={(next) => {
                      setPortal(next);
                      setShowAll(false);
                    }}
                  />
                </label>
              ) : null}

              <label className="sf-field">
                <span>Type</span>
                <Combobox
                  options={[
                    { value: ALL, label: "Sign-ins and changes" },
                    ...(Object.keys(ACTIVITY_KIND_LABELS) as AdminActivityKind[]).map((entry) => ({
                      value: entry,
                      label: ACTIVITY_KIND_LABELS[entry]
                    }))
                  ]}
                  value={kind}
                  onChange={(next) => {
                    setKind(next);
                    setShowAll(false);
                  }}
                />
              </label>
            </div>

            {visible.length === 0 ? (
              <p className="sf-subrow-empty">No entries match those filters.</p>
            ) : (
              <>
                <div className="sf-table-wrap">
                  <table className="sf-table sf-table--roomy">
                    <thead>
                      <tr>
                        <th scope="col">When</th>
                        <th scope="col">What</th>
                        <th scope="col">Section</th>
                        <th scope="col">Portal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shown.map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatSalesforceStamp(entry.at)}</td>
                          <td>
                            <div className="list-editor-item-title">{entry.action}</div>
                            {/* What actually changed, where there is something
                                worth naming — a log that only says "edited" is
                                a log that answers nothing. */}
                            {entry.detail ? (
                              <div className="list-editor-item-detail">{entry.detail}</div>
                            ) : null}
                          </td>
                          <td>{entry.section}</td>
                          <td>{portalLabel(entry.schoolId)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {hidden > 0 ? (
                  <div className="goal-students-more">
                    <Button color="secondary" size="xs" onClick={() => setShowAll(true)}>
                      Show all {visible.length} entries
                    </Button>
                    <span className="sf-panel-note">{hidden} older entries not shown.</span>
                  </div>
                ) : null}
              </>
            )}

            {/* Says what the trail is bounded by, so its shape reads as a fact
                about their access rather than as a gap in the record. */}
            <p className="sf-panel-note">
              {user.role === "school_admin"
                ? `Only ${scopeLabel(user.scope)} appears — a School Admin cannot reach another school's data, or accounts.`
                : "Every school appears, and account changes are district-wide."}
            </p>
          </>
        )}
      </div>

      {editing ? (
        <InviteUserDrawer user={user} invitedBy={roleLabel} onClose={() => setEditing(false)} />
      ) : null}
    </>
  );
}
