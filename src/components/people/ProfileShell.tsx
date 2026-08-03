"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PROFILE_STATUS_TONE,
  REQUIRED_PERSONAL_FIELDS,
  deriveProfileStatus,
  type AlertRecord,
  type AttendanceSummary,
  type ClassEnrolment,
  type ClassPerformanceRow,
  type GoalRecord,
  type GradeRecord,
  type Person,
  type PersonKind,
  type ReadOnlyField
} from "@/lib/data/people";
import { useUsers } from "@/lib/users-store";
import { gradeConfigHref, resolveGradeScope } from "@/lib/data/skillsDevelopment";
import { DevelopmentAreasEditor } from "@/components/skills-development/DevelopmentAreasEditor";
import { SkillsProfileEditor } from "@/components/skills-development/SkillsProfileEditor";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSalesforceStamp } from "@/lib/format";

const GOAL_STATUSES: GoalRecord["status"][] = ["On track", "At risk", "Complete", "Overdue"];
const ALERT_STATUSES: AlertRecord["status"][] = ["Open", "Acknowledged", "Resolved"];

type ComboOption<T extends string> = { value: T; label: string };

const isOptionEqual = <T extends string>(a: ComboOption<T>, b: ComboOption<T>) => a.value === b.value;

const GOAL_STATUS_OPTIONS: ComboOption<GoalRecord["status"]>[] = GOAL_STATUSES.map((status) => ({
  value: status,
  label: status
}));

