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
import { subjectsForGrade } from "@/lib/data/poagCoverage";
import { subjects as allSubjects } from "@/lib/data/systemSettings";
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

/**
 * The ceiling on areas in one subject.
 *
 * Not an arbitrary limit: a subject's set is the four headings a student reads
 * down their Growth screen — Strengths, Room To Grow, Interests, Future Goals.
 * A fifth would have nowhere to go there, so a full subject offers no Add and
 * says why, rather than accepting an area the student portal cannot show.
 */
const MAX_AREAS_PER_SUBJECT = 4;

/** Only for orphans — a subject dropped from the grade keeps its own name. */
function subjectLabel(id: string): string {
  return allSubjects.find((subject) => subject.id === id)?.name ?? "Unmapped subject";
}

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

  /** Which subject a new area is being written into — null when not adding. */
  const [addingForSubject, setAddingForSubject] = useState<string | null>(null);
  const [areaDraft, setAreaDraft] = useState<AreaDraft>(emptyAreaDraft);

  /* Only the subjects this grade is actually taught — an unmapped subject, or
     one that starts in a later grade, has nobody here to write areas for. Same
     list the Portrait of a Graduate screens use, so the two agree. */
  const gradeSubjects = subjectsForGrade(grade);

  /* Every subject's set is on the page, stacked, so this narrows rather than
     scopes: "All subjects" is the default reading and one subject is the
     zoom-in. A dropdown rather than chips because the list grows with the
     curriculum, and a row of chips is the wrong control for a list that does. */
  const [subjectFilter, setSubjectFilter] = useState("all");
  /* Changing grade can strip a subject out from under the filter — Science is
     not taught in Grade 1 — which would otherwise leave the panel silently
     empty rather than showing the grade you just moved to. */
  const activeFilter = gradeSubjects.some((entry) => entry.id === subjectFilter)
    ? subjectFilter
    : "all";

  const shownSubjects =
    activeFilter === "all"
      ? gradeSubjects
      : gradeSubjects.filter((entry) => entry.id === activeFilter);

  const sections = shownSubjects.map((subject) => ({
    subject,
    areas: areas.filter((area) => area.subjectId === subject.id)
  }));

  /* Areas whose subject is no longer taught here. Shown read-only under "All
     subjects" rather than dropped: content that exists but renders nowhere is
     how a grade quietly loses a term's work. */
  const orphanAreas =
    activeFilter === "all"
      ? areas.filter((area) => !gradeSubjects.some((entry) => entry.id === area.subjectId))
      : [];

  const shownAreas = [...sections.flatMap((section) => section.areas), ...orphanAreas];
  const shownSkills = shownAreas.reduce((sum, area) => sum + area.skills.length, 0);

  const addingSubjectName = addingForSubject ? subjectLabel(addingForSubject) : "this subject";

  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [skillDraftFor, setSkillDraftFor] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState("");
  const [editingSkill, setEditingSkill] = useState<{ areaId: string; skillId: string } | null>(null);

  const resetAreaDraft = () => setAreaDraft(emptyAreaDraft);

  const startAddArea = (targetSubjectId: string) => {
    resetAreaDraft();
    setEditingAreaId(null);
    setAddingForSubject(targetSubjectId);
  };

  const saveNewArea = () => {
    if (!addingForSubject || !areaDraft.title.trim() || periodError(areaDraft)) return;
    setAreas((current) => {
      // Re-checked on save, not only on the disabled button: the drawer can be
      // open while another area is added to the same subject behind it.
      const inSubject = current.filter((area) => area.subjectId === addingForSubject);
      if (inSubject.length >= MAX_AREAS_PER_SUBJECT) return current;
      return [
        ...current,
        {
          id: nextId("area"),
          title: areaDraft.title.trim(),
          tone: areaDraft.tone,
          icon: areaDraft.icon,
          subjectId: addingForSubject,
          published: false,
          period: draftPeriod(areaDraft),
          skills: []
        }
      ];
    });
    resetAreaDraft();
    setAddingForSubject(null);
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
    setAddingForSubject(null);
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

      {/* No subject field: an area belongs to the set it is created in, and
          moving one between subjects would mean moving its skills to a teacher
          who never wrote them. Use that subject's own Add area instead. */}
      {editingAreaId ? null : (
        <p className="sf-field-hint">
          Added to the {addingSubjectName} set. Every subject keeps its own areas, up to{" "}
          {MAX_AREAS_PER_SUBJECT}.
        </p>
      )}

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
  const isFormOpen = addingForSubject !== null || editingAreaId !== null;
  const closeForm = () => {
    setAddingForSubject(null);
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
          <SheetTitle>
            {editingAreaId ? "Edit area" : `Add area to ${addingSubjectName}`}
          </SheetTitle>
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

  /**
   * One area card, shared by every subject section and by the orphan section
   * below them — the only difference is whether the card has to name its own
   * subject, which it does when no heading above it already has.
   */
  const areaCard = (area: DevelopmentArea, showSubject = false) => (
      <article className={`area-card tone-${area.tone}`} key={area.id}>
        <div className="area-card-top">
          <span className={`area-icon tone-${area.tone}`} aria-hidden>
            <DevAreaIcon name={area.icon} />
          </span>
          {/* Named only where there is no subject heading above the card to
            say it — otherwise the section already has. */}
        {showSubject ? (
          <span className="area-subjects">{subjectLabel(area.subjectId)}</span>
        ) : null}
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
  );

  const subjectOptions = [
    { value: "all", label: "All subjects" },
    ...gradeSubjects.map((subject) => ({ value: subject.id, label: subject.name }))
  ];

  return (
    <div className="sf-panel">
      {/* Counts, the subject filter and the heading share one row, the way every
          other panel in the app carries its controls. The per-subject Add area
          buttons live down in the sections, where it is unambiguous which set a
          new area lands in. */}
      <div className="sf-panel-head">
        <h2>Development areas</h2>
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {shownAreas.length} areas · {shownSkills} skills ·{" "}
            {shownAreas.filter((area) => area.published).length} published
          </span>
          {/* Nothing to narrow with one subject, so the control does not appear. */}
          {gradeSubjects.length > 1 ? (
            <label className="sf-field sf-field--inline">
              <span>Subject</span>
              <Combobox
                value={activeFilter}
                options={subjectOptions}
                onChange={setSubjectFilter}
                ariaLabel="Show one subject or all of them"
              />
            </label>
          ) : null}
        </div>
      </div>

      {gradeSubjects.length === 0 ? (
        <EmptyState
          title="No subjects mapped to this grade"
          message="Development areas are one set per subject, so a grade with no mapped subject has nowhere to keep them. Map a subject to this grade in System Settings first."
        />
      ) : (
        /* Every subject's set, stacked, rather than one at a time: the four
           headings mean different things under each subject, and comparing what
           Maths asks for against what Art asks for is the whole reason an admin
           opens this screen. */
        <div className="area-subject-groups">
          {sections.map(({ subject, areas: subjectAreas }) => {
            const full = subjectAreas.length >= MAX_AREAS_PER_SUBJECT;
            const addButton = (
              <Button
                color="secondary"
                size="xs"
                isDisabled={full}
                onClick={() => startAddArea(subject.id)}
                iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
              >
                Add area<span className="sf-sr-only"> to {subject.name}</span>
              </Button>
            );

            return (
              <section className="area-subject-group" key={subject.id}>
                <div className="area-subject-head">
                  <h3>{subject.name}</h3>
                  {/* "of 4" carries the ceiling, so a disabled Add area is
                      already explained by the line beside it. */}
                  <span className="sf-panel-note">
                    {subjectAreas.length} of {MAX_AREAS_PER_SUBJECT} areas ·{" "}
                    {subjectAreas.reduce((sum, area) => sum + area.skills.length, 0)} skills
                  </span>
                  {full ? (
                    <span title={`${subject.name} already has all ${MAX_AREAS_PER_SUBJECT} areas. Delete one to add another.`}>
                      {addButton}
                    </span>
                  ) : (
                    addButton
                  )}
                </div>

                {subjectAreas.length === 0 ? (
                  <p className="sf-subrow-empty">
                    No development areas in {subject.name} yet. Add one such as Strengths, then
                    list the skills that belong under it.
                  </p>
                ) : (
                  <div className="area-grid">{subjectAreas.map((area) => areaCard(area))}</div>
                )}
              </section>
            );
          })}

          {orphanAreas.length > 0 ? (
            <section className="area-subject-group">
              <div className="area-subject-head">
                <h3>Not taught in this grade</h3>
                <span className="sf-panel-note">
                  {orphanAreas.length} area{orphanAreas.length === 1 ? "" : "s"} · not shown to
                  students
                </span>
              </div>
              <p className="sf-subrow-empty">
                Written for a subject this grade no longer runs. Kept rather than dropped, so a
                term&rsquo;s work is not lost — delete them, or map the subject back to this grade
                in System Settings.
              </p>
              <div className="area-grid">{orphanAreas.map((area) => areaCard(area, true))}</div>
            </section>
          ) : null}
        </div>
      )}

      {formDrawer}
    </div>
  );
}
