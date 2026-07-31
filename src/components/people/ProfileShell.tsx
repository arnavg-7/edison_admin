"use client";

import { useState } from "react";
import Link from "next/link";
import {
  salesforceRecordUrl,
  type InternalNote,
  type Person,
  type ReadOnlyField
} from "@/lib/data/people";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatSalesforceStamp } from "@/lib/format";

type TabId =
  | "personal"
  | "academic"
  | "goals"
  | "alerts"
  | "attendance"
  | "wellbeing"
  | "events"
  | "notes";

const STUDENT_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal details" },
  { id: "academic", label: "Enrollment & academic" },
  { id: "goals", label: "Goals" },
  { id: "alerts", label: "Alert history" },
  { id: "attendance", label: "Attendance" },
  { id: "wellbeing", label: "Well-being log" },
  { id: "events", label: "Event participation" },
  { id: "notes", label: "Internal notes & flags" }
];

const FACULTY_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal details" },
  { id: "academic", label: "Class assignments" },
  { id: "alerts", label: "Alert history" },
  { id: "events", label: "Event participation" },
  { id: "notes", label: "Internal notes & flags" }
];

/**
 * Shared shell for both student and faculty profiles.
 *
 * Every tab except Internal notes & flags is read-only with a link out to the
 * Salesforce record. Personal details, enrollment, grades and attendance are
 * system-of-record fields; an edit control here would invite divergence from
 * the source of truth. The editable-field list beyond notes/flags is still
 * unconfirmed (brief open item 9), so nothing else is writable.
 */