const ALERT_STATUS_OPTIONS: ComboOption<AlertRecord["status"]>[] = ALERT_STATUSES.map((status) => ({
  value: status,
  label: status
}));

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
  const [grades, setGrades] = useState<GradeRecord[]>(person.grades ?? []);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | undefined>(
    person.attendanceSummary
  );
  const [classes, setClasses] = useState<ClassEnrolment[]>(person.classes ?? []);
  const [teachingClasses, setTeachingClasses] = useState<ClassPerformanceRow[]>(
    person.teachingClasses ?? []
  );
  const [schedule, setSchedule] = useState<ClassEnrolment[]>(person.schedule ?? []);

  const gradeScope = isStudent ? resolveGradeScope(person.school, person.group) : null;

  // Derived from the record on every render, so filling a required field on the
  // Personal details tab moves the badge without an explicit save step.
  const profileStatus = deriveProfileStatus(person);
  const filledLabels = new Map(person.personal.map((field) => [field.label, field.value]));
  const missingRequired = REQUIRED_PERSONAL_FIELDS[person.kind].filter(
    (label) => (filledLabels.get(label) ?? "").trim() === ""
  );

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

  const updateGrade = (index: number, patch: Partial<GradeRecord>) => {
    setGrades((current) => current.map((g, i) => (i === index ? { ...g, ...patch } : g)));
  };

  const updateAttendanceStat = (patch: Partial<AttendanceSummary>) => {
    setAttendanceSummary((current) => (current ? { ...current, ...patch } : current));
  };

  const updateAttendanceTerm = (index: number, patch: Partial<AttendanceSummary["byTerm"][number]>) => {
    setAttendanceSummary((current) =>
      current
        ? { ...current, byTerm: current.byTerm.map((t, i) => (i === index ? { ...t, ...patch } : t)) }
        : current
    );
  };

  const updateClass = (index: number, patch: Partial<ClassEnrolment>) => {
    setClasses((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateTeachingClass = (index: number, patch: Partial<ClassPerformanceRow>) => {
    setTeachingClasses((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  const updateSchedule = (index: number, patch: Partial<ClassEnrolment>) => {
    setSchedule((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
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
          <StatusBadge tone={PROFILE_STATUS_TONE[profileStatus]}>{profileStatus}</StatusBadge>
          {/* Academic risk only means something once the profile is complete —
              before that there is nothing to assess it from. */}
          {profileStatus === "Active" ? (
            <StatusBadge
              tone={person.status === "At Risk" ? "warn" : person.status === "Other" ? "neutral" : "ok"}
            >
              {person.status}
            </StatusBadge>
          ) : null}
        </div>
      </div>

      {profileStatus !== "Active" ? (
        <div className="sf-notice" role="status">
          <p className="sf-notice-title">
            Complete this user&rsquo;s profile to activate their account.
          </p>
          <p className="sf-notice-detail">
            Still needed on Personal details: {missingRequired.join(", ")}.
          </p>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabId)}>
        <TabsList variant="line" aria-label="Profile sections">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "personal" ? (
        <EditableFieldsPanel
          title="Personal details"
          fields={person.personal}
          kind={person.kind}
          personId={person.id}
          section="personal"
        />
      ) : null}

      {tab === "academic" ? (
        <EditableFieldsPanel
          title={isStudent ? "Enrollment & academic record" : "Assignment summary"}
          fields={person.academic}
          kind={person.kind}
          personId={person.id}
          section="academic"
        />
      ) : null}

      {/* ---------------------------------------------------------- grades */}
      {tab === "grades" ? (
        <>
          <Panel title="Current term grades" note="Editable in Admin">
            <p className="sf-card-hint">
              Admin-native — grade changes apply only to this record. TODO: local state only until
              the Admin DB contract exists.
            </p>
            {!grades.length ? (
              <EmptyState title="No grades recorded" message="No current-term grades for this student." />
            ) : (
              <Table
                head={["Subject", "Teacher", "Grade", "Percent", "Assignments"]}
                rows={grades.map((g, index) => [
                  g.subject,
                  g.teacher,
                  <input
                    key="grade"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={g.grade}
                    aria-label={`Grade for ${g.subject}`}
                    onChange={(event) => updateGrade(index, { grade: event.target.value })}
                  />,
                  <input
                    key="percent"
                    type="number"
                    className="sf-input sf-input--cell"
                    value={g.percent}
                    min={0}
                    max={100}
                    aria-label={`Percent for ${g.subject}`}
                    onChange={(event) => updateGrade(index, { percent: Number(event.target.value) })}
                  />,
                  <div className="sf-stepper" key="assignments">
                    <input
                      type="number"
                      className="sf-input sf-input--cell"
                      value={g.assignmentsComplete}
                      min={0}
                      max={g.assignmentsSet}
                      aria-label={`Assignments complete for ${g.subject}`}
                      onChange={(event) =>
                        updateGrade(index, { assignmentsComplete: Number(event.target.value) })
                      }
                    />
                    <span>of {g.assignmentsSet}</span>
                  </div>
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
          <Panel title="Attendance summary" note="Editable in Admin">
            <p className="sf-card-hint">
              Admin-native — changes apply only to this record. TODO: local state only until the
              Admin DB contract exists.
            </p>
            {!attendanceSummary ? (
              <EmptyState title="No attendance data yet" message="No attendance records received." />
            ) : (
              <>
                <div className="sf-stat-row">
                  <div>
                    <dt>Attendance rate</dt>
                    <dd>
                      <input
                        type="text"
                        value={attendanceSummary.rate}
                        aria-label="Attendance rate"
                        onChange={(event) => updateAttendanceStat({ rate: event.target.value })}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Present</dt>
                    <dd>
                      <input
                        type="number"
                        min={0}
                        value={attendanceSummary.present}
                        aria-label="Present days"
                        onChange={(event) =>
                          updateAttendanceStat({ present: Number(event.target.value) })
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Absent</dt>
                    <dd>
                      <input
                        type="number"
                        min={0}
                        value={attendanceSummary.absent}
                        aria-label="Absent days"
                        onChange={(event) =>
                          updateAttendanceStat({ absent: Number(event.target.value) })
                        }
                      />
                    </dd>
                  </div>
                  <div>
                    <dt>Half day</dt>
                    <dd>
                      <input
                        type="number"
                        min={0}
                        value={attendanceSummary.halfDay}
                        aria-label="Half days"
                        onChange={(event) =>
                          updateAttendanceStat({ halfDay: Number(event.target.value) })
                        }
                      />
                    </dd>
                  </div>
                </div>

                <h3 className="sf-subhead">By term</h3>
                <Table
                  head={["Term", "Rate", "Absences"]}
                  rows={attendanceSummary.byTerm.map((t, index) => [
                    t.term,
                    <input
                      key="rate"
                      type="text"
                      className="sf-input sf-input--cell"
                      value={t.rate}
                      aria-label={`Rate for ${t.term}`}
                      onChange={(event) => updateAttendanceTerm(index, { rate: event.target.value })}
                    />,
                    <input
                      key="absences"
                      type="number"
                      min={0}
                      className="sf-input sf-input--cell"
                      value={t.absences}
                      aria-label={`Absences for ${t.term}`}
                      onChange={(event) =>
                        updateAttendanceTerm(index, { absences: Number(event.target.value) })
                      }
                    />
                  ])}
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
            Checkpoint and status changes apply to this student only, not to the shared goal
            template. TODO: local state only until the Admin DB contract exists.
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
                <Combobox
                  key="s"
                  items={GOAL_STATUS_OPTIONS}
                  value={GOAL_STATUS_OPTIONS.find((option) => option.value === g.status) ?? null}
                  onValueChange={(option) => setGoalStatus(g.id, option?.value ?? g.status)}
                  isItemEqualToValue={isOptionEqual}
                >
                  <ComboboxInput aria-label={`Status for ${g.title}`} placeholder="Status" />
                  <ComboboxContent>
                    <ComboboxEmpty>No matches</ComboboxEmpty>
                    <ComboboxList>
                      {(option: ComboOption<GoalRecord["status"]>) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>,
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
        <Panel title="Classes & schedule" note="Editable in Admin">
          <p className="sf-card-hint">
            Admin-native — changes apply only to this record. TODO: local state only until the
            Admin DB contract exists.
          </p>
          {!classes.length ? (
            <EmptyState title="No class enrolments" message="No classes recorded for this student." />
          ) : (
            <Table
              head={["Class", "Teacher", "Period", "Room"]}
              rows={classes.map((c, index) => [
                c.className,
                <input
                  key="teacher"
                  type="text"
                  className="sf-input sf-input--cell"
                  value={c.teacher}
                  aria-label={`Teacher for ${c.className}`}
                  onChange={(event) => updateClass(index, { teacher: event.target.value })}
                />,
                <input
                  key="period"
                  type="text"
                  className="sf-input sf-input--cell"
                  value={c.period}
                  aria-label={`Period for ${c.className}`}
                  onChange={(event) => updateClass(index, { period: event.target.value })}
                />,
                <input
                  key="room"
                  type="text"
                  className="sf-input sf-input--cell"
                  value={c.room}
                  aria-label={`Room for ${c.className}`}
                  onChange={(event) => updateClass(index, { room: event.target.value })}
                />
              ])}
            />
          )}
        </Panel>
      ) : null}

      {tab === "classes" && !isStudent ? (
        <>
          <Panel title="Classes & performance" note="Editable in Admin">
            <p className="sf-card-hint">
              Admin-native — changes apply only to this record. TODO: local state only until the
              Admin DB contract exists.
            </p>
            {!teachingClasses.length ? (
              <EmptyState title="No classes assigned" message="No teaching assignments recorded." />
            ) : (
              <Table
                head={["Class", "Roster", "Avg. attendance", "Assignment completion", "Open alerts"]}
                rows={teachingClasses.map((c, index) => [
                  c.className,
                  <input
                    key="roster"
                    type="number"
                    min={0}
                    className="sf-input sf-input--cell"
                    value={c.roster}
                    aria-label={`Roster size for ${c.className}`}
                    onChange={(event) => updateTeachingClass(index, { roster: Number(event.target.value) })}
                  />,
                  <input
                    key="attendance"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={c.avgAttendance}
                    aria-label={`Average attendance for ${c.className}`}
                    onChange={(event) => updateTeachingClass(index, { avgAttendance: event.target.value })}
                  />,
                  <input
                    key="completion"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={c.assignmentCompletion}
                    aria-label={`Assignment completion for ${c.className}`}
                    onChange={(event) =>
                      updateTeachingClass(index, { assignmentCompletion: event.target.value })
                    }
                  />,
                  <input
                    key="alerts"
                    type="number"
                    min={0}
                    className="sf-input sf-input--cell"
                    value={c.openAlerts}
                    aria-label={`Open alerts for ${c.className}`}
                    onChange={(event) => updateTeachingClass(index, { openAlerts: Number(event.target.value) })}
                  />
                ])}
              />
            )}
          </Panel>

          <Panel title="Schedule" note="Assigned periods · editable in Admin">
            {!schedule.length ? (
              <EmptyState title="No schedule" message="No timetable recorded." />
            ) : (
              <Table
                head={["Period", "Class", "Room"]}
                rows={schedule.map((c, index) => [
                  <input
                    key="period"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={c.period}
                    aria-label={`Period ${index + 1}`}
                    onChange={(event) => updateSchedule(index, { period: event.target.value })}
                  />,
                  <input
                    key="class"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={c.className}
                    aria-label={`Class for period ${index + 1}`}
                    onChange={(event) => updateSchedule(index, { className: event.target.value })}
                  />,
                  <input
                    key="room"
                    type="text"
                    className="sf-input sf-input--cell"
                    value={c.room}
                    aria-label={`Room for period ${index + 1}`}
                    onChange={(event) => updateSchedule(index, { room: event.target.value })}
                  />
                ])}
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
              Status changes apply to this record only. TODO: local state only until the Admin DB
              contract exists.
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
                        <Combobox
                          items={ALERT_STATUS_OPTIONS}
                          value={ALERT_STATUS_OPTIONS.find((option) => option.value === a.status) ?? null}
                          onValueChange={(option) => setAlertStatus(a.id, option?.value ?? a.status)}
                          isItemEqualToValue={isOptionEqual}
                        >
                          <ComboboxInput aria-label={`Status for ${a.rule}`} placeholder="Status" />
                          <ComboboxContent>
                            <ComboboxEmpty>No matches</ComboboxEmpty>
                            <ComboboxList>
                              {(option: ComboOption<AlertRecord["status"]>) => (
                                <ComboboxItem key={option.value} value={option}>
                                  {option.label}
                                </ComboboxItem>
                              )}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                        {a.overdue && a.status === "Open" ? (
                          <StatusBadge tone="error">Past SLA</StatusBadge>
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

/**
 * Field editor backed by the user store, so edits persist and the profile
 * status recomputes as required fields get filled in. Required fields carry a
 * marker while blank — those are the ones gating activation.
 */
function EditableFieldsPanel({
  title,
  fields,
  kind,
  personId,
  section
}: {
  title: string;
  fields: ReadOnlyField[];
  kind: PersonKind;
  personId: string;
  section: "personal" | "academic";
}) {
  const { setField } = useUsers();
  const required = section === "personal" ? REQUIRED_PERSONAL_FIELDS[kind] : [];

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>{title}</h2>
        <span className="sf-panel-note">Editable in Admin</span>
      </div>

      <dl className="sf-field-grid">
        {fields.map((field) => {
          const isRequired = required.includes(field.label);
          const isMissing = isRequired && field.value.trim() === "";

          return (
            <div key={field.label}>
              <dt>
                {field.label}
                {isMissing ? <span className="sf-field-required"> Required</span> : null}
              </dt>
              <dd>
                <input
                  type="text"
                  className="sf-input"
                  value={field.value}
                  aria-label={field.label}
                  aria-required={isRequired || undefined}
                  placeholder={isRequired ? "Required to activate" : "Not set"}
                  onChange={(event) =>
                    setField(kind, personId, section, field.label, event.target.value)
                  }
                />
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
