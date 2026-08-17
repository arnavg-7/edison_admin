"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  goalCategories,
  goalTemplates,
  isPastSemester,
  type GradeGoal
} from "@/lib/data/academicGoals";
import {
  deleteGoal,
  goalsInScope,
  sameScope,
  saveGoal,
  type GoalScope
} from "@/lib/academic-goals-store";
import { gradeLabel, gradesForSchool, schools } from "@/lib/data/schools";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { StudentGoalsPanel } from "./StudentGoalsPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

// TODO: local state only — persist through the Admin DB Academic Goals
// contract when it exists.

type ComboOption = { value: string; label: string };

const categoryOptions: ComboOption[] = goalCategories.map((category) => ({
  value: category.title,
  label: category.title
}));

/** Published templates, offered as a starting point for a new goal's name. */
const templateOptions: ComboOption[] = goalTemplates.map((template) => ({
  value: template.title,
  label: template.title
}));

/** Every school, so a goal can be set for a grade other than the one on screen. */
const schoolOptions: ComboOption[] = schools.map((school) => ({
  value: school.id,
  label: school.name
}));

let seq = 0;
const nextId = (scope: string) => `gg-local-${scope}-${Date.now()}-${seq++}`;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

/** Formats a YYYY-MM-DD string without going through Date/timezone conversion. */
function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

function formatDateRange(from: string, to: string): string {
  return `${formatIsoDate(from)} – ${formatIsoDate(to)}`;
}

type Draft = {
  /** The scope the goal is being written to — starts as the grade on screen. */
  schoolId: string;
  grade: string;
  title: string;
  description: string;
  category: string;
  semesterName: string;
  semesterFrom: string;
  semesterTo: string;
};

function emptyDraft(scope: GoalScope): Draft {
  return {
    schoolId: scope.schoolId,
    grade: scope.grade,
    title: "",
    description: "",
    category: goalCategories[0]?.title ?? "",
    semesterName: "",
    semesterFrom: "",
    semesterTo: ""
  };
}

/**
 * Goal setting for one grade at one school: the admin names a goal,
 * describes it, tags a category, and assigns it to a semester with start
 * and end dates. Once a goal's semester end date has passed, it moves to
 * the read-only Goal History tab.
 *
 * Student goals sit beside them on a third tab: those are personal goals a
 * student or their teacher wrote for one student, not goals an admin set for
 * the grade, so they are read-only here.
 *
 * Tabs are local rather than routed, mirroring Skills & Development's
 * identical drill-down (`GradeScopeEditor`): the panels are the same grade's
 * goals viewed three ways, so keeping them on one URL means the school/grade
 * drilled into stays in the address bar.
 */
const TABS = ["Goals", "Student goals", "Goal History"] as const;

