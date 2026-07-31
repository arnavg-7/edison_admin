"use client";

import { useState } from "react";
import { terms } from "@/lib/data/academicCalendar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SettingsScreenGuard } from "@/components/settings/SettingsScreenGuard";

/**
 * Source of truth for the "This Term" preset in the Reporting date filter.
 * Editing a term here is what should move that preset — flagged in the UI so
 * it's obvious the two are connected.
 */
export default function AcademicCalendarPage() {
  const [rows, setRows] = useState(terms);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ start: "", end: "" });

  const startEdit = (id: string, start: string, end: string) => {
    setEditingId(id);
    setDraft({ start, end });
  };

  const save = (id: string) => {
    setRows((current) =>
      current.map((term) =>
        term.id === id ? { ...term, start: draft.start, end: draft.end } : term
      )
    );
    setEditingId(null);
  };

  return (
    <SettingsScreenGuard screen="calendar">
      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Academic calendar</h2>
          <span className="config-status-summary">
            {`${rows.length} terms`} · drives the &ldquo;This Term&rdquo; reporting filter
          </span>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Term</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((term) => (
              <tr key={term.id}>
                <td>{term.label}</td>
                <td>
                  {editingId === term.id ? (
                    <input
                      type="date"
                      className="setting-input"
                      value={draft.start}
                      onChange={(event) => setDraft({ ...draft, start: event.target.value })}
                    />
                  ) : (
                    term.start
                  )}
                </td>
                <td>
                  {editingId === term.id ? (
                    <input
                      type="date"
                      className="setting-input"
                      value={draft.end}
                      onChange={(event) => setDraft({ ...draft, end: event.target.value })}
                    />
                  ) : (
                    term.end
                  )}
                </td>
                <td>
                  {term.current ? (
                    <StatusBadge tone="ok">Current</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Past</StatusBadge>
                  )}
                </td>
                <td>
                  {editingId === term.id ? (
                    <div className="setting-actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--primary"
                        onClick={() => save(term.id)}
                      >
                        Save
                      </button>
                      <button type="button" className="btn btn--sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--sm"
                      onClick={() => startEdit(term.id, term.start, term.end)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TODO: these term dates are invented and must be validated against
            Edison's real academic calendar before the reporting presets can be
            trusted (brief §8 item 4). */}
        <p className="builder-note calendar-note">
          Term dates here define the date-range presets used across Reporting &amp; Analytics.
          The current values are placeholders pending the district calendar.
        </p>
      </div>
    </SettingsScreenGuard>
  );
}
