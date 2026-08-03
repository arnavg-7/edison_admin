"use client";

import { useEffect, useState } from "react";
import {
  DEV_AREA_ICONS,
  DEV_AREA_TONES,
  developmentAreasFor,
  type DevAreaIcon as IconName,
  type DevAreaTone,
  type DevelopmentArea
} from "@/lib/data/skillsDevelopment";
import { DevAreaIcon } from "./DevAreaIcon";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

// TODO: local state only — persist through the Admin DB skills-and-development
// contract when it exists.

let seq = 0;
const nextId = (prefix: string) => `${prefix}-local-${Date.now()}-${seq++}`;

export function DevelopmentAreasEditor({
  schoolId,
  grade
}: {
  schoolId: string;
  grade: string;
}) {
  const [areas, setAreas] = useState<DevelopmentArea[]>(() =>
    developmentAreasFor(schoolId, grade)
  );

  // Each grade is its own dataset, so changing scope swaps the whole list out.
  useEffect(() => {
    setAreas(developmentAreasFor(schoolId, grade));
  }, [schoolId, grade]);

  const [addingArea, setAddingArea] = useState(false);
  const [areaDraft, setAreaDraft] = useState<{
    title: string;
    tone: DevAreaTone;
    icon: IconName;
  }>({ title: "", tone: "blue", icon: "check" });

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [skillDraftFor, setSkillDraftFor] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState("");
  const [editingSkill, setEditingSkill] = useState<{ areaId: string; skillId: string } | null>(null);

  const resetAreaDraft = () => setAreaDraft({ title: "", tone: "blue", icon: "check" });

  const saveNewArea = () => {
    if (!areaDraft.title.trim()) return;
    setAreas((current) => [
      ...current,
      {
        id: nextId("area"),
        title: areaDraft.title.trim(),
        tone: areaDraft.tone,
        icon: areaDraft.icon,
        published: false,
        skills: []
      }
    ]);
    resetAreaDraft();
    setAddingArea(false);
  };

  const saveAreaEdit = (id: string) => {
    if (!areaDraft.title.trim()) return;
    setAreas((current) =>
      current.map((area) =>
        area.id === id
          ? { ...area, title: areaDraft.title.trim(), tone: areaDraft.tone, icon: areaDraft.icon }
          : area
      )
    );
    setEditingAreaId(null);
    resetAreaDraft();
  };

  const startAreaEdit = (area: DevelopmentArea) => {
    setAreaDraft({ title: area.title, tone: area.tone, icon: area.icon });
    setAddingArea(false);
    setEditingAreaId(area.id);
  };

  const removeArea = (id: string) => {
    setAreas((current) => current.filter((area) => area.id !== id));
  };

  const togglePublished = (id: string) => {
    setAreas((current) =>
      current.map((area) => (area.id === id ? { ...area, published: !area.published } : area))
    );
  };

  const addSkill = (areaId: string) => {
    if (!skillDraft.trim()) return;
    setAreas((current) =>
      current.map((area) =>
        area.id === areaId
          ? { ...area, skills: [...area.skills, { id: nextId("skill"), label: skillDraft.trim() }] }
          : area
      )
    );
    setSkillDraft("");
    setSkillDraftFor(null);
  };

  const saveSkillEdit = () => {
    if (!editingSkill || !skillDraft.trim()) return;
    setAreas((current) =>
      current.map((area) =>
        area.id === editingSkill.areaId
          ? {
              ...area,
              skills: area.skills.map((skill) =>
                skill.id === editingSkill.skillId ? { ...skill, label: skillDraft.trim() } : skill
              )
            }
          : area
      )
    );
    setEditingSkill(null);
    setSkillDraft("");
  };

  const removeSkill = (areaId: string, skillId: string) => {
    setAreas((current) =>
      current.map((area) =>
        area.id === areaId
          ? { ...area, skills: area.skills.filter((skill) => skill.id !== skillId) }
          : area
      )
    );
  };

  const areaForm = (onSave: () => void, onCancel: () => void, saveLabel: string) => (
    <div className="area-form">
      <label className="sf-field">
        <span>Area name</span>
        <input
          type="text"
          autoFocus
          value={areaDraft.title}
          placeholder="e.g. Strengths"
          onChange={(event) => setAreaDraft({ ...areaDraft, title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") onSave();
            if (event.key === "Escape") onCancel();
          }}
        />
      </label>

      <fieldset className="tone-picker">
        <legend>Colour</legend>
        <div className="tone-options">
          {DEV_AREA_TONES.map((tone) => (
            <label key={tone.value} className="tone-option">
              <input
                type="radio"
                name="area-tone"
                value={tone.value}
                checked={areaDraft.tone === tone.value}
                onChange={() => setAreaDraft({ ...areaDraft, tone: tone.value })}
              />
              <span className={`tone-swatch tone-${tone.value}`} aria-hidden />
              <span className="tone-name">{tone.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="sf-field">
        <span>Icon</span>
        <select
          className="sf-input"
          value={areaDraft.icon}
          onChange={(event) => setAreaDraft({ ...areaDraft, icon: event.target.value as IconName })}
        >
          {DEV_AREA_ICONS.map((icon) => (
            <option key={icon.value} value={icon.value}>
              {icon.label}
            </option>
          ))}
        </select>
      </label>

      <div className="list-editor-form-actions">
        <button type="button" className="sf-btn sf-btn--primary" onClick={onSave}>
          {saveLabel}
        </button>
        <button type="button" className="sf-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );

  const totalSkills = areas.reduce((sum, area) => sum + area.skills.length, 0);

  return (
    <div className="sf-panel">
      <div className="sf-panel-head">
        <h2>Development areas</h2>
        <span className="sf-panel-note">
          {areas.length} areas · {totalSkills} skills ·{" "}
          {areas.filter((area) => area.published).length} published
        </span>
      </div>

      <div className="list-editor-head">
        <button
          type="button"
          className="sf-btn sf-btn--primary"
          onClick={() => {
            resetAreaDraft();
            setEditingAreaId(null);
            setAddingArea(true);
          }}
        >
          Add area
        </button>
      </div>

      {addingArea
        ? areaForm(saveNewArea, () => setAddingArea(false), "Create area")
        : null}

      {areas.length === 0 && !addingArea ? (
        <EmptyState
          title="No development areas yet"
          message="Add an area such as Strengths, then list the skills that belong under it."
        />
      ) : (
        <div className="area-grid">
          {areas.map((area) =>
            editingAreaId === area.id ? (
              <div key={area.id}>
                {areaForm(() => saveAreaEdit(area.id), () => setEditingAreaId(null), "Save area")}
              </div>
            ) : (
              <article className={`area-card tone-${area.tone}`} key={area.id}>
                <div className="area-card-top">
                  <span className={`area-icon tone-${area.tone}`} aria-hidden>
                    <DevAreaIcon name={area.icon} />
                  </span>
                  {!area.published ? <StatusBadge tone="neutral">Draft</StatusBadge> : null}
                </div>

                <h3 className={`area-title tone-${area.tone}`}>{area.title}</h3>

                <ul className="area-skills">
                  {area.skills.map((skill) =>
                    editingSkill?.skillId === skill.id ? (
                      <li key={skill.id} className="area-skill-editing">
                        <input
                          type="text"
                          className="setting-input area-skill-input"
                          autoFocus
                          value={skillDraft}
                          onChange={(event) => setSkillDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") saveSkillEdit();
                            if (event.key === "Escape") setEditingSkill(null);
                          }}
                        />
                        <button type="button" className="sf-btn sf-btn--sm sf-btn--primary" onClick={saveSkillEdit}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="sf-btn sf-btn--sm"
                          onClick={() => setEditingSkill(null)}
                        >
                          Cancel
                        </button>
                      </li>
                    ) : (
                      <li key={skill.id} className="area-skill">
                        <span className="area-skill-label">{skill.label}</span>
                        <span className="area-skill-actions">
                          <button
                            type="button"
                            className="sf-link-btn"
                            onClick={() => {
                              setSkillDraft(skill.label);
                              setEditingSkill({ areaId: area.id, skillId: skill.id });
                            }}
                          >
                            Edit<span className="sf-sr-only"> {skill.label}</span>
                          </button>
                          <button
                            type="button"
                            className="sf-link-btn sf-link-btn--danger"
                            onClick={() => removeSkill(area.id, skill.id)}
                          >
                            Remove<span className="sf-sr-only"> {skill.label}</span>
                          </button>
                        </span>
                      </li>
                    )
                  )}

                  {area.skills.length === 0 && skillDraftFor !== area.id ? (
                    <li className="area-skill-empty">No skills yet</li>
                  ) : null}
                </ul>

                {skillDraftFor === area.id ? (
                  <div className="area-skill-editing">
                    <input
                      type="text"
                      className="setting-input area-skill-input"
                      autoFocus
                      placeholder="e.g. Analytical Thinker"
                      value={skillDraft}
                      onChange={(event) => setSkillDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addSkill(area.id);
                        if (event.key === "Escape") setSkillDraftFor(null);
                      }}
                    />
                    <button
                      type="button"
                      className="sf-btn sf-btn--sm sf-btn--primary"
                      onClick={() => addSkill(area.id)}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="sf-btn sf-btn--sm"
                      onClick={() => setSkillDraftFor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="link-btn area-add-skill"
                    onClick={() => {
                      setSkillDraft("");
                      setEditingSkill(null);
                      setSkillDraftFor(area.id);
                    }}
                  >
                    + Add skill<span className="sf-sr-only"> to {area.title}</span>
                  </button>
                )}

                <div className="area-card-actions">
                  <button
                    type="button"
                    className="sf-btn sf-btn--sm"
                    onClick={() => togglePublished(area.id)}
                  >
                    {area.published ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className="sf-btn sf-btn--sm" onClick={() => startAreaEdit(area)}>
                    Edit<span className="sf-sr-only"> area {area.title}</span>
                  </button>
                  <button
                    type="button"
                    className="sf-btn sf-btn--sm sf-btn--danger"
                    onClick={() => removeArea(area.id)}
                  >
                    Delete<span className="sf-sr-only"> area {area.title}</span>
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </div>
  );
}
