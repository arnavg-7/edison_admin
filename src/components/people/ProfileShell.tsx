"use client";

import { useState } from "react";
import Link from "next/link";
import {
  salesforceRecordUrl,
  type AlertRecord,
  type GoalRecord,
  type Person,
  type ReadOnlyField
} from "@/lib/data/people";
import { gradeConfigHref, resolveGradeScope } from "@/lib/data/skillsDevelopment";
import { DevelopmentAreasEditor } from "@/components/skills-development/DevelopmentAreasEditor";
import { SkillsProfileEditor } from "@/components/skills-development/SkillsProfileEditor";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatSalesforceStamp } from "@/lib/format";

const GOAL_STATUSES: GoalRecord["status"][] = ["On track", "At risk", "Complete", "Overdue"];
const ALERT_STATUSES: AlertRecord["status"][] = ["Open", "Acknowledged", "Resolved"];

type TabId =
  | "personal"
  | "academic"
  | "grades"
  | "attendance"
  | "goals"
  | "skills"
  | "development"
  | "classes"
  | "alerts";

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
  { id: "alerts", label: "Alert history" }
];

const FACULTY_TABS: { id: TabId; label: string }[] = [
  { id: "personal", label: "Personal details" },
  { id: "academic", label: "Assignment summary" },
  { id: "classes", label: "Classes & performance" },
  { id: "attendance", label: "Attendance submission" },
  { id: "alerts", label: "Student alerts" }
];

