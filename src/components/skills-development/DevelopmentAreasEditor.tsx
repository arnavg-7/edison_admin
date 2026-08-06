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
import { formatDateRangeOnly } from "@/lib/format";
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

type AreaDraft = {
  title: string;
  tone: DevAreaTone;
  icon: IconName;
  /** What the area is for, and the dates it runs. Optional on save. */
  periodName: string;
  periodFrom: string;
  periodTo: string;
};

const emptyAreaDraft: AreaDraft = {
  title: "",
  tone: "blue",
  icon: "check",
  periodName: "",
  periodFrom: "",
  periodTo: ""
};

/**
 * A period is all-or-nothing: a name with no dates, or dates with no name,
 * would show as a half-written label on the card.
 */
function draftPeriod(draft: AreaDraft) {
  if (!draft.periodName.trim() || !draft.periodFrom || !draft.periodTo) {
    return undefined;
  }
  return { name: draft.periodName.trim(), from: draft.periodFrom, to: draft.periodTo };
}

function periodError(draft: AreaDraft): string | null {
  const started = draft.periodName.trim() !== "" || draft.periodFrom !== "" || draft.periodTo !== "";
  if (!started) return null;
  if (!draft.periodName.trim()) return "Add a name for what this area is for.";
  if (!draft.periodFrom || !draft.periodTo) return "Add both a start and an end date.";
  if (draft.periodFrom > draft.periodTo) return "The end date falls before the start date.";
  return null;
}

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
  const [areaDraft, setAreaDraft] = useState<AreaDraft>(emptyAreaDraft);

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [skillDraftFor, setSkillDraftFor] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState("");
  const [editingSkill, setEditingSkill] = useState<{ areaId: string; skillId: string } | null>(null);

  const resetAreaDraft = () => setAreaDraft(emptyAreaDraft);

  /** Nothing configured and not already adding — the empty state owns the CTA. */
  const isEmpty = areas.length === 0 && !addingArea;

  const startAddArea = () => {
    resetAreaDraft();
    setEditingAreaId(null);
    setAddingArea(true);
  };

  const saveNewArea = () => {
    if (!areaDraft.title.trim() || periodError(areaDraft)) return;
    setAreas((current) => [
      ...current,
      {
        id: nextId("area"),
        title: areaDraft.title.trim(),
        tone: areaDraft.tone,
        icon: areaDraft.icon,
        published: false,
        period: draftPeriod(areaDraft),
        skills: []
      }
    ]);
    resetAreaDraft();
    setAddingArea(false);
  };

  const saveAreaEdit = (id: string) => {
    if (!areaDraft.title.trim() || periodError(areaDraft)) return;
    setAreas((current) =>
      current.map((area) =>
        area.id === id
          ? {
              ...area,
              title: areaDraft.title.trim(),
              tone: areaDraft.tone,
              icon: areaDraft.icon,
              period: draftPeriod(areaDraft)
            }
          : area
      )
    );
    setEditingAreaId(null);
    resetAreaDraft();
  };

  const startAreaEdit = (area: DevelopmentArea) => {
    setAreaDraft({
      title: area.title,
      tone: area.tone,
      icon: area.icon,
      periodName: area.period?.name ?? "",
      periodFrom: area.period?.from ?? "",
      periodTo: area.period?.to ?? ""
    });
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

  const areaFields = (onSave: () => void, onCancel: () => void) => (
    <div className="area-form area-form--drawer">
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
        <Combobox
          options={DEV_AREA_ICONS}
          value={areaDraft.icon}
          onChange={(next) => setAreaDraft({ ...areaDraft, icon: next as IconName })}
          placeholder="Select an icon"
        />
      </label>

      {/* What the area is for and how long it runs. Optional as a set: leave
          all three blank for an area that is not tied to a term yet. */}
      <label className="sf-field">
        <span>What this area is for (optional)</span>
        <input
          type="text"
          value={areaDraft.periodName}
          placeholder="e.g. Fall 2026"
          onChange={(event) => setAreaDraft({ ...areaDraft, periodName: event.target.value })}
        />
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Start date</span>
          <input
            type="date"
            value={areaDraft.periodFrom}
            onChange={(event) => setAreaDraft({ ...areaDraft, periodFrom: event.target.value })}
          />
        </label>

        <label className="sf-field">
          <span>End date</span>
          <input
            type="date"
            value={areaDraft.periodTo}
            onChange={(event) => setAreaDraft({ ...areaDraft, periodTo: event.target.value })}
          />
        </label>
      </div>

      {periodError(areaDraft) ? (
        <p className="sf-field-error">{periodError(areaDraft)}</p>
      ) : null}
    </div>
  );

  /**
   * Area create/edit lives in a right-side drawer, matching the goals editor on
   * the sibling Academic Goals grade screen. Inline, the same form pushed the
   * whole card grid down when adding, and on edit it replaced the card being
   * edited — so the thing you were changing disappeared while you changed it.
   */
  const isFormOpen = addingArea || editingAreaId !== null;
  const closeForm = () => {
    setAddingArea(false);
    setEditingAreaId(null);
    resetAreaDraft();
  };
  const submitForm = () => (editingAreaId ? saveAreaEdit(editingAreaId) : saveNewArea());

  const formDrawer = (
    <Sheet
      open={isFormOpen}
      onOpenChange={(open) => {
        if (!open) closeForm();
      }}
    >
      {/* Variant-prefixed width: SheetContent ships data-[side=right]:sm:max-w-sm,
          which tailwind-merge keeps alongside a plain sm:max-w-*, so the
          data-variant class would win and hold the drawer at 384px. */}
      <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editingAreaId ? "Edit area" : "Add development area"}</SheetTitle>
          <SheetDescription>
            {editingAreaId
              ? "Rename this area or change how it is marked in the student portal."
              : "Name the area, then pick the colour and icon students will see."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {areaFields(submitForm, closeForm)}
        </div>

        <SheetFooter className="flex-row">
          <Button
            size="sm"
            onClick={submitForm}
            isDisabled={!areaDraft.title.trim() || periodError(areaDraft) !== null}
          >
            {editingAreaId ? "Save area" : "Create area"}
          </Button>
          <Button color="secondary" size="sm" onClick={closeForm}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  const totalSkills = areas.reduce((sum, area) => sum + area.skills.length, 0);

  return (
    <div className="sf-panel">
      {/* Counts and the action share the panel head, the way every other panel
          in the app carries its action. They used to sit on separate rows, with
          the button alone in a right-aligned strip that left a band of dead
          space between the heading and the content it acts on. */}
      <div className="sf-panel-head">
        <h2>Development areas</h2>
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {areas.length} areas · {totalSkills} skills ·{" "}
            {areas.filter((area) => area.published).length} published
          </span>
          {/* While empty, the only call to action lives inside the empty state,
              so there aren't two "Add area" buttons competing on one screen. */}
          {isEmpty ? null : (
            <Button
              size="sm"
              onClick={startAddArea}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add area
            </Button>
          )}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          title="No development areas yet"
          message="Add an area such as Strengths, then list the skills that belong under it."
          action={<Button
            size="sm"
            onClick={startAddArea}
            iconLeading={<HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4 shrink-0" />}
          >
            Add area
          </Button>}
        />
      ) : (
        <div className="area-grid">
          {/* The card stays in place while its drawer is open, so the area being
              edited is still visible beside the fields changing it. */}
          {areas.map((area) => (
              <article className={`area-card tone-${area.tone}`} key={area.id}>
                <div className="area-card-top">
                  <span className={`area-icon tone-${area.tone}`} aria-hidden>
                    <DevAreaIcon name={area.icon} />
                  </span>
                  {!area.published ? <StatusBadge tone="neutral">Draft</StatusBadge> : null}
                </div>

                <h3 className={`area-title tone-${area.tone}`}>{area.title}</h3>

                {area.period ? (
                  <p className="area-period">
                    <span className="area-period-name">{area.period.name}</span>
                    <span className="area-period-dates">
                      {formatDateRangeOnly(area.period.from, area.period.to)}
                    </span>
                  </p>
                ) : null}

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
                        <Button size="xs" onClick={saveSkillEdit}>
                          Save
                        </Button>
                        <Button color="secondary" size="xs" onClick={() => setEditingSkill(null)}>
                          Cancel
                        </Button>
                      </li>
                    ) : (
                      <li key={skill.id} className="area-skill">
                        <span className="area-skill-label">{skill.label}</span>
                        {/* Icon buttons, not the two text links these were. At
                            13px beside a skill name they read as more label
                            competing with the label — on a longer name like
                            "Robotics Club" the pair crowded straight up against
                            it. The glyphs are the same pencil and trash the card
                            actions below use, and each keeps its accessible name
                            plus a title for hover. */}
                        <span className="area-skill-actions">
                          <button
                            type="button"
                            className="sf-icon-btn"
                            title={`Edit ${skill.label}`}
                            onClick={() => {
                              setSkillDraft(skill.label);
                              setEditingSkill({ areaId: area.id, skillId: skill.id });
                            }}
                          >
                            <HugeiconsIcon icon={PencilEdit02Icon} size={14} strokeWidth={2} />
                            <span className="sf-sr-only">Edit {skill.label}</span>
                          </button>
                          <button
                            type="button"
                            className="sf-icon-btn sf-icon-btn--danger"
                            title={`Remove ${skill.label}`}
                            onClick={() => removeSkill(area.id, skill.id)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                            <span className="sf-sr-only">Remove {skill.label}</span>
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
                    <Button size="xs" onClick={() => addSkill(area.id)}>
                      Add
                    </Button>
                    <Button color="secondary" size="xs" onClick={() => setSkillDraftFor(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sf-link-btn area-add-skill"
                    onClick={() => {
                      setSkillDraft("");
                      setEditingSkill(null);
                      setSkillDraftFor(area.id);
                    }}
                  >
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5 shrink-0" />
                    Add skill<span className="sf-sr-only"> to {area.title}</span>
                  </button>
                )}

                {/* The app's shared action button, as used by every table row:
                    the old .sf-btn--sm rendered 30px tall at 12px, a different
                    button family from the rest of the product. */}
                {/* Icons match the vocabulary already established elsewhere in
                    the app: pencil for edit and trash for delete, as on the User
                    Management rows. Publish borrows the eye pair, because what
                    the control actually decides is whether students see the area
                    — "Publish" alone never said where it went. */}
                <div className="area-card-actions">
                  <Button
                    color="secondary"
                    size="xs"
                    onClick={() => togglePublished(area.id)}
                    iconLeading={
                      <HugeiconsIcon
                        icon={area.published ? ViewOffSlashIcon : ViewIcon}
                        size={16}
                        strokeWidth={2}
                      />
                    }
                  >
                    {area.published ? "Unpublish" : "Publish"}
                    <span className="sf-sr-only"> area {area.title}</span>
                  </Button>
                  <Button
                    color="secondary"
                    size="xs"
                    onClick={() => startAreaEdit(area)}
                    iconLeading={
                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />
                    }
                  >
                    Edit<span className="sf-sr-only"> area {area.title}</span>
                  </Button>
                  <Button
                    color="secondary-destructive"
                    size="xs"
                    onClick={() => removeArea(area.id)}
                    iconLeading={<HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />}
                  >
                    Delete<span className="sf-sr-only"> area {area.title}</span>
                  </Button>
                </div>
              </article>
          ))}
        </div>
      )}

      {formDrawer}
    </div>
  );
}
