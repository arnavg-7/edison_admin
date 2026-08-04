"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  goalCategories,
  goalTemplates,
  gradeGoalsFor,
  isPastSemester,
  type GradeGoal
} from "@/lib/data/academicGoals";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
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
  title: string;
  description: string;
  category: string;
  semesterName: string;
  semesterFrom: string;
  semesterTo: string;
};

function emptyDraft(): Draft {
  return {
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
 * Tabs are local rather than routed, mirroring Skills & Development's
 * identical drill-down (`GradeScopeEditor`): the two panels are the same
 * grade's goals viewed two ways, so keeping them on one URL means the
 * school/grade drilled into stays in the address bar.
 */
const TABS = ["Goals", "Goal History"] as const;

export function GradeGoalsEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const [goals, setGoals] = useState<GradeGoal[]>(() => gradeGoalsFor(schoolId, grade));
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

  useEffect(() => {
    setGoals(gradeGoalsFor(schoolId, grade));
  }, [schoolId, grade]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const startAdd = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (goal: GradeGoal) => {
    setDraft({
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

  const canSave =
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

    const goal: GradeGoal = {
      id: editingId ?? nextId(`${schoolId}-${grade}`),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      semester: {
        name: draft.semesterName.trim(),
        from: draft.semesterFrom,
        to: draft.semesterTo
      }
    };

    setGoals((current) =>
      editingId ? current.map((item) => (item.id === editingId ? goal : item)) : [...current, goal]
    );
    cancel();
  };

  const remove = (id: string) => {
    setGoals((current) => current.filter((item) => item.id !== id));
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
              ? "Update this goal's details, category or semester."
              : "Name the goal, tag a category, and assign it to a semester."}
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
      ) : (
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
      )}
    </>
  );
}
