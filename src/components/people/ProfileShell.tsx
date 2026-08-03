"use client";

import { useState } from "react";
import Link from "next/link";
import { salesforceRecordUrl, type InternalNote, type Person, type ReadOnlyField } from "@/lib/data/people";
import { gradeConfigHref } from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatSalesforceStamp } from "@/lib/format";

type TabId =
  | "personal"
  | "academic"
  | "grades"
  | "attendance"
  | "goals"
  | "skills"
  | "development"
  | "classes"
  | "alerts"
  | "notes";

/**
 * Sections mirror what Edison's Student and Faculty portals actually cover.
 * There is no events or well-being tab: both came from the reference
 * screenshots rather than Edison's scope docs, and have no source system.
 */
const STUDENT_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal details" },
  { id: "academic", label: "Enrollment" },
  { id: "grades", label: "Grades & history" },
  { id: "attendance", label: "Attendance & history" },
  { id: "goals", label: "Goals" },
  { id: "skills", label: "Skills profile" },
  { id: "development", label: "Development areas" },
  { id: "classes", label: "Classes & schedule" },
  { id: "alerts", label: "Alert history" },
  { id: "notes", label: "Internal notes & flags" }
];

const FACULTY_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal details" },
  { id: "academic", label: "Assignment summary" },
  { id: "classes", label: "Classes & performance" },
  { id: "attendance", label: "Attendance submission" },
  { id: "alerts", label: "Student alerts" },
  { id: "notes", label: "Internal notes & flags" }
];

const LEVEL_TONE = { High: "ok", Middle: "neutral", Elementary: "warn" } as const;

