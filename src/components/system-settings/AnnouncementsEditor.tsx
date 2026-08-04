"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { schools } from "@/lib/data/schools";
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  GRADE_OPTIONS,
  announcementAudienceLabel,
  announcementStatus,
  announcements as seededAnnouncements,
  formatPlainDate,
  type Announcement,
  type AnnouncementAudience
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

const GRADE_TARGET_OPTIONS: ComboboxOption[] = GRADE_OPTIONS.map((grade) => ({
  value: grade,
  label: `Grade ${grade}`
}));

const SCHOOL_TARGET_OPTIONS: ComboboxOption[] = schools.map((school) => ({
  value: school.id,
  label: school.name
}));

type Draft = {
  name: string;
  description: string;
  audience: AnnouncementAudience;
  audienceTarget: string;
  startDate: string;
  expiryDate: string;
};

function emptyDraft(): Draft {
  return {
    name: "",
    description: "",
    audience: "all-users",
    audienceTarget: "",
    startDate: "",
    expiryDate: ""
  };
}

function draftFromAnnouncement(announcement: Announcement): Draft {
  return {
    name: announcement.name,
    description: announcement.description,
    audience: announcement.audience,
    audienceTarget: announcement.audienceTarget ?? "",
    startDate: announcement.startDate,
    expiryDate: announcement.expiryDate
  };
}

let seq = 0;
const nextId = () => `ann-local-${Date.now()}-${seq++}`;

/**
 * Announcements, with the drawer matched one-to-one to what the card shows —
 * same reasoning as Grade Levels and Subjects: audience, dates and status all
 * used to be a single free-text `meta` string with no input behind it. Status
 * is never set directly — it's always derived live from the two dates, the
 * same way Subjects derives Mapped/Unmapped from the grade band, so it can't
 * drift out of sync with what the card actually shows.
 *
 * TODO: local state only — persist through the Admin DB system-settings
 * contract when it exists.
 */
export function AnnouncementsEditor() {
  const [items, setItems] = useState<Announcement[]>(seededAnnouncements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [confirmDiscard, setConfirmDiscard] = useState(false);

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

  const startEdit = (announcement: Announcement) => {
    const next = draftFromAnnouncement(announcement);
    setDraft(next);
    initialDraft.current = next;
    setIsAdding(false);
    setEditingId(announcement.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setConfirmDiscard(false);
  };

  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      cancel();
    }
  };

  const needsTarget = draft.audience === "specific-grade" || draft.audience === "specific-school";
  const rangeValid = draft.startDate !== "" && draft.expiryDate !== "" && draft.startDate <= draft.expiryDate;
  const canSave =
    draft.name.trim() !== "" && rangeValid && (!needsTarget || draft.audienceTarget !== "");

  const save = () => {
    if (!canSave) return;

    const announcement: Announcement = {
      id: editingId ?? nextId(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      audience: draft.audience,
      audienceTarget: needsTarget ? draft.audienceTarget : null,
      startDate: draft.startDate,
      expiryDate: draft.expiryDate
    };

    setItems((current) =>
      editingId ? current.map((item) => (item.id === editingId ? announcement : item)) : [...current, announcement]
    );
    cancel();
  };

  const remove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) cancel();
  };

  const status = announcementStatus(draft);

  const fields = (
    <div className="list-editor-form list-editor-form--drawer">
      <label className="sf-field">
        <span>Name</span>
        <input
          type="text"
          value={draft.name}
          placeholder="e.g. Term 4 progress reports due"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={draft.description}
          placeholder="What this announcement tells its audience"
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </label>

      <label className="sf-field">
        <span>Audience</span>
        <Combobox
          options={ANNOUNCEMENT_AUDIENCE_OPTIONS}
          value={draft.audience}
          onChange={(audience) => setDraft({ ...draft, audience, audienceTarget: "" })}
        />
      </label>

      {/* Only shown for the two audiences that need a target — a plain
          "All Faculty" pick has nothing further to narrow. */}
      {draft.audience === "specific-grade" ? (
        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={GRADE_TARGET_OPTIONS}
            value={draft.audienceTarget}
            onChange={(audienceTarget) => setDraft({ ...draft, audienceTarget })}
            placeholder="Pick a grade"
          />
        </label>
      ) : null}

      {draft.audience === "specific-school" ? (
        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={SCHOOL_TARGET_OPTIONS}
            value={draft.audienceTarget}
            onChange={(audienceTarget) => setDraft({ ...draft, audienceTarget })}
            placeholder="Pick a school"
          />
        </label>
      ) : null}

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Start date</span>
          <input
            type="date"
            value={draft.startDate}
            onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
          />
        </label>

        <label className="sf-field">
          <span>Expiry date</span>
          <input
            type="date"
            value={draft.expiryDate}
            onChange={(event) => setDraft({ ...draft, expiryDate: event.target.value })}
          />
        </label>
      </div>

      {!rangeValid && draft.startDate !== "" && draft.expiryDate !== "" ? (
        <p className="sf-field-error">Expiry date can&rsquo;t be before the start date.</p>
      ) : null}

      {/* Never set directly — always read back from the two dates above, so
          it can't say "Active" while the dates say otherwise. */}
      <p className="sf-panel-note">
        Status: <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </p>
    </div>
  );

  return (
    <>
      <div className="sf-panel-head">
        <h2>Announcements</h2>
        {items.length > 0 ? (
          <Button
            size="sm"
            onClick={startAdd}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
          >
            Add announcement
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No announcements"
          message="Add an announcement to surface it in the portals."
          action={
            <Button
              size="sm"
              onClick={startAdd}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add announcement
            </Button>
          }
        />
      ) : (
        <div className="list-editor-items">
          {items.map((announcement) => {
            const itemStatus = announcementStatus(announcement);
            return (
              <div className="list-editor-item" key={announcement.id}>
                <div className="list-editor-item-main">
                  <div className="list-editor-item-title">
                    {announcement.name}
                    <StatusBadge tone={itemStatus.tone}>{itemStatus.label}</StatusBadge>
                  </div>
                  <div className="list-editor-item-detail">{announcementAudienceLabel(announcement)}</div>
                  {announcement.description ? (
                    <div className="list-editor-item-note">{announcement.description}</div>
                  ) : null}
                  <div className="list-editor-item-meta">
                    {formatPlainDate(announcement.startDate)} – {formatPlainDate(announcement.expiryDate)}
                  </div>
                </div>

                <div className="list-editor-item-actions">
                  <Button
                    color="secondary"
                    size="sm"
                    onClick={() => startEdit(announcement)}
                    iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
                  >
                    Edit
                  </Button>
                  <Button color="secondary-destructive" size="sm" onClick={() => remove(announcement.id)}>
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
            <SheetTitle>{editingId ? "Edit announcement" : "Add announcement"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Change who sees this announcement and when."
                : "Name it, describe it, and choose who sees it and when."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6">{fields}</div>

          <SheetFooter className="flex-row">
            <Button size="sm" onClick={save} isDisabled={!canSave}>
              {editingId ? "Save announcement" : "Add announcement"}
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
              You&rsquo;ve made changes to this announcement that haven&rsquo;t been saved. Closing now
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
