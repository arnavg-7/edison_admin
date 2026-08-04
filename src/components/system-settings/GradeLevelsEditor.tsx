"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { schools } from "@/lib/data/schools";
import {
  GRADE_OPTIONS,
  gradeLevelRollup,
  gradeLevelSchoolNames,
  gradeLevelTitle,
  gradeLevels as seededGradeLevels,
  type GradeLevel
} from "@/lib/data/systemSettings";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { Button } from "@/components/base/buttons/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

const GRADE_SELECT_OPTIONS: ComboboxOption[] = GRADE_OPTIONS.map((grade) => ({
  value: grade,
  label: `Grade ${grade}`
}));

type Draft = {
  gradeStart: string;
  gradeEnd: string;
  schoolIds: string[];
  active: boolean;
  description: string;
};

function emptyDraft(): Draft {
  return {
    gradeStart: GRADE_OPTIONS[0] ?? "",
    gradeEnd: GRADE_OPTIONS[0] ?? "",
    schoolIds: [],
    active: true,
    description: ""
  };
}

let seq = 0;
const nextId = () => `gl-local-${Date.now()}-${seq++}`;

function rollupLabel(schoolIds: string[]): string {
  const { schools: schoolCount, students } = gradeLevelRollup(schoolIds);
  return `${schoolCount} school${schoolCount === 1 ? "" : "s"} · ${students.toLocaleString()} students`;
}

/**
 * Grade levels, with the form matched one-to-one to what the card shows.
 *
 * The generic ListEditor this replaced offered a Name and a Description and
 * nothing else, so three of the card's four visible facts — the grade band, the
 * assigned schools, the active badge — had no input at all and could only ever
 * be whatever the seed data said. Each now has a control, and the one figure
 * that is genuinely derived (schools/students) is printed in the drawer as
 * read-only text so it is obvious it isn't editable.
 *
 * TODO: local state only — persist through the Admin DB system-settings
 * contract when it exists.
 */
