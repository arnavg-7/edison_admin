"use client";

import { useState } from "react";
import {
  AUTO_METRICS,
  GOAL_SESSIONS,
  SCOPE_TYPE_LABELS,
  TARGET_OPERATOR_LABELS,
  creatableScopes,
  gradeScopeId,
  type Goal,
  type MeasurementType,
  type ScopeType,
  type TargetOperator
} from "@/lib/data/goals";
import { useGoals } from "@/lib/goals-store";
import { useAdminActor, useAdminScope } from "@/lib/admin-scope";
import { classesByGrade, schools } from "@/lib/data/schools";
import { gradeRoster } from "@/lib/data/studentRoster";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

let seq = 0;

/** What the scope selector produces, before it is flattened onto the record. */
type ScopeDraft = { type: ScopeType; schoolId: string; grade: string; classId: string; studentId: string };

function scopeFromGoal(goal: Goal): ScopeDraft {
  const draft: ScopeDraft = {
    type: goal.scopeType,
    schoolId: "",
    grade: "",
    classId: "",
    studentId: ""
  };
  if (goal.scopeType === "school") draft.schoolId = goal.scopeId;
  if (goal.scopeType === "grade") {
    const [schoolId, grade] = goal.scopeId.split(":");
    draft.schoolId = schoolId ?? "";
    draft.grade = grade ?? "";
  }
  if (goal.scopeType === "class") draft.classId = goal.scopeId;
  if (goal.scopeType === "student") draft.studentId = goal.scopeId;
  return draft;
}

/**
 * Set or edit a goal.
 *
 * Two independent choices, laid out as two sections because the rulebook's key
 * principle is that they are not the same question: the scope decides who the
 * goal cascades to, and the measurement decides how progress is judged. Either
 * combination is valid.
 *
 * Only the scope levels this admin may create at are offered — a school admin has
 * no district option, per the permission matrix — and the check is on the value
 * saved, not only on what the dropdown shows.
 */
