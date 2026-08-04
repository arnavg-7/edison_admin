"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import {
  GRADE_OPTIONS,
  subjectGradeLabel,
  subjectStatus,
  subjects as seededSubjects,
  type Subject
} from "@/lib/data/systemSettings";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { Button } from "@/components/base/buttons/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

/** Empty string, not null, so the Combobox has a defined value either way —
    it's coerced back to null on save. */
const UNMAPPED = "";

const GRADE_SELECT_OPTIONS: ComboboxOption[] = [
  { value: UNMAPPED, label: "Unmapped" },
  ...GRADE_OPTIONS.map((grade) => ({ value: grade, label: `Grade ${grade}` }))
];

type Draft = {
  name: string;
  description: string;
  gradeStart: string;
  gradeEnd: string;
};

function emptyDraft(): Draft {
  return { name: "", description: "", gradeStart: UNMAPPED, gradeEnd: UNMAPPED };
}

function draftFromSubject(subject: Subject): Draft {
  return {
    name: subject.name,
    description: subject.description,
    gradeStart: subject.gradeStart ?? UNMAPPED,
    gradeEnd: subject.gradeEnd ?? UNMAPPED
  };
}

let seq = 0;
const nextId = () => `sub-local-${Date.now()}-${seq++}`;

/**
 * Subjects, with the drawer matched one-to-one to what the card shows —
 * same reasoning as Grade Levels: the generic ListEditor this replaced only
 * offered Name and Description, so the grade band and course count on every
 * card had no input and could only ever be the seed data. Course count stays
 * read-only text in the drawer (it's counted from Genesis courses, not typed
 * in); grade start/end are the only two fields that decide Mapped/Unmapped.
 *
 * TODO: local state only — persist through the Admin DB system-settings
 * contract when it exists.
 */
export function SubjectsEditor() {
  const [items, setItems] = useState<Subject[]>(seededSubjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  /** Snapshot taken the moment the drawer opens, so closing it can tell an
      untouched draft from one with real edits to lose. */
  const initialDraft = useRef<Draft>(emptyDraft());

  const isFormOpen = isAdding || editingId !== null;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft.current);

  const startAdd = () => {
    const next = emptyDraft();
    setDraft(next);
    initialDraft.current = next;
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (subject: Subject) => {
    const next = draftFromSubject(subject);
    setDraft(next);
    initialDraft.current = next;
    setIsAdding(false);
    setEditingId(subject.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setConfirmDiscard(false);
  };

  /** Every close path (✕, Esc, backdrop, the footer's own Cancel) routes
      through here, so an edit in progress can't be lost to a stray click. */
  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      cancel();
    }
  };

  const canSave = draft.name.trim() !== "";

  const save = () => {
    if (!canSave) return;

    const subject: Subject = {
      id: editingId ?? nextId(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      gradeStart: draft.gradeStart === UNMAPPED ? null : draft.gradeStart,
      gradeEnd: draft.gradeEnd === UNMAPPED ? null : draft.gradeEnd,
      // Counted, not entered — an add starts at 0 (no courses exist for it
      // yet), an edit keeps whatever Genesis already counted.
      courseCount: editingId ? (items.find((item) => item.id === editingId)?.courseCount ?? 0) : 0
    };

    setItems((current) =>
      editingId ? current.map((item) => (item.id === editingId ? subject : item)) : [...current, subject]
    );
    cancel();
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) cancel();
  };

  const fields = (
    <div className="list-editor-form list-editor-form--drawer">
      <label className="sf-field">
        <span>Name</span>
        <input
          type="text"
          value={draft.name}
          placeholder="e.g. Mathematics"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          placeholder="What this subject covers"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      {/* Two halves of one setting, so they share a row — same pattern as
          Grade Levels' own start/end pair. Leaving both at "Unmapped" is a
          valid, deliberate choice, not a validation error: a subject with no
          courses mapped yet still needs to exist on this list. */}
      <div className="sf-field-row">
        <label className="sf-field">
          <span>Grade start</span>
          <Combobox
            options={GRADE_SELECT_OPTIONS}
            value={draft.gradeStart}
            onChange={(gradeStart) => setDraft({ ...draft, gradeStart })}
            placeholder="Unmapped"
          />
        </label>

        <label className="sf-field">
          <span>Grade end</span>
          <Combobox
            options={GRADE_SELECT_OPTIONS}
            value={draft.gradeEnd}
            onChange={(gradeEnd) => setDraft({ ...draft, gradeEnd })}
            placeholder="Unmapped"
          />
        </label>
      </div>

      <p className="sf-panel-note">
        {subjectGradeLabel({
          gradeStart: draft.gradeStart === UNMAPPED ? null : draft.gradeStart,
          gradeEnd: draft.gradeEnd === UNMAPPED ? null : draft.gradeEnd
        })}
      </p>

      {/* Counted, not entered — printed as plain text so it's clear there's
          no input for it. */}
      <p className="sf-panel-note">
        Course count:{" "}
        <strong>
          {editingId ? items.find((item) => item.id === editingId)?.courseCount ?? 0 : 0}
        </strong>
        . Always counted from Genesis course records, never typed in.
      </p>
    </div>
  );

  return (
    <>
      <div className="sf-panel-head">
        <h2>Subject management</h2>
        {items.length > 0 ? (
          <Button
            size="sm"
            onClick={startAdd}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
          >
            Add subject
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No subjects configured"
          message="Add a subject and map it to grade levels."
          action={
            <Button
              size="sm"
              onClick={startAdd}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add subject
            </Button>
          }
        />
      ) : (
        <div className="list-editor-items">
          {items.map((subject) => {
            const status = subjectStatus(subject);
            return (
              <div className="list-editor-item" key={subject.id}>
                <div className="list-editor-item-main">
                  <div className="list-editor-item-title">
                    {subject.name}
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </div>
                  <div className="list-editor-item-detail">{subjectGradeLabel(subject)}</div>
                  {subject.description ? (
                    <div className="list-editor-item-note">{subject.description}</div>
                  ) : null}
                  <div className="list-editor-item-meta">
                    {subject.courseCount} course{subject.courseCount === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="list-editor-item-actions">
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => startEdit(subject)}
                    iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
                  >
                    Edit
                  </Button>
                  <Button color="secondary-destructive" size="sm" onClick={() => remove(subject.id)}>
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
          if (!open) requestClose();
        }}
      >
        <SheetContent side="right" className="data-[side=right]:sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit subject" : "Add subject"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Update this subject's description or grade mapping."
                : "Name the subject, describe it, and map it to a grade band."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6">{fields}</div>

          <SheetFooter className="flex-row">
            <Button size="sm" onClick={save} isDisabled={!canSave}>
              {editingId ? "Save subject" : "Add subject"}
            </Button>
            <Button color="secondary" size="sm" onClick={requestClose}>
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You&rsquo;ve made changes to this subject that haven&rsquo;t been saved. Closing now
              discards them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={cancel}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
