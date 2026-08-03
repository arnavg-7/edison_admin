"use client";

import { useEffect, useState } from "react";
import {
  goalCategories,
  goalTemplates,
  gradeGoalsFor,
  isPastSemester,
  type GradeGoal
} from "@/lib/data/academicGoals";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";

// TODO: local state only — persist through the Admin DB Academic Goals
// contract when it exists.

type ComboOption = { value: string; label: string };

const isOptionEqual = (a: ComboOption, b: ComboOption) => a.value === b.value;

const categoryOptions: ComboOption[] = goalCategories.map((category) => ({
  value: category.title,
  label: category.title
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
 * the read-only goal history below.
 */
export function GradeGoalsEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const [goals, setGoals] = useState<GradeGoal[]>(() => gradeGoalsFor(schoolId, grade));

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

  const form = (
    <div className="list-editor-form">
      <label className="sf-field">
        <span>Goal name</span>
        <input
          type="text"
          list="goal-template-options"
          autoFocus
          value={draft.title}
          placeholder="e.g. Attendance improvement plan"
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
        <datalist id="goal-template-options">
          {goalTemplates.map((template) => (
            <option key={template.id} value={template.title} />
          ))}
        </datalist>
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
          items={categoryOptions}
          value={categoryOptions.find((option) => option.value === draft.category) ?? null}
          onValueChange={(option) => setDraft({ ...draft, category: option?.value ?? draft.category })}
          isItemEqualToValue={isOptionEqual}
        >
          <ComboboxInput placeholder="Select a category" />
          <ComboboxContent>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxList>
              {(option: ComboOption) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
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

      <div className="list-editor-form-actions">
        <Button onClick={save} disabled={!canSave}>
          {editingId ? "Save goal" : "Submit goal"}
        </Button>
        <button type="button" className="sf-btn" onClick={cancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Current goals</h2>
          <span className="sf-panel-note">{current.length} active</span>
        </div>

        <div className="list-editor-head">
          <Button onClick={startAdd}>Set a goal</Button>
        </div>

        {isAdding ? form : null}

        {current.length === 0 && !isAdding ? (
          <EmptyState
            title="No current goals"
            message="Set a goal for this grade's semester to get started."
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
                {current.map((goal) =>
                  editingId === goal.id ? (
                    <tr key={goal.id}>
                      <td colSpan={5}>{form}</td>
                    </tr>
                  ) : (
                    <tr key={goal.id}>
                      <td>
                        <div className="list-editor-item-title">{goal.title}</div>
                        <div className="list-editor-item-detail">{goal.description}</div>
                      </td>
                      <td>{goal.category}</td>
                      <td>{goal.semester.name}</td>
                      <td>{formatDateRange(goal.semester.from, goal.semester.to)}</td>
                      <td>
                        <button
                          type="button"
                          className="sf-btn sf-btn--sm"
                          onClick={() => startEdit(goal)}
                        >
                          Edit<span className="sf-sr-only"> {goal.title}</span>
                        </button>
                        <button
                          type="button"
                          className="sf-btn sf-btn--sm sf-btn--danger"
                          onClick={() => remove(goal.id)}
                        >
                          Delete<span className="sf-sr-only"> {goal.title}</span>
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
    </>
  );
}