export function GoalDrawer({ goal, onClose }: { goal: Goal | null; onClose: () => void }) {
  const { createGoal, updateGoal } = useGoals();
  const actor = useAdminActor();
  const { school: scopedSchool } = useAdminScope();

  const allowed = creatableScopes(actor);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [scope, setScope] = useState<ScopeDraft>(
    goal
      ? scopeFromGoal(goal)
      : {
          type: allowed[0],
          schoolId: scopedSchool?.id ?? "",
          grade: "",
          classId: "",
          studentId: ""
        }
  );
  const [measurement, setMeasurement] = useState<MeasurementType>(goal?.measurementType ?? "manual");
  const [metricKey, setMetricKey] = useState(goal?.metricKey ?? AUTO_METRICS[0]?.key ?? "");
  const [operator, setOperator] = useState<TargetOperator>(goal?.targetOperator ?? "gte");
  const [targetValue, setTargetValue] = useState(goal?.targetValue ?? "");
  const [sessionId, setSessionId] = useState(goal?.academicSessionId ?? GOAL_SESSIONS[0].id);

  const session = GOAL_SESSIONS.find((entry) => entry.id === sessionId) ?? GOAL_SESSIONS[0];
  const metric = AUTO_METRICS.find((entry) => entry.key === metricKey) ?? AUTO_METRICS[0];

  const schoolOptions = (scopedSchool ? [scopedSchool] : schools).map((school) => ({
    value: school.id,
    label: school.name
  }));
  const gradeOptions = (schools.find((entry) => entry.id === scope.schoolId)?.grades ?? []).map(
    (grade) => ({ value: grade, label: `Grade ${grade}` })
  );
  const classOptions = (classesByGrade[scope.grade] ?? []).map((entry) => ({
    value: entry.id,
    label: entry.name
  }));
  const studentOptions =
    scope.schoolId && scope.grade
      ? gradeRoster(scope.schoolId, scope.grade).map((student) => ({
          value: student.id,
          label: student.name
        }))
      : [];

  /** Every level needs its own target chosen before the goal can resolve. */
  const scopeReady =
    scope.type === "district" ||
    (scope.type === "school" && scope.schoolId !== "") ||
    (scope.type === "grade" && scope.schoolId !== "" && scope.grade !== "") ||
    (scope.type === "class" && scope.classId !== "") ||
    (scope.type === "student" && scope.studentId !== "");

  const autoReady = measurement === "manual" || (metricKey !== "" && targetValue !== "");
  const canSave = title.trim() !== "" && scopeReady && autoReady && allowed.includes(scope.type);

  const scopeId = () => {
    if (scope.type === "district") return "";
    if (scope.type === "school") return scope.schoolId;
    if (scope.type === "grade") return gradeScopeId(scope.schoolId, scope.grade);
    if (scope.type === "class") return scope.classId;
    return scope.studentId;
  };

  const save = () => {
    if (!canSave) return;

    const record: Goal = {
      id: goal?.id ?? `goal-local-${Date.now()}-${seq++}`,
      title: title.trim(),
      description: description.trim(),
      // An admin creating a goal is its creator, at their own level.
      createdBy: goal?.createdBy ?? (actor.role === "district_admin" ? "District Office" : "School Office"),
      creatorRole: goal?.creatorRole ?? actor.role,
      scopeType: scope.type,
      scopeId: scopeId(),
      measurementType: measurement,
      metricKey: measurement === "auto" ? metricKey : null,
      targetOperator: measurement === "auto" ? operator : null,
      targetValue: measurement === "auto" ? targetValue : null,
      academicSessionId: sessionId,
      startDate: session.start,
      endDate: session.end,
      isActive: goal?.isActive ?? true
    };

    if (goal) updateGoal(record);
    else createGoal(record);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{goal ? "Edit goal" : "Set a goal"}</SheetTitle>
          <SheetDescription>
            {goal
              ? "Change the definition. Progress already recorded against it is kept."
              : "Name the goal, choose who it cascades to, then how progress is judged."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="poag-drawer-fields">
            <label className="sf-field">
              <span>Goal</span>
              <input
                type="text"
                autoFocus
                value={title}
                placeholder="e.g. Read six books outside the syllabus"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="sf-field">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                placeholder="What good looks like, in a sentence."
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            {/* ── Scope: who it cascades to ─────────────────────────────── */}
            <fieldset className="goal-fieldset">
              <legend>Who it applies to</legend>

              <label className="sf-field">
                <span>Scope level</span>
                <Combobox
                  options={allowed.map((type) => ({ value: type, label: SCOPE_TYPE_LABELS[type] }))}
                  value={scope.type}
                  onChange={(next) =>
                    setScope({ ...scope, type: next as ScopeType, classId: "", studentId: "" })
                  }
                />
                {/* Says what the level actually does, since "grade" alone does
                    not tell you it reaches students who enrol later. */}
                <span className="sf-field-hint">
                  {scope.type === "district"
                    ? "Every student in every school, including any who enrol later."
                    : scope.type === "school"
                      ? "Every student in the school, including any who enrol later."
                      : scope.type === "grade"
                        ? "Every student in that grade. Assignments reconcile on each roster sync."
                        : scope.type === "class"
                          ? "Every student currently enrolled in that class."
                          : "One student only."}
                </span>
              </label>

              {scope.type !== "district" ? (
                <label className="sf-field">
                  <span>School</span>
                  <Combobox
                    options={schoolOptions}
                    value={scope.schoolId}
                    onChange={(next) =>
                      setScope({ ...scope, schoolId: next, grade: "", classId: "", studentId: "" })
                    }
                    placeholder="Select a school"
                  />
                </label>
              ) : null}

              {scope.type === "grade" || scope.type === "class" || scope.type === "student" ? (
                <label className="sf-field">
                  <span>Grade</span>
                  <Combobox
                    options={gradeOptions}
                    value={scope.grade}
                    onChange={(next) =>
                      setScope({ ...scope, grade: next, classId: "", studentId: "" })
                    }
                    disabled={scope.schoolId === ""}
                    placeholder={scope.schoolId === "" ? "Select a school first" : "Select a grade"}
                  />
                </label>
              ) : null}

              {scope.type === "class" ? (
                <label className="sf-field">
                  <span>Class</span>
                  <Combobox
                    options={classOptions}
                    value={scope.classId}
                    onChange={(next) => setScope({ ...scope, classId: next })}
                    disabled={classOptions.length === 0}
                    placeholder={
                      scope.grade === ""
                        ? "Select a grade first"
                        : classOptions.length === 0
                          ? "No classes on record for this grade"
                          : "Select a class"
                    }
                  />
                </label>
              ) : null}

              {scope.type === "student" ? (
                <label className="sf-field">
                  <span>Student</span>
                  <Combobox
                    options={studentOptions}
                    value={scope.studentId}
                    onChange={(next) => setScope({ ...scope, studentId: next })}
                    disabled={studentOptions.length === 0}
                    placeholder={
                      scope.grade === "" ? "Select a grade first" : "Select a student"
                    }
                  />
                </label>
              ) : null}
            </fieldset>

            {/* ── Measurement: how progress is judged ───────────────────── */}
            <fieldset className="goal-fieldset">
              <legend>How progress is measured</legend>

              <div className="tone-options">
                <label className="tone-option">
                  <input
                    type="radio"
                    name="goal-measurement"
                    checked={measurement === "manual"}
                    onChange={() => setMeasurement("manual")}
                  />
                  <span className="tone-name">Manual — a person sets the status</span>
                </label>
                <label className="tone-option">
                  <input
                    type="radio"
                    name="goal-measurement"
                    checked={measurement === "auto"}
                    onChange={() => setMeasurement("auto")}
                  />
                  <span className="tone-name">Auto — the system computes it</span>
                </label>
              </div>

              {measurement === "auto" ? (
                <>
                  <label className="sf-field">
                    <span>Metric</span>
                    <Combobox
                      options={AUTO_METRICS.map((entry) => ({
                        value: entry.key,
                        label: entry.label
                      }))}
                      value={metricKey}
                      onChange={(next) => {
                        setMetricKey(next);
                        setTargetValue("");
                      }}
                    />
                    {/* Attendance and grades are deliberately absent: both feeds
                        are empty in the current export, so a goal against them
                        would never evaluate. */}
                    <span className="sf-field-hint">
                      POAG level is the only metric that can be evaluated today — it originates
                      inside the platform. Attendance and grades follow once those Genesis feeds
                      are live.
                    </span>
                  </label>

                  <div className="sf-field-row">
                    <label className="sf-field">
                      <span>Reaches</span>
                      <Combobox
                        options={(
                          Object.keys(TARGET_OPERATOR_LABELS) as TargetOperator[]
                        ).map((value) => ({ value, label: TARGET_OPERATOR_LABELS[value] }))}
                        value={operator}
                        onChange={(next) => setOperator(next as TargetOperator)}
                      />
                    </label>

                    <label className="sf-field">
                      <span>Target level</span>
                      <Combobox
                        options={(metric?.values ?? []).map((value) => ({ value, label: value }))}
                        value={targetValue}
                        onChange={setTargetValue}
                        placeholder="Select a level"
                      />
                    </label>
                  </div>

                  <p className="sf-field-hint">
                    Recalculated on every POAG rating change. Statuses become On Track, At Risk, Met
                    or Not Met — nobody sets them by hand.
                  </p>
                </>
              ) : (
                <p className="sf-field-hint">
                  Statuses are Not Started, In Progress, Completed and Not Met. Every change is
                  recorded with who made it, when, and an optional note.
                </p>
              )}
            </fieldset>

            <label className="sf-field">
              <span>Academic session</span>
              <Combobox
                options={GOAL_SESSIONS.map((entry) => ({ value: entry.id, label: entry.label }))}
                value={sessionId}
                onChange={setSessionId}
              />
              {/* The window comes from the session rather than two date pickers:
                  a goal belongs to a session, and hand-typed dates drift from it. */}
              <span className="sf-field-hint">
                Runs {session.start} to {session.end}. An unmet goal closes as Not Met at the end
                date and is not rolled forward.
              </span>
            </label>
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            {goal ? "Save goal" : "Set goal"}
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
