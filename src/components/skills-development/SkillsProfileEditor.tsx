"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffSlashIcon
} from "@hugeicons/core-free-icons";
import {
  SKILL_LEVELS,
  skillsProfileFor,
  type SkillGroup,
  type SkillLevel
} from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
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

// TODO: local state only — persist through the Admin DB skills-and-development
// contract when it exists.

let seq = 0;
const nextId = (prefix: string) => `${prefix}-local-${Date.now()}-${seq++}`;

type SubSkillDraft = { label: string; level: SkillLevel; description: string };

const emptyDraft: SubSkillDraft = { label: "", level: "high", description: "" };

export function SkillsProfileEditor({ schoolId, grade }: { schoolId: string; grade: string }) {
  const [groups, setGroups] = useState<SkillGroup[]>(() => skillsProfileFor(schoolId, grade));

  // Each grade is its own dataset, so changing scope swaps the whole list out.
  useEffect(() => {
    setGroups(skillsProfileFor(schoolId, grade));
  }, [schoolId, grade]);

  const [addingGroup, setAddingGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [subDraftFor, setSubDraftFor] = useState<string | null>(null);
  const [editingSub, setEditingSub] = useState<{ groupId: string; subId: string } | null>(null);
  const [subDraft, setSubDraft] = useState<SubSkillDraft>(emptyDraft);

  /** Nothing configured and not already adding — the empty state owns the CTA. */
  const isEmpty = groups.length === 0 && !addingGroup;

  const startAddGroup = () => {
    setGroupTitle("");
    setEditingGroupId(null);
    setAddingGroup(true);
  };

  const saveNewGroup = () => {
    if (!groupTitle.trim()) return;
    setGroups((current) => [
      ...current,
      { id: nextId("group"), title: groupTitle.trim(), published: false, subSkills: [] }
    ]);
    setGroupTitle("");
    setAddingGroup(false);
  };

  const saveGroupTitle = (id: string) => {
    if (!groupTitle.trim()) return;
    setGroups((current) =>
      current.map((group) => (group.id === id ? { ...group, title: groupTitle.trim() } : group))
    );
    setEditingGroupId(null);
    setGroupTitle("");
  };

  const removeGroup = (id: string) =>
    setGroups((current) => current.filter((group) => group.id !== id));

  const togglePublished = (id: string) =>
    setGroups((current) =>
      current.map((group) =>
        group.id === id ? { ...group, published: !group.published } : group
      )
    );

  const addSubSkill = (groupId: string) => {
    if (!subDraft.label.trim()) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              subSkills: [
                ...group.subSkills,
                {
                  id: nextId("sub"),
                  label: subDraft.label.trim(),
                  level: subDraft.level,
                  description: subDraft.description.trim()
                }
              ]
            }
          : group
      )
    );
    setSubDraft(emptyDraft);
    setSubDraftFor(null);
  };

  const saveSubSkill = () => {
    if (!editingSub || !subDraft.label.trim()) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === editingSub.groupId
          ? {
              ...group,
              subSkills: group.subSkills.map((sub) =>
                sub.id === editingSub.subId
                  ? {
                      ...sub,
                      label: subDraft.label.trim(),
                      level: subDraft.level,
                      description: subDraft.description.trim()
                    }
                  : sub
              )
            }
          : group
      )
    );
    setEditingSub(null);
    setSubDraft(emptyDraft);
  };

  const removeSubSkill = (groupId: string, subId: string) =>
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, subSkills: group.subSkills.filter((sub) => sub.id !== subId) }
          : group
      )
    );

  const subSkillForm = (onSave: () => void, onCancel: () => void, saveLabel: string) => (
    <div className="subskill-form">
      <label className="sf-field">
        <span>Sub-skill name</span>
        <input
          type="text"
          autoFocus
          value={subDraft.label}
          placeholder="e.g. Perseverance"
          onChange={(event) => setSubDraft({ ...subDraft, label: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSave();
            if (event.key === "Escape") onCancel();
          }}
        />
      </label>

      <label className="sf-field">
        <span>Level</span>
        <Combobox
          options={SKILL_LEVELS}
          value={subDraft.level}
          onChange={(next) => setSubDraft({ ...subDraft, level: next as SkillLevel })}
          placeholder="Select a level"
        />
      </label>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={2}
          value={subDraft.description}
          placeholder="Shown when a student hovers the skill"
          onChange={(event) => setSubDraft({ ...subDraft, description: event.target.value })}
        />
      </label>

      <div className="list-editor-form-actions">
        <Button size="sm" onClick={onSave}>{saveLabel}</Button>
        <Button color="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const totalSubSkills = groups.reduce((sum, group) => sum + group.subSkills.length, 0);

  /**
   * Skill creation goes in a right-side drawer, matching both the areas tab and
   * the goals editor on the sibling Academic Goals grade screen. Inline, the form
   * pushed the whole card grid down the page.
   *
   * Renaming stays in place: it edits one field on one card, and the card is the
   * clearest place to see what you are renaming.
   */
  const closeGroupForm = () => {
    setAddingGroup(false);
    setGroupTitle("");
  };

  const groupDrawer = (
    <Sheet
      open={addingGroup}
      onOpenChange={(open) => {
        if (!open) closeGroupForm();
      }}
    >
      {/* Variant-prefixed width: SheetContent ships data-[side=right]:sm:max-w-sm,
          which tailwind-merge keeps alongside a plain sm:max-w-*, so the
          data-variant class would win and hold the drawer at 384px. */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add skill</SheetTitle>
          <SheetDescription>
            Name the skill, then add the sub-skills rated under it from its card.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="area-form area-form--drawer">
            <label className="sf-field">
              <span>Skill name</span>
              <input
                type="text"
                autoFocus
                value={groupTitle}
                placeholder="e.g. Resilience"
                onChange={(event) => setGroupTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveNewGroup();
                  if (event.key === "Escape") closeGroupForm();
                }}
              />
            </label>
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={saveNewGroup} isDisabled={!groupTitle.trim()}>
            Create skill
          </Button>
          <Button color="secondary" size="sm" onClick={closeGroupForm}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="sf-panel">
      {/* Counts and the action share the panel head, as every other panel in the
          app does. They used to sit on separate rows with the button alone in a
          right-aligned strip, leaving dead space between the heading and the
          cards it acts on. */}
      <div className="sf-panel-head">
        <h2>Skills profile</h2>
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {groups.length} skills · {totalSubSkills} sub-skills ·{" "}
            {groups.filter((group) => group.published).length} published
          </span>
          {/* While empty, the only call to action lives inside the empty state,
              so there aren't two "Add skill" buttons competing on one screen. */}
          {isEmpty ? null : (
            <Button
              size="sm"
              onClick={startAddGroup}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add skill
            </Button>
          )}
        </div>
      </div>

      <div className="skills-legend" aria-label="Skill levels">
        {SKILL_LEVELS.map((option) => (
          <span className={`skills-legend-item level-${option.value}`} key={option.value}>
            <span className="skill-dot" aria-hidden />
            {option.label}
          </span>
        ))}
      </div>

      {isEmpty ? (
        <EmptyState
          title="No skills configured yet"
          message="Add a skill such as Resilience, then add the sub-skills rated under it."
          action={<Button
            size="sm"
            onClick={startAddGroup}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
          >
            Add skill
          </Button>}
        />
      ) : (
        <div className="skill-group-grid">
          {groups.map((group) => (
            <article className="skill-group-card" key={group.id}>
              <div className="skill-group-head">
                {editingGroupId === group.id ? (
                  <div className="area-skill-editing">
                    <input
                      type="text"
                      className="setting-input area-skill-input"
                      autoFocus
                      value={groupTitle}
                      onChange={(event) => setGroupTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveGroupTitle(group.id);
                        if (event.key === "Escape") setEditingGroupId(null);
                      }}
                    />
                    <Button size="xs" onClick={() => saveGroupTitle(group.id)}>
                      Save
                    </Button>
                    <Button color="secondary" size="xs" onClick={() => setEditingGroupId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="skill-group-title">{group.title}</h3>
                    {!group.published ? <StatusBadge tone="neutral">Draft</StatusBadge> : null}
                  </>
                )}
              </div>

              <ul className="skill-pill-list">
                {group.subSkills.map((sub) =>
                  editingSub?.subId === sub.id ? (
                    <li key={sub.id}>
                      {subSkillForm(saveSubSkill, () => setEditingSub(null), "Save sub-skill")}
                    </li>
                  ) : (
                    <li className="skill-pill-row" key={sub.id}>
                      <span
                        className={`skill-pill level-${sub.level}`}
                        tabIndex={0}
                        aria-describedby={sub.description ? `tip-${sub.id}` : undefined}
                      >
                        <span className="skill-dot" aria-hidden />
                        <span className="skill-pill-label">{sub.label}</span>
                        {sub.description ? (
                          <span className="skill-tooltip" role="tooltip" id={`tip-${sub.id}`}>
                            <strong>{sub.label}</strong>
                            <em>{sub.description}</em>
                          </span>
                        ) : null}
                      </span>

                      {/* Icon buttons rather than text links — inside a coloured
                          level pill, two extra words competed with the sub-skill
                          name for the same small space. */}
                      <span className="skill-pill-actions">
                        <button
                          type="button"
                          className="sf-icon-btn"
                          title={`Edit ${sub.label}`}
                          onClick={() => {
                            setSubDraft({
                              label: sub.label,
                              level: sub.level,
                              description: sub.description
                            });
                            setSubDraftFor(null);
                            setEditingSub({ groupId: group.id, subId: sub.id });
                          }}
                        >
                          <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={2} />
                          <span className="sf-sr-only">Edit {sub.label}</span>
                        </button>
                        <button
                          type="button"
                          className="sf-icon-btn sf-icon-btn--danger"
                          title={`Remove ${sub.label}`}
                          onClick={() => removeSubSkill(group.id, sub.id)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          <span className="sf-sr-only">Remove {sub.label}</span>
                        </button>
                      </span>
                    </li>
                  )
                )}

                {group.subSkills.length === 0 && subDraftFor !== group.id ? (
                  <li className="area-skill-empty">No sub-skills yet</li>
                ) : null}
              </ul>

              {subDraftFor === group.id
                ? subSkillForm(
                    () => addSubSkill(group.id),
                    () => setSubDraftFor(null),
                    "Add sub-skill"
                  )
                : (
                  <button
                    type="button"
                    className="sf-link-btn area-add-skill"
                    onClick={() => {
                      setSubDraft(emptyDraft);
                      setEditingSub(null);
                      setSubDraftFor(group.id);
                    }}
                  >
                    + Add sub-skill<span className="sf-sr-only"> to {group.title}</span>
                  </button>
                )}

              {/* The app's shared action button, as used by every table row: the
                  old .sf-btn--sm rendered 30px tall at 12px, a different button
                  family from the rest of the product. */}
              {/* Same icon vocabulary as the areas tab and the User Management
                  rows: eye pair for what students can see, pencil for edit,
                  trash for delete. */}
              <div className="area-card-actions">
                <Button
                  color="secondary"
                  size="xs"
                  onClick={() => togglePublished(group.id)}
                  iconLeading={
                    <HugeiconsIcon
                      icon={group.published ? ViewOffSlashIcon : ViewIcon}
                      size={16}
                      strokeWidth={2}
                    />
                  }
                >
                  {group.published ? "Unpublish" : "Publish"}
                  <span className="sf-sr-only"> skill {group.title}</span>
                </Button>
                <Button
                  color="secondary"
                  size="xs"
                  onClick={() => {
                    setGroupTitle(group.title);
                    setAddingGroup(false);
                    setEditingGroupId(group.id);
                  }}
                  iconLeading={
                    <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />
                  }
                >
                  Rename<span className="sf-sr-only"> skill {group.title}</span>
                </Button>
                <Button
                  color="secondary-destructive"
                  size="xs"
                  onClick={() => removeGroup(group.id)}
                  iconLeading={<HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />}
                >
                  Delete<span className="sf-sr-only"> skill {group.title}</span>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {groupDrawer}
    </div>
  );
}
