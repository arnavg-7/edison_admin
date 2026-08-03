"use client";

import { useState } from "react";
import { auditLog } from "@/lib/data/systemSettings";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";

export default function AuditLogPage() {
  const [query, setQuery] = useState("");

  const entries = auditLog.filter((entry) =>
    `${entry.actor} ${entry.action} ${entry.target}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Data privacy &amp; audit log</h2>
        </div>

        <label className="filter-field audit-search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="Filter by person, action, or target"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {entries.length === 0 ? (
          <EmptyState
            title="No matching entries"
            message="No audit entries match that search. Try a different term."
          />
        ) : (
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">Who</th>
                <th scope="col">Action</th>
                <th scope="col">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDateTime(entry.at)}</td>
                  <td>{entry.actor}</td>
                  <td>{entry.action}</td>
                  <td>{entry.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  );
}
