"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { allActivity, portalLabel } from "@/lib/data/adminActivity";
import { ADMIN_ROLE_LABELS } from "@/lib/data/adminUsers";
import { useAdminUsers } from "@/lib/admin-users-store";
import { useMounted } from "@/lib/use-mounted";
import { formatSalesforceStamp } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * The district-wide trail, which is every account's activity in one list.
 *
 * Read from the same source as each account's own record rather than a list of
 * its own. Two audit trails that could disagree would be worse than one — and
 * the one nobody could reconcile is the one you would stop trusting.
 */
export default function AuditLogPage() {
  const { adminUsers } = useAdminUsers();
  const mounted = useMounted();
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const all = allActivity(adminUsers);
    const term = query.trim().toLowerCase();
    if (!term) return all;
    return all.filter((entry) =>
      `${entry.action} ${entry.detail ?? ""} ${entry.section} ${portalLabel(entry.schoolId)}`
        .toLowerCase()
        .includes(term)
    );
  }, [adminUsers, query]);

  const byId = useMemo(
    () => new Map(adminUsers.map((user) => [user.id, user])),
    [adminUsers]
  );

  if (!mounted) return null;

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Data privacy &amp; audit log</h2>
        <span className="sf-panel-note">{entries.length} entries</span>
      </div>

      <div className="sf-filter-bar sf-filter-bar--flush">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="Person, action, section or portal"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          title="No matching entries"
          message="No audit entries match that search. Try a different term."
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table sf-table--roomy">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">What</th>
                <th scope="col">Section</th>
                <th scope="col">Portal</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 60).map((entry) => {
                const actor = byId.get(entry.userId);
                return (
                  <tr key={entry.id}>
                    <td>{formatSalesforceStamp(entry.at)}</td>
                    <td>
                      {/* Through to their record, where the same trail is filtered
                          to just them — the usual next question. */}
                      {actor ? (
                        <Link className="sf-bar-group-link" href={`/user-management/${actor.id}`}>
                          {actor.name}
                        </Link>
                      ) : (
                        "Unknown"
                      )}
                      {actor ? (
                        <div className="list-editor-item-detail">
                          {ADMIN_ROLE_LABELS[actor.role]}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      <div className="list-editor-item-title">{entry.action}</div>
                      {entry.detail ? (
                        <div className="list-editor-item-detail">{entry.detail}</div>
                      ) : null}
                    </td>
                    <td>{entry.section}</td>
                    <td>{portalLabel(entry.schoolId)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Capped rather than paged: the district-wide view answers "what happened
          recently", and one account's whole history is on their own record. */}
      <p className="sf-panel-note">
        The 60 most recent entries. One person&rsquo;s full history is on their account.
      </p>
    </div>
  );
}