export function ProfileShell({ person }: { person: Person }) {
  const isStudent = person.kind === "student";
  const tabs = isStudent ? STUDENT_TABS : FACULTY_TABS;
  const [tab, setTab] = useState<TabId>("personal");

  const [goals, setGoals] = useState<GoalRecord[]>(person.goals ?? []);
  const [alertRecords, setAlertRecords] = useState<AlertRecord[]>(person.alerts);

  const gradeScope = isStudent ? resolveGradeScope(person.school, person.group) : null;

  const adjustCheckpoint = (goalId: string, delta: number) => {
    setGoals((current) =>
      current.map((g) =>
        g.id === goalId
          ? {
              ...g,
              checkpointsMet: Math.max(0, Math.min(g.checkpointsTotal, g.checkpointsMet + delta)),
              lastUpdated: new Date().toISOString()
            }
          : g
      )
    );
  };

  const setGoalStatus = (goalId: string, status: GoalRecord["status"]) => {
    setGoals((current) =>
      current.map((g) => (g.id === goalId ? { ...g, status, lastUpdated: new Date().toISOString() } : g))
    );
  };

  const setAlertStatus = (alertId: string, status: AlertRecord["status"]) => {
    setAlertRecords((current) =>
      current.map((a) =>
        a.id === alertId ? { ...a, status, overdue: status === "Open" ? a.overdue : false } : a
      )
    );
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
        <Panel title="Goals" note="Editable in Admin · templates configured in Academic Goals">
          <p className="sf-card-hint">
            Admin-native — checkpoint and status changes apply only to this student and are not
            written back to Salesforce or the shared goal template. TODO: local state only until
            the Admin DB contract exists.
          </p>
          {!goals.length ? (
            <EmptyState title="No goals recorded" message="No active or historic goals for this student." />
          ) : (
            <Table
              head={["Goal", "Category", "Checkpoints", "Status", "Target", "Last updated"]}
              widths={["28%", "16%", "15%", "14%", "12%", "15%"]}
              rows={goals.map((g) => [
                g.title,
                g.category,
                <div className="sf-stepper" key="c">
                  <button
                    type="button"
                    className="sf-stepper-btn"
                    onClick={() => adjustCheckpoint(g.id, -1)}
                    disabled={g.checkpointsMet <= 0}
                    aria-label={`Decrease checkpoints met for ${g.title}`}
                  >
                    −
                  </button>
                  <span>
                    {g.checkpointsMet} of {g.checkpointsTotal}
                  </span>
                  <button
                    type="button"
                    className="sf-stepper-btn"
                    onClick={() => adjustCheckpoint(g.id, 1)}
                    disabled={g.checkpointsMet >= g.checkpointsTotal}
                    aria-label={`Increase checkpoints met for ${g.title}`}
                  >
                    +
                  </button>
                </div>,
                <select
                  key="s"
                  className="sf-input"
                  value={g.status}
                  aria-label={`Status for ${g.title}`}
                  onChange={(event) => setGoalStatus(g.id, event.target.value as GoalRecord["status"])}
                >
                  {GOAL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>,
                g.target,
                <span key="u" style={{ whiteSpace: "nowrap" }}>
                  {formatSalesforceStamp(g.lastUpdated)}
                </span>
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
        gradeScope ? (
          <>
            <p className="sf-page-sub">
              Shared configuration for every {person.group} student at {person.school} — the same
              editor as Skills &amp; Development. Changes here are grade-wide, not just for {person.name}.
            </p>
            <SkillsProfileEditor schoolId={gradeScope.schoolId} grade={gradeScope.grade} />
            <Link className="sf-inline-link" href={gradeConfigHref(person.school, person.group)}>
              Open in Skills &amp; Development →
            </Link>
          </>
        ) : (
          <Panel title="Skills profile" note="Configured in Skills & Development">
            <EmptyState
              title="No grade configured"
              message={`${person.school} has no matching grade in Skills & Development yet.`}
            />
          </Panel>
        )
      ) : null}

      {/* ----------------------------------------------- development areas */}
      {tab === "development" ? (
        gradeScope ? (
          <>
            <p className="sf-page-sub">
              Shared configuration for every {person.group} student at {person.school} — the same
              editor as Skills &amp; Development. Changes here are grade-wide, not just for {person.name}.
            </p>
            <DevelopmentAreasEditor schoolId={gradeScope.schoolId} grade={gradeScope.grade} />
            <Link className="sf-inline-link" href={gradeConfigHref(person.school, person.group)}>
              Open in Skills &amp; Development →
            </Link>
          </>
        ) : (
          <Panel title="Development areas" note="Configured in Skills & Development">
            <EmptyState
              title="No grade configured"
              message={`${person.school} has no matching grade in Skills & Development yet.`}
            />
          </Panel>
        )
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
          note={
            isStudent
              ? "Editable in Admin · rules live in Alerts & Notifications"
              : "Read-only · rules live in Alerts & Notifications"
          }
        >
          {isStudent ? (
            <p className="sf-card-hint">
              Admin-native — status changes apply only to this record and are not written back to
              Salesforce. TODO: local state only until the Admin DB contract exists.
            </p>
          ) : null}
          {!alertRecords.length ? (
            <EmptyState
              title="No alerts"
              message={isStudent ? "No alerts raised for this student." : "No alerts involving this teacher's students."}
            />
          ) : (
            <Table
              head={["Rule", "Raised", "Raised by", "Status"]}
              rows={alertRecords.map((a) =>
                isStudent
                  ? [
                      a.rule,
                      formatSalesforceStamp(a.raised),
                      a.raisedBy ?? "—",
                      <div className="sf-alert-status-cell" key="s">
                        <select
                          className="sf-input"
                          value={a.status}
                          aria-label={`Status for ${a.rule}`}
                          onChange={(event) => setAlertStatus(a.id, event.target.value as AlertRecord["status"])}
                        >
                          {ALERT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        {a.overdue && a.status === "Open" ? (
                          <span className="sf-status sf-status--error">Past SLA</span>
                        ) : null}
                      </div>
                    ]
                  : [
                      a.rule,
                      formatSalesforceStamp(a.raised),
                      a.raisedBy ?? "—",
                      <StatusBadge key="s" tone={a.status === "Resolved" ? "ok" : a.overdue ? "error" : "warn"}>
                        {a.status}
                        {a.overdue ? " · past SLA" : ""}
                      </StatusBadge>
                    ]
              )}
            />
          )}
          <Link className="sf-inline-link" href="/alerts">
            Open Alerts &amp; Notifications →
          </Link>
        </Panel>
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

function Table({
  head,
  rows,
  widths
}: {
  head: string[];
  rows: React.ReactNode[][];
  /** Optional per-column width hints (e.g. "34%") for tables whose columns
      would otherwise size unevenly around a couple of short-content ones. */
  widths?: string[];
}) {
  return (
    <div className="sf-table-wrap">
      <table className="sf-table">
        {widths ? (
          <colgroup>
            {widths.map((width, index) => (
              <col key={index} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
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