export function GradeLevelsEditor() {
  const [levels, setLevels] = useState<GradeLevel[]>(seededGradeLevels);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const isFormOpen = isAdding || editingId !== null;

  const startAdd = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (level: GradeLevel) => {
    setDraft({
      gradeStart: level.gradeStart,
      gradeEnd: level.gradeEnd,
      schoolIds: level.schoolIds,
      active: level.active,
      description: level.description
    });
    setIsAdding(false);
    setEditingId(level.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const toggleSchool = (schoolId: string) => {
    setDraft((current) => ({
      ...current,
      schoolIds: current.schoolIds.includes(schoolId)
        ? current.schoolIds.filter((id) => id !== schoolId)
        : [...current.schoolIds, schoolId]
    }));
  };

  /** A band can't end before it starts, and a level with no school describes nothing. */
  const rangeValid = Number(draft.gradeStart) <= Number(draft.gradeEnd);
  const canSave = rangeValid && draft.schoolIds.length > 0;

  const save = () => {
    if (!canSave) return;

    const level: GradeLevel = {
      id: editingId ?? nextId(),
      gradeStart: draft.gradeStart,
      gradeEnd: draft.gradeEnd,
      schoolIds: draft.schoolIds,
      active: draft.active,
      description: draft.description.trim()
    };

    setLevels((current) =>
      editingId ? current.map((item) => (item.id === editingId ? level : item)) : [...current, level]
    );
    cancel();
  };

  const remove = (id: string) => {
    setLevels((current) => current.filter((item) => item.id !== id));
    if (editingId === id) cancel();
  };

  const fields = (
    <div className="list-editor-form list-editor-form--drawer">
      {/* Two halves of one setting, so they share a row rather than stacking as
          unrelated fields. */}
      <div className="sf-field-row">
        <label className="sf-field">
          <span>Grade start</span>
          <Combobox
            options={GRADE_SELECT_OPTIONS}
            value={draft.gradeStart}
            onChange={(gradeStart) => setDraft({ ...draft, gradeStart })}
            placeholder="Youngest grade"
          />
        </label>

        <label className="sf-field">
          <span>Grade end</span>
          <Combobox
            options={GRADE_SELECT_OPTIONS}
            value={draft.gradeEnd}
            onChange={(gradeEnd) => setDraft({ ...draft, gradeEnd })}
            placeholder="Oldest grade"
          />
        </label>
      </div>

      <p className="sf-panel-note">
        Card title: <strong>{gradeLevelTitle(draft)}</strong>
        {rangeValid ? null : (
          <span className="sf-field-error"> Grade end can&rsquo;t be before grade start.</span>
        )}
      </p>

      {/* Checkboxes, not a multi-select widget: the district has five schools, so
          the whole list fits on screen and every option stays visible while
          picking — the same reason Roles is a checkbox group. */}
      <fieldset className="sf-checkbox-group">
        <legend>Schools</legend>
        {schools.map((school) => (
          <label className="sf-checkbox-option" key={school.id}>
            <input
              type="checkbox"
              checked={draft.schoolIds.includes(school.id)}
              onChange={() => toggleSchool(school.id)}
            />
            <span>{school.name}</span>
          </label>
        ))}
        {draft.schoolIds.length === 0 ? (
          <p className="sf-field-error">Assign at least one school.</p>
        ) : null}
      </fieldset>

      {/* Counted, not entered — printed here so it's clear why there's no input
          for it, and so the effect of the school picks above is immediate. */}
      <p className="sf-panel-note">
        Enrollment rollup: <strong>{rollupLabel(draft.schoolIds)}</strong>. Always counted from the
        schools assigned above, never typed in.
      </p>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          placeholder="What this band is for, e.g. reporting cadence or staffing model"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      <label className="sf-switch-field">
        <span>
          <strong>{draft.active ? "Active" : "Inactive"}</strong>
          <span className="sf-panel-note">
            {draft.active
              ? "In use — subjects and goals can be mapped to this band."
              : "Kept for history; nothing new can be mapped to it."}
          </span>
        </span>
        <Switch
          checked={draft.active}
          onCheckedChange={(active) => setDraft({ ...draft, active })}
        />
      </label>
    </div>
  );

  return (
    <>
      <div className="sf-panel-head">
        <h2>Grade levels</h2>
        {levels.length > 0 ? (
          <Button
            size="sm"
            onClick={startAdd}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
          >
            Add grade level
          </Button>
        ) : null}
      </div>

      {levels.length === 0 ? (
        <EmptyState
          title="No grade levels configured"
          message="Add a grade level to map schools and subjects against it."
          action={
            <Button
              size="sm"
              onClick={startAdd}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add grade level
            </Button>
          }
        />
      ) : (
        <div className="list-editor-items">
          {levels.map((level) => {
            const schoolNames = gradeLevelSchoolNames(level.schoolIds);

            return (
              <div className="list-editor-item" key={level.id}>
                <div className="list-editor-item-main">
                  <div className="list-editor-item-title">
                    {gradeLevelTitle(level)}
                    <StatusBadge tone={level.active ? "ok" : "neutral"}>
                      {level.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </div>

                  <div className="list-editor-item-detail">
                    {schoolNames.length > 0 ? schoolNames.join(", ") : "No schools assigned"}
                  </div>

                  {/* Description renders here rather than in a tooltip: a
                      hover-only line is invisible to touch and keyboard, and it
                      is the sentence that explains why the band exists. */}
                  {level.description ? (
                    <div className="list-editor-item-note">{level.description}</div>
                  ) : null}

                  <div className="list-editor-item-meta">{rollupLabel(level.schoolIds)}</div>
                </div>

                <div className="list-editor-item-actions">
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => startEdit(level)}
                    iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
                  >
                    Edit
                  </Button>
                  <Button color="secondary-destructive" size="sm" onClick={() => remove(level.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Sheet
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) cancel();
        }}
      >
        {/* Same width override as the goals drawer — see the note there. */}
        <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit grade level" : "Add grade level"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Change the grade band, the schools it covers, or whether it stays in use."
                : "Set the grade band, pick the schools it covers, and describe what it's for."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6">{fields}</div>

          <SheetFooter className="flex-row">
            <Button size="sm" onClick={save} isDisabled={!canSave}>
              {editingId ? "Save grade level" : "Add grade level"}
            </Button>
            <Button color="secondary" size="sm" onClick={cancel}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