export function ProfileShell({ person }: { person: Person }) {
  const isStudent = person.kind === "student";
  const tabs = isStudent ? STUDENT_TABS : FACULTY_TABS;
  const [tab, setTab] = useState<TabId>("personal");

  const [notes, setNotes] = useState<InternalNote[]>(person.notes);
  const [flags, setFlags] = useState<string[]>(person.flags);
  const [draft, setDraft] = useState("");
  const [flagDraft, setFlagDraft] = useState("");

  const addNote = () => {
    if (!draft.trim()) return;
    setNotes((current) => [
      { id: `local-${Date.now()}`, body: draft.trim(), author: "Super Admin", at: new Date().toISOString() },
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
            {isStudent ? "Student" : "Faculty"} · {person.group} · {person.school}
          </p>
        </div>
        <div className="sf-profile-head-actions">
          <StatusBadge tone={person.status === "At Risk" ? "warn" : person.status === "Other" ? "neutral" : "ok"}>
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
        <ReadOnlyPanel title="Personal details" fields={person.personal} salesforceId={person.salesforceId} />
      ) : null}

      {tab === "academic" ? (
        <ReadOnlyPanel
          title={isStudent ? "Enrollment & academic record" : "Assignment summary"}
          fields={person.academic}
          salesforceId={person.salesforceId}
        />
      ) : null}

      {/* ---------------------------------------------------------- grades */}
      {tab === "grades" ? (
        <>
          <Panel title="Current term grades" note="Read-only · owned by Salesforce">
            {!person.grades?.length ? (
              <EmptyState title="No grades recorded" message="No current-term grades for this student." />
            ) : (
              <Table
                head={["Subject", "Teacher", "Grade", "Percent", "Assignments"]}
                rows={person.grades.map((g) => [
                  g.subject,
                  g.teacher,
                  <StatusBadge key="g" tone={g.percent >= 80 ? "ok" : g.percent >= 70 ? "warn" : "error"}>
                    {g.grade}
                  </StatusBadge>,
                  `${g.percent}%`,
                  `${g.assignmentsComplete} of ${g.assignmentsSet}`
                ])}
              />
            )}
          </Panel>

          <Panel title="Grade history" note="Previous terms">
            {!person.gradeHistory?.length ? (
              <EmptyState title="No prior terms" message="No historic grades for this student yet." />
            ) : (
              <div className="sf-history">
                {person.gradeHistory.map((term) => (
                  <div className="sf-history-term" key={term.term}>
                    <div className="sf-history-head">
                      <span className="sf-history-title">{term.term}</span>
                      <span className="sf-panel-note">GPA {term.gpa}</span>
                    </div>
                    <ul className="sf-history-list">
                      {term.subjects.map((s) => (
                        <li key={s.subject}>
                          <span>{s.subject}</span>
                          <strong>{s.grade}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </>
      ) : null}

      {/* ------------------------------------------------------ attendance */}
      {tab === "attendance" && isStudent ? (
        <>
          <Panel title="Attendance summary" note="Read-only · Genesis via Salesforce">
            {!person.attendanceSummary ? (
              <EmptyState title="No attendance data yet" message="No attendance records received." />
            ) : (
              <>
                <div className="sf-stat-row">
                  <div>
                    <dt>Attendance rate</dt>
                    <dd>{person.attendanceSummary.rate}</dd>
                  </div>
                  <div>
                    <dt>Present</dt>
                    <dd>{person.attendanceSummary.present}</dd>
                  </div>
                  <div>
                    <dt>Absent</dt>
                    <dd>{person.attendanceSummary.absent}</dd>
                  </div>
                  <div>
                    <dt>Half day</dt>
                    <dd>{person.attendanceSummary.halfDay}</dd>
                  </div>
                </div>

                <h3 className="sf-subhead">By term</h3>
                <Table
                  head={["Term", "Rate", "Absences"]}
                  rows={person.attendanceSummary.byTerm.map((t) => [t.term, t.rate, String(t.absences)])}
                />
              </>
            )}
          </Panel>

          <Panel title="Attendance history" note="Most recent first">
            {!person.attendance?.length ? (
              <EmptyState title="No attendance data yet" message="No attendance records received." />
            ) : (
              <Table
                head={["Date", "Status", "Period", "Note"]}
                rows={person.attendance.map((a) => [
                  a.date,
                  <StatusBadge key="s" tone={a.status === "Present" ? "ok" : a.status === "Absent" ? "error" : "warn"}>
                    {a.status}
                  </StatusBadge>,
                  a.classPeriod ?? "—",
                  a.note ?? "—"
                ])}
              />
            )}
          </Panel>
        </>
      ) : null}

      {/* ------------------------------- faculty attendance submission */}
      {tab === "attendance" && !isStudent ? (
        <Panel
          title="Attendance submission"
          note="Whether attendance was taken for each assigned class"
        >
          {!person.attendanceCompliance?.length ? (
            <EmptyState title="No submission records" message="No attendance submission history." />
          ) : (
            <Table
              head={["Date", "Submitted", "Status", "Missing"]}
              rows={person.attendanceCompliance.map((row) => [
                row.date,
                `${row.submitted} of ${row.expected}`,
                <StatusBadge key="s" tone={row.submitted === row.expected ? "ok" : row.submitted === 0 ? "error" : "warn"}>
                  {row.submitted === row.expected ? "Complete" : "Incomplete"}
                </StatusBadge>,
                row.missing.length ? row.missing.join(", ") : "—"
              ])}
            />
          )}
        </Panel>
      ) : null}

      {/* ----------------------------------------------------------- goals */}
      {tab === "goals" ? (
        <Panel title="Goals" note="Read-only · templates configured in Academic Goals">
          {!person.goals?.length ? (
            <EmptyState title="No goals recorded" message="No active or historic goals for this student." />
          ) : (
            <Table
              head={["Goal", "Category", "Checkpoints", "Status", "Target", "Last updated"]}
              rows={person.goals.map((g) => [
                g.title,
                g.category,
                `${g.checkpointsMet} of ${g.checkpointsTotal}`,
                <StatusBadge
                  key="s"
                  tone={
                    g.status === "On track" || g.status === "Complete"
                      ? "ok"
                      : g.status === "Overdue"
                        ? "error"
                        : "warn"
                  }
                >
                  {g.status}
                </StatusBadge>,
                g.target,
                formatSalesforceStamp(g.lastUpdated)
              ])}
            />
          )}
          <Link className="sf-inline-link" href="/academic-goals">
            Open Academic Goals →
          </Link>
        </Panel>
      ) : null}

      {/* ---------------------------------------------------------- skills */}
      {tab === "skills" ? (
        <Panel title="Skills profile" note="Read-only · configured in Skills & Development">
          {!person.skills?.length ? (
            <EmptyState title="No skills assessed" message="No skills profile recorded for this student." />
          ) : (
            <div className="sf-skill-groups">
              {person.skills.map((group) => (
                <div className="sf-skill-group" key={group.group}>
                  <h3 className="sf-subhead">{group.group}</h3>
                  <ul className="sf-chip-list">
                    {group.subSkills.map((sub) => (
                      <li key={sub.label}>
                        <StatusBadge tone={LEVEL_TONE[sub.level]}>
                          {sub.label} · {sub.level}
                        </StatusBadge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <Link className="sf-inline-link" href={gradeConfigHref(person.school, person.group)}>
            Configure skills for {person.group} →
          </Link>
        </Panel>
      ) : null}

      {/* ----------------------------------------------- development areas */}
      {tab === "development" ? (
        <Panel title="Development areas" note="Read-only · configured in Skills & Development">
          {!person.developmentAreas?.length ? (
            <EmptyState title="No development areas" message="Nothing recorded for this student." />
          ) : (
            <div className="sf-skill-groups">
              {person.developmentAreas.map((area) => (
                <div className="sf-skill-group" key={area.area}>
                  <h3 className="sf-subhead">{area.area}</h3>
                  <ul className="sf-chip-list">
                    {area.skills.map((skill) => (
                      <li key={skill}>
                        <span className="sf-status sf-status--neutral">{skill}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <Link className="sf-inline-link" href={gradeConfigHref(person.school, person.group)}>
            Configure development areas for {person.group} →
          </Link>
        </Panel>
      ) : null}

      {/* -------------------------------------------- classes / schedule */}
      {tab === "classes" && isStudent ? (
        <Panel title="Classes & schedule" note="Read-only · Genesis via Salesforce">
          {!person.classes?.length ? (
            <EmptyState title="No class enrolments" message="No classes recorded for this student." />
          ) : (
            <Table
              head={["Class", "Teacher", "Period", "Room"]}
              rows={person.classes.map((c) => [c.className, c.teacher, c.period, c.room])}
            />
          )}
        </Panel>
      ) : null}

      {tab === "classes" && !isStudent ? (
        <>
          <Panel title="Classes & performance" note="Read-only · rolls up from Salesforce reports">
            {!person.teachingClasses?.length ? (
              <EmptyState title="No classes assigned" message="No teaching assignments recorded." />
            ) : (
              <Table
                head={["Class", "Roster", "Avg. attendance", "Assignment completion", "Open alerts"]}
                rows={person.teachingClasses.map((c) => [
                  c.className,
                  String(c.roster),
                  c.avgAttendance,
                  c.assignmentCompletion,
                  <StatusBadge key="a" tone={c.openAlerts > 2 ? "warn" : "neutral"}>
                    {c.openAlerts}
                  </StatusBadge>
                ])}
              />
            )}
          </Panel>

          <Panel title="Schedule" note="Assigned periods">
            {!person.schedule?.length ? (
              <EmptyState title="No schedule" message="No timetable recorded." />
            ) : (
              <Table
                head={["Period", "Class", "Room"]}
                rows={person.schedule.map((c) => [c.period, c.className, c.room])}
              />
            )}
          </Panel>
        </>
      ) : null}

      {/* ---------------------------------------------------------- alerts */}
      {tab === "alerts" ? (
        <Panel
          title={isStudent ? "Alert history" : "Student alerts"}
          note="Read-only · rules live in Alerts & Notifications"
        >
          {!person.alerts.length ? (
            <EmptyState
              title="No alerts"
              message={isStudent ? "No alerts raised for this student." : "No alerts involving this teacher's students."}
            />
          ) : (
            <Table
              head={["Rule", "Raised", "Raised by", "Status"]}
              rows={person.alerts.map((a) => [
                a.rule,
                formatSalesforceStamp(a.raised),
                a.raisedBy ?? "—",
                <StatusBadge key="s" tone={a.status === "Resolved" ? "ok" : a.overdue ? "error" : "warn"}>
                  {a.status}
                  {a.overdue ? " · past SLA" : ""}
                </StatusBadge>
              ])}
            />
          )}
          <Link className="sf-inline-link" href="/alerts">
            Open Alerts &amp; Notifications →
          </Link>
        </Panel>
      ) : null}

      {/* ----------------------------------------------------------- notes */}
      {tab === "notes" ? (
        <>
          <div className="sf-panel">
            <div className="sf-panel-head">
              <h2>Internal notes</h2>
              <span className="sf-status sf-status--ok">Editable in Admin</span>
            </div>
            <p className="sf-card-hint">
              Admin-native — not written back to Salesforce. TODO: local state only until the Admin
              DB contract exists.
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

function Panel({
  title,
  note,
  children
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>{title}</h2>
        {note ? <span className="sf-panel-note">{note}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="sf-table-wrap">
      <table className="sf-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th scope="col" key={h}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