export function ProfileShell({ person }: { person: Person }) {
  const tabs = person.kind === "student" ? STUDENT_TABS : FACULTY_TABS;
  const [tab, setTab] = useState<TabId>("personal");

  const [notes, setNotes] = useState<InternalNote[]>(person.notes);
  const [flags, setFlags] = useState<string[]>(person.flags);
  const [draft, setDraft] = useState("");
  const [flagDraft, setFlagDraft] = useState("");

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes((current) => [
      {
        id: `local-${Date.now()}`,
        body: draft.trim(),
        author: "Super Admin",
        at: new Date().toISOString()
      },
      ...current
    ]);
    setDraft("");
  };

  const addFlag = () => {
    const value = flagDraft.trim();
    if (!value || flags.includes(value)) return;
    setFlags((current) => [...current, value]);
    setFlagDraft("");
  };

  return (
    <section className="sf-main">
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/people">Student &amp; Faculty 360</Link>
        <span className="sf-context-sep">/</span>
        <span>{person.name}</span>
      </nav>

      <div className="sf-profile-head">
        <div>
          <h1 className="sf-page-title">{person.name}</h1>
          <p className="sf-page-sub">
            {person.kind === "student" ? "Student" : "Faculty"} · {person.group} · {person.school}
          </p>
        </div>

        <div className="sf-profile-head-actions">
          <StatusBadge tone={person.status === "At Risk" ? "warn" : "ok"}>
            {person.status}
          </StatusBadge>
          <a
            className="sf-btn sf-btn--sm"
            href={salesforceRecordUrl(person.salesforceId)}
            target="_blank"
            rel="noreferrer"
          >
            View in Salesforce
          </a>
        </div>
      </div>

      <nav className="sf-tabs" aria-label="Profile sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? "sf-tab active" : "sf-tab"}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "personal" ? (
        <ReadOnlyPanel
          title="Personal details"
          fields={person.personal}
          salesforceId={person.salesforceId}
        />
      ) : null}

      {tab === "academic" ? (
        <ReadOnlyPanel
          title={person.kind === "student" ? "Enrollment & academic record" : "Class assignments"}
          fields={person.academic}
          salesforceId={person.salesforceId}
        />
      ) : null}

      {tab === "goals" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Goals</h2>
            <span className="sf-panel-note">
              Read-only · configured in Academic Goals
            </span>
          </div>
          {person.goals.length === 0 ? (
            <EmptyState title="No goals recorded" message="No active or historic goals for this person." />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Goal</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col">Target</th>
                    <th scope="col">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {person.goals.map((goal) => (
                    <tr key={goal.id}>
                      <td>{goal.title}</td>
                      <td>{goal.category}</td>
                      <td>
                        <StatusBadge
                          tone={
                            goal.status === "On track" || goal.status === "Complete"
                              ? "ok"
                              : goal.status === "Overdue"
                                ? "error"
                                : "warn"
                          }
                        >
                          {goal.status}
                        </StatusBadge>
                      </td>
                      <td>{goal.target}</td>
                      <td>{formatSalesforceStamp(goal.lastUpdated)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link className="sf-inline-link" href="/academic-goals">
            Open Academic Goals →
          </Link>
        </div>
      ) : null}

      {tab === "alerts" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Alert history</h2>
            <span className="sf-panel-note">Read-only · rules live in Alerts &amp; Notifications</span>
          </div>
          {person.alerts.length === 0 ? (
            <EmptyState title="No alerts" message="No alerts have been raised for this person." />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Rule</th>
                    <th scope="col">Raised</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {person.alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.rule}</td>
                      <td>{formatSalesforceStamp(alert.raised)}</td>
                      <td>
                        <StatusBadge
                          tone={
                            alert.status === "Resolved"
                              ? "ok"
                              : alert.overdue
                                ? "error"
                                : "warn"
                          }
                        >
                          {alert.status}
                          {alert.overdue ? " · past SLA" : ""}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link className="sf-inline-link" href="/alerts">
            Open Alerts &amp; Notifications →
          </Link>
        </div>
      ) : null}

      {tab === "attendance" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Attendance</h2>
            <span className="sf-panel-note">Read-only · sourced from Genesis via Salesforce</span>
          </div>
          {person.attendance.length === 0 ? (
            <EmptyState
              title="No attendance data yet"
              message="No attendance records have been received for this person."
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {person.attendance.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>
                        <StatusBadge
                          tone={
                            row.status === "Present"
                              ? "ok"
                              : row.status === "Absent"
                                ? "error"
                                : "warn"
                          }
                        >
                          {row.status}
                        </StatusBadge>
                      </td>
                      <td>{row.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "wellbeing" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Well-being log</h2>
            <span className="sf-panel-note">Read-only</span>
          </div>
          {/* Flagged: well-being is a new data domain and its Salesforce object
              is unconfirmed (Portal Specs Step 5). */}
          <p className="sf-card-hint">Source object for logged feeling not yet confirmed.</p>
          {person.wellbeing.length === 0 ? (
            <EmptyState title="No well-being entries" message="Nothing logged for this person." />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Logged feeling</th>
                    <th scope="col">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {person.wellbeing.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>
                        <StatusBadge
                          tone={
                            row.feeling === "Pleasant"
                              ? "ok"
                              : row.feeling === "Neutral"
                                ? "neutral"
                                : "warn"
                          }
                        >
                          {row.feeling}
                        </StatusBadge>
                      </td>
                      <td>{row.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "events" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Event participation</h2>
            <span className="sf-panel-note">Read-only</span>
          </div>
          {person.events.length === 0 ? (
            <EmptyState title="No event participation" message="No events recorded for this person." />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Event</th>
                    <th scope="col">Date</th>
                    <th scope="col">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {person.events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.name}</td>
                      <td>{event.date}</td>
                      <td>{event.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {tab === "notes" ? (
        <>
          <div className="sf-panel">
            <div className="sf-panel-head">
              <h2>Internal notes</h2>
              <span className="sf-status sf-status--ok">Editable in Admin</span>
            </div>
            <p className="sf-card-hint">
              Admin-native — not written back to Salesforce. TODO: local state only until the
              Admin DB contract exists.
            </p>

            <div className="sf-note-form">
              <label className="sf-field">
                <span>Add a note</span>
                <textarea
                  rows={3}
                  value={draft}
                  placeholder="What happened, and what happens next"
                  onChange={(event) => setDraft(event.target.value)}
                />
              </label>
              <button type="button" className="sf-btn sf-btn--primary" onClick={addNote}>
                Save note
              </button>
            </div>

            {notes.length === 0 ? (
              <EmptyState title="No notes yet" message="Notes added here stay in Admin." />
            ) : (
              <ul className="sf-note-list">
                {notes.map((note) => (
                  <li className="sf-note" key={note.id}>
                    <p>{note.body}</p>
                    <span className="sf-note-meta">
                      {note.author} · {formatSalesforceStamp(note.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sf-panel">
            <div className="sf-panel-head">
              <h2>Flags</h2>
              <span className="sf-status sf-status--ok">Editable in Admin</span>
            </div>

            <div className="sf-note-form sf-note-form--inline">
              <label className="sf-field">
                <span>Add a flag</span>
                <input
                  type="text"
                  value={flagDraft}
                  placeholder="e.g. Guardian contact in progress"
                  onChange={(event) => setFlagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addFlag();
                  }}
                />
              </label>
              <button type="button" className="sf-btn sf-btn--primary" onClick={addFlag}>
                Add flag
              </button>
            </div>

            {flags.length === 0 ? (
              <EmptyState title="No flags" message="No internal flags on this person." />
            ) : (
              <ul className="sf-flag-list">
                {flags.map((flag) => (
                  <li key={flag}>
                    <span className="sf-status sf-status--warn">{flag}</span>
                    <button
                      type="button"
                      className="sf-link-btn sf-link-btn--danger"
                      onClick={() => setFlags((current) => current.filter((f) => f !== flag))}
                    >
                      Remove<span className="sf-sr-only"> flag {flag}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ReadOnlyPanel({
  title,
  fields,
  salesforceId
}: {
  title: string;
  fields: ReadOnlyField[];
  salesforceId: string;
}) {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>{title}</h2>
        <span className="sf-panel-note">Read-only · owned by Salesforce</span>
      </div>

      <dl className="sf-field-grid">
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>

      <a
        className="sf-inline-link"
        href={salesforceRecordUrl(salesforceId)}
        target="_blank"
        rel="noreferrer"
      >
        Edit in Salesforce →
      </a>
    </div>
  );
}
