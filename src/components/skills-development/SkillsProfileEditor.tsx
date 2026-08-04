"use client";

import { useEffect, useState } from "react";
import {
  SKILL_LEVELS,
  skillsProfileFor,
  type SkillGroup,
  type SkillLevel
} from "@/lib/data/skillsDevelopment";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/shared/Combobox";

const isLevelOptionEqual = (a: (typeof SKILL_LEVELS)[number], b: (typeof SKILL_LEVELS)[number]) =>
  a.value === b.value;

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
        <Button onClick={onSave}>{saveLabel}</Button>
        <button type="button" className="sf-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  const totalSubSkills = groups.reduce((sum, group) => sum + group.subSkills.length, 0);

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Skills profile</h2>
        <span className="sf-panel-note">
          {groups.length} skills · {totalSubSkills} sub-skills ·{" "}
          {groups.filter((group) => group.published).length} published
        </span>
      </div>

      <div className="skills-legend" aria-label="Skill levels">
        {SKILL_LEVELS.map((option) => (
          <span className={`skills-legend-item level-${option.value}`} key={option.value}>
            <span className="skill-dot" aria-hidden />
            {option.label}
          </span>
        ))}
      </div>

      {/* While empty, the only call to action lives inside the empty state, so
          there aren't two "Add skill" buttons competing on one screen. */}
      {isEmpty ? null : (
        <div className="list-editor-head">
          <Button onClick={startAddGroup}>Add skill</Button>
        </div>
      )}

      {addingGroup ? (
        <div className="area-form">
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
                if (event.key === "Escape") setAddingGroup(false);
              }}
            />
          </label>
          <div className="list-editor-form-actions">
            <Button onClick={saveNewGroup}>Create skill</Button>
            <button type="button" className="sf-btn" onClick={() => setAddingGroup(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <EmptyState
          title="No skills configured yet"
          message="Add a skill such as Resilience, then add the sub-skills rated under it."
          action={<Button onClick={startAddGroup}>Add skill</Button>}
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
                    <Button size="sm" onClick={() => saveGroupTitle(group.id)}>
                      Save
                    </Button>
                    <button
                      type="button"
                      className="sf-btn sf-btn--sm"
                      onClick={() => setEditingGroupId(null)}
                    >
                      Cancel
                    </button>
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

                      <span className="skill-pill-actions">
                        <button
                          type="button"
                          className="sf-link-btn"
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
                          Edit<span className="sf-sr-only"> {sub.label}</span>
                        </button>
                        <button
                          type="button"
                          className="sf-link-btn sf-link-btn--danger"
                          onClick={() => removeSubSkill(group.id, sub.id)}
                        >
                          Remove<span className="sf-sr-only"> {sub.label}</span>
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

              <div className="area-card-actions">
                <button
                  type="button"
                  className="sf-btn sf-btn--sm"
                  onClick={() => togglePublished(group.id)}
                >
                  {group.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  className="sf-btn sf-btn--sm"
                  onClick={() => {
                    setGroupTitle(group.title);
                    setAddingGroup(false);
                    setEditingGroupId(group.id);
                  }}
                >
                  Rename<span className="sf-sr-only"> skill {group.title}</span>
                </button>
                <button
                  type="button"
                  className="sf-btn sf-btn--sm sf-btn--danger"
                  onClick={() => removeGroup(group.id)}
                >
                  Delete<span className="sf-sr-only"> skill {group.title}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