export function GradeGoalsEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const router = useRouter();
  const scope: GoalScope = { schoolId, grade };

  const [goals, setGoals] = useState<GradeGoal[]>(() => goalsInScope(scope));
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

  useEffect(() => {
    setGoals(goalsInScope({ schoolId, grade }));
  }, [schoolId, grade]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(scope));

  const startAdd = () => {
    setDraft(emptyDraft(scope));
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (goal: GradeGoal) => {
    setDraft({
      // A goal in this table belongs to this grade; changing either field in the
      // drawer moves it.
      schoolId,
      grade,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      semesterName: goal.semester.name,
      semesterFrom: goal.semester.from,
      semesterTo: goal.semester.to
    });
    setIsAdding(false);
    setEditingId(goal.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  /** Switching school keeps the grade only if the new school teaches it. */
  const setDraftSchool = (nextSchoolId: string) => {
    const grades = gradesForSchool(nextSchoolId);
    setDraft({
      ...draft,
      schoolId: nextSchoolId,
      grade: grades.includes(draft.grade) ? draft.grade : ""
    });
  };

  const canSave =
    draft.schoolId !== "" &&
    draft.grade !== "" &&
    draft.title.trim() !== "" &&
    draft.description.trim() !== "" &&
    draft.semesterName.trim() !== "" &&
    draft.semesterFrom !== "" &&
    draft.semesterTo !== "" &&
    draft.semesterFrom <= draft.semesterTo;

  const save = () => {
    if (!canSave) {
      return;
    }

    const target: GoalScope = { schoolId: draft.schoolId, grade: draft.grade };

    const goal: GradeGoal = {
      id: editingId ?? nextId(`${target.schoolId}-${target.grade}`),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      semester: {
        name: draft.semesterName.trim(),
        from: draft.semesterFrom,
        to: draft.semesterTo
      }
    };

    saveGoal(target, goal, editingId ? scope : undefined);
    // Re-read rather than patch the list: a goal written to another grade — or
    // moved out of this one by an edit — has to leave this table.
    setGoals(goalsInScope(scope));
    cancel();

    /* Goals only ever show on their own grade's page, so a goal set for another
       scope would land somewhere the admin can't see from here. Follow it, and
       the page title and breadcrumb confirm where it went. */
    if (!sameScope(target, scope)) {
      router.push(`/academic-goals/${target.schoolId}/${encodeURIComponent(target.grade)}`);
    }
  };

  const remove = (id: string) => {
    deleteGoal(scope, id);
    setGoals(goalsInScope(scope));
    if (editingId === id) {
      cancel();
    }
  };

  const current = goals.filter((goal) => !isPastSemester(goal));
  const history = goals.filter((goal) => isPastSemester(goal));

  /* No active goals — the empty state owns the CTA, so the panel head hides its
     own. This used to also require `!isAdding`, because the inline form replaced
     the empty state; the drawer opens over it, so the empty state should stay. */
  const hasNoCurrentGoals = current.length === 0;

  /* Add and edit are one form in one drawer, so `isAdding` and `editingId` share
     a single open state — they were already mutually exclusive (each setter
     clears the other), and a drawer can only show one of them at a time. */
  const isFormOpen = isAdding || editingId !== null;

  const gradeOptions: ComboOption[] = gradesForSchool(draft.schoolId).map((value) => ({
    value,
    label: gradeLabel(value)
  }));

  const fields = (
    <div className="list-editor-form list-editor-form--drawer">
      {/* Templates are a Combobox, not the `list=`/<datalist> this used to be.
          A datalist is drawn by the browser: Chrome hangs its own caret on the
          input on hover, so the field looked like a dropdown the app doesn't
          have anywhere else, and the list it opened matched nothing in the
          filter bar. Picking a template fills the name below, which stays a
          plain text field — the name is still free text, the template is only a
          starting point. */}
      <label className="sf-field sf-field--prestep">
        <span>Start from a template</span>
        <Combobox
          options={templateOptions}
          value=""
          onChange={(title) => setDraft({ ...draft, title })}
          placeholder="Optional — pick a published template"
          ariaLabel="Start from a goal template"
        />
      </label>

      {/* Which grade the goal is being set for. Defaults to the grade whose page
          the drawer was opened from, so the common case is a no-op, but a goal
          that belongs to another grade — or the whole of another school, one
          grade at a time — no longer means backing out to the school list
          first. Sits above the goal's own fields because it is the thing that
          decides who the goal is for. */}
      <div className="sf-field-row">
        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={schoolOptions}
            value={draft.schoolId}
            onChange={setDraftSchool}
            placeholder="Select a school"
            ariaLabel="School this goal is for"
          />
        </label>

        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeOptions}
            value={draft.grade}
            onChange={(next) => setDraft({ ...draft, grade: next })}
            placeholder="Select a grade"
            disabled={draft.schoolId === ""}
            ariaLabel="Grade this goal is for"
          />
        </label>
      </div>

      <label className="sf-field">
        <span>Goal name</span>
        <input
          type="text"
          autoFocus
          value={draft.title}
          placeholder="e.g. Attendance improvement plan"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          placeholder="What is this goal, and what does success look like?"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Category</span>
        <Combobox
          options={categoryOptions}
          value={draft.category}
          onChange={(next) => setDraft({ ...draft, category: next })}
          placeholder="Select a category"
        />
      </label>

      <label className="sf-field">
        <span>Semester name</span>
        <input
          type="text"
          value={draft.semesterName}
          placeholder="e.g. Fall 2026"
          onChange={(event) => setDraft({ ...draft, semesterName: event.target.value })}
        />
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Start date</span>
          <input
            type="date"
            value={draft.semesterFrom}
            onChange={(event) => setDraft({ ...draft, semesterFrom: event.target.value })}
          />
        </label>

        <label className="sf-field">
          <span>End date</span>
          <input
            type="date"
            value={draft.semesterTo}
            onChange={(event) => setDraft({ ...draft, semesterTo: event.target.value })}
          />
        </label>
      </div>

    </div>
  );

  /**
   * The form lives in a right-side drawer rather than inline in the panel. Inline,
   * it pushed the goals table down the page on add and swallowed a row whole on
   * edit, so the list you were working against moved or disappeared underneath
   * you. A drawer leaves the table in place.
   *
   * Actions sit in the drawer's own footer, not in the field list, so they stay
   * reachable at the bottom edge while the fields above scroll.
   */
  const formDrawer = (
    <Sheet
      open={isFormOpen}
      onOpenChange={(open) => {
        if (!open) cancel();
      }}
    >
      {/* The variant-prefixed form of the width, matching SheetContent's own
          `data-[side=right]:sm:max-w-sm`. A plain `sm:max-w-lg` is a different
          key to tailwind-merge, so both survive and the data-variant one wins —
          the drawer stayed 384px, too narrow for the two-column date row. */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{editingId ? "Edit goal" : "Set a goal"}</SheetTitle>
          <SheetDescription>
            {editingId
              ? "Update this goal's grade, details, category or semester."
              : "Pick the school and grade it's for, name it, tag a category, and assign it to a semester."}
          </SheetDescription>
        </SheetHeader>

        {/* min-h-0 so this scrolls instead of forcing the footer off-screen. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6">{fields}</div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            {editingId ? "Save goal" : "Submit goal"}
          </Button>
          <Button color="secondary" size="sm" onClick={cancel}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as (typeof TABS)[number])}
        className="sf-section-tabs"
      >
        <TabsList variant="line" aria-label="Goals view">
          {TABS.map((label) => (
            <TabsTrigger key={label} value={label}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "Student goals" ? (
        <StudentGoalsPanel schoolId={schoolId} grade={grade} />
      ) : null}

      {tab === "Goals" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Current goals</h2>
            {/* While empty, the only call to action lives inside the empty state, so
                there aren't two "Set a goal" buttons competing on one screen. */}
            {hasNoCurrentGoals ? null : <Button
                size="sm"
                onClick={startAdd}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
              >
                Set a goal
              </Button>}
          </div>

          {hasNoCurrentGoals ? (
            <EmptyState
              title="No current goals"
              message="Set a goal for this grade's semester to get started."
              action={<Button
                size="sm"
                onClick={startAdd}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
              >
                Set a goal
              </Button>}
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Goal</th>
                    <th scope="col">Category</th>
                    <th scope="col">Semester</th>
                    <th scope="col">Dates</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {/* Editing no longer swaps the row out for the form — the row
                      stays put and the drawer opens over it, so you can still
                      see the goal you're editing and the ones around it. */}
                  {current.map((goal) => (
                      <tr key={goal.id} data-editing={editingId === goal.id || undefined}>
                        <td>
                          <div className="list-editor-item-title">{goal.title}</div>
                          <div className="list-editor-item-detail">{goal.description}</div>
                        </td>
                        <td>{goal.category}</td>
                        <td>{goal.semester.name}</td>
                        <td>{formatDateRange(goal.semester.from, goal.semester.to)}</td>
                        <td>
                          <div className="sf-row-actions">
                            <Button color="secondary" size="xs" onClick={() => startEdit(goal)}>
                              Edit<span className="sf-sr-only"> {goal.title}</span>
                            </Button>
                            <Button
                              color="secondary-destructive"
                              size="xs"
                              onClick={() => remove(goal.id)}
                            >
                              Delete<span className="sf-sr-only"> {goal.title}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {formDrawer}
        </div>
      ) : null}

      {/* Named rather than an else branch: with a third tab beside them, "not
          Goals" is no longer the same thing as "Goal History". */}
      {tab === "Goal History" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Goal history</h2>
            <span className="sf-panel-note">{history.length} past</span>
          </div>

          {history.length === 0 ? (
            <EmptyState
              title="No goal history yet"
              message="Goals for this grade move here once their semester's end date has passed."
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    <th scope="col">Goal</th>
                    <th scope="col">Category</th>
                    <th scope="col">Semester</th>
                    <th scope="col">Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((goal) => (
                    <tr key={goal.id}>
                      <td>
                        <div className="list-editor-item-title">{goal.title}</div>
                        <div className="list-editor-item-detail">{goal.description}</div>
                      </td>
                      <td>{goal.category}</td>
                      <td>{goal.semester.name}</td>
                      <td>{formatDateRange(goal.semester.from, goal.semester.to)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
