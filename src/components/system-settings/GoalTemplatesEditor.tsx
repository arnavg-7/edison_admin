"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { goalCategories } from "@/lib/data/academicGoals";
import { targetSentence } from "@/lib/data/gradeGoalProgress";
import type { GoalTemplate } from "@/lib/data/goalTemplates";
import { newTemplateId, useGoalTemplates } from "@/lib/goal-templates-store";
import { usePoag } from "@/lib/poag-store";
import { subjects } from "@/lib/data/systemSettings";
import { Button } from "@/components/base/buttons/button";
import { Combobox } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

type Draft = {
  title: string;
  description: string;
  category: string;
  measurementType: "manual" | "auto";
  pillarKey: string;
  requiredLevel: string;
  /** "" means any subject. */
  subjectId: string;
  published: boolean;
};

function emptyDraft(): Draft {
  return {
    title: "",
    description: "",
    category: goalCategories[0]?.title ?? "",
    measurementType: "manual",
    pillarKey: "",
    requiredLevel: "",
    subjectId: "",
    published: false
  };
}

function draftFrom(template: GoalTemplate): Draft {
  return {
    title: template.title,
    description: template.description,
    category: template.category,
    measurementType: template.measurement.type,
    pillarKey: template.measurement.type === "auto" ? template.measurement.pillarKey : "",
    requiredLevel:
      template.measurement.type === "auto" ? template.measurement.requiredLevel : "",
    subjectId:
      template.measurement.type === "auto" ? (template.measurement.subjectId ?? "") : "",
    published: template.published
  };
}

/**
 * Add, edit and publish the templates the Set a goal drawer offers.
 *
 * Here rather than on a grade's Goals screen because a template is district-wide:
 * the point of one is that two schools setting the same goal set the same goal.
 * A grade-level editor would quietly make them per-grade.
 *
 * Publishing is the gate. A template stays a draft until an admin says it is ready,
 * and only published ones reach the drawer — a half-written template that pre-filled
 * a real goal would be worse than typing it out.
 */
export function GoalTemplatesEditor() {
  const { pillars, levels } = usePoag();
  const { templates: items, saveTemplate, deleteTemplate, togglePublished } = useGoalTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const categoryOptions = goalCategories.map((category) => ({
    value: category.title,
    label: category.title
  }));
  const pillarOptions = pillars.map((pillar) => ({
    value: pillar.rubricKey,
    label: pillar.displayTitle
  }));
  const levelOptions = levels.map((level) => ({ value: level.label, label: level.label }));
  const subjectOptions = [
    { value: "", label: "Any subject" },
    ...subjects.map((subject) => ({ value: subject.id, label: subject.name }))
  ];

  const startAdd = () => {
    setDraft(emptyDraft());
    setEditingId(null);
    setIsAdding(true);
  };

  const startEdit = (template: GoalTemplate) => {
    setDraft(draftFrom(template));
    setIsAdding(false);
    setEditingId(template.id);
  };

  const cancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const canSave =
    draft.title.trim() !== "" &&
    draft.description.trim() !== "" &&
    // Same rule as a goal: an auto template with no pillar or level to reach
    // would fill the drawer with a measurement that evaluates nothing.
    (draft.measurementType === "manual" ||
      (draft.pillarKey !== "" && draft.requiredLevel !== ""));

  const save = () => {
    if (!canSave) return;

    const existing = editingId ? items.find((item) => item.id === editingId) : undefined;

    const template: GoalTemplate = {
      id: editingId ?? newTemplateId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      measurement:
        draft.measurementType === "auto"
          ? {
              type: "auto",
              pillarKey: draft.pillarKey,
              requiredLevel: draft.requiredLevel,
              subjectId: draft.subjectId === "" ? null : draft.subjectId
            }
          : { type: "manual" },
      published: draft.published,
      // Usage is counted, never typed. A new template has none yet.
      usage: existing?.usage ?? "Not yet used"
    };

    saveTemplate(template);
    cancel();
  };



  const isOpen = isAdding || editingId !== null;

  return (
    <>
      <div className="sf-panel-head">
        <h2>Goal templates</h2>
        <div className="sf-panel-head-end">
          <span className="sf-panel-note">
            {items.filter((item) => item.published).length} published ·{" "}
            {items.filter((item) => !item.published).length} draft
          </span>
          {items.length > 0 ? (
            <Button
              size="sm"
              onClick={startAdd}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add template
            </Button>
          ) : null}
        </div>
      </div>

      {/* Says what a template carries, since the old ones only carried a name and
          an admin who remembers that would not expect the rest to be filled. */}
      <p className="sf-panel-note goals-panel-intro">
        Starting points offered in Goals when an admin sets a goal. A template carries the name,
        description, category and measurement, so picking one fills the whole form. Only published
        templates are offered.
      </p>

      {items.length === 0 ? (
        <EmptyState
          title="No goal templates"
          message="Add a template for a goal your schools set every semester, so nobody retypes it."
          action={
            <Button
              size="sm"
              onClick={startAdd}
              iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />}
            >
              Add template
            </Button>
          }
        />
      ) : (
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Template</th>
                <th scope="col">Category</th>
                <th scope="col">Measured</th>
                <th scope="col">In use</th>
                <th scope="col">Status</th>
                <th scope="col" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((template) => (
                <tr key={template.id} data-editing={editingId === template.id || undefined}>
                  <td>
                    <div className="list-editor-item-title">{template.title}</div>
                    <div className="list-editor-item-detail">{template.description}</div>
                  </td>
                  <td>{template.category}</td>
                  <td>
                    <StatusBadge tone={template.measurement.type === "auto" ? "ok" : "neutral"}>
                      {template.measurement.type === "auto" ? "Auto" : "Manual"}
                    </StatusBadge>
                    {template.measurement.type === "auto" ? (
                      <div className="list-editor-item-detail">
                        {/* Reuses the goal's own wording, so a template reads the
                            same as the goal it will produce. */}
                        {targetSentence({
                          id: template.id,
                          title: template.title,
                          description: template.description,
                          category: template.category,
                          semester: { name: "", from: "", to: "" },
                          measurement: template.measurement
                        })}
                      </div>
                    ) : null}
                  </td>
                  <td className="list-editor-item-detail">{template.usage}</td>
                  <td>
                    <StatusBadge tone={template.published ? "ok" : "neutral"}>
                      {template.published ? "Published" : "Draft"}
                    </StatusBadge>
                  </td>
                  <td>
                    <div className="sf-row-actions">
                      <Button
                        color="secondary"
                        size="xs"
                        onClick={() => togglePublished(template.id)}
                      >
                        {template.published ? "Unpublish" : "Publish"}
                        <span className="sf-sr-only"> {template.title}</span>
                      </Button>
                      <Button color="secondary" size="xs" onClick={() => startEdit(template)}>
                        Edit<span className="sf-sr-only"> {template.title}</span>
                      </Button>
                      <Button
                        color="secondary-destructive"
                        size="xs"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Delete<span className="sf-sr-only"> {template.title}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) cancel();
        }}
      >
        <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit template" : "Add goal template"}</SheetTitle>
            <SheetDescription>
              {editingId
                ? "Goals already set from this template keep the wording they were created with."
                : "Fill in the goal as you would set it. Everything here becomes the starting point."}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <div className="list-editor-form list-editor-form--drawer">
              <label className="sf-field">
                <span>Template name</span>
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
                  rows={3}
                  value={draft.description}
                  placeholder="What good looks like, in a sentence."
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                />
              </label>

              <label className="sf-field">
                <span>Category</span>
                <Combobox
                  options={categoryOptions}
                  value={draft.category}
                  onChange={(category) => setDraft({ ...draft, category })}
                  placeholder="Select a category"
                />
              </label>

              <fieldset className="goal-fieldset">
                <legend>How progress is measured</legend>

                <div className="tone-options">
                  <label className="tone-option">
                    <input
                      type="radio"
                      name="template-measurement"
                      checked={draft.measurementType === "manual"}
                      onChange={() => setDraft({ ...draft, measurementType: "manual" })}
                    />
                    <span className="tone-name">Manual — the student reports their status</span>
                  </label>
                  <label className="tone-option">
                    <input
                      type="radio"
                      name="template-measurement"
                      checked={draft.measurementType === "auto"}
                      onChange={() => setDraft({ ...draft, measurementType: "auto" })}
                    />
                    <span className="tone-name">Auto — measured from the POAG rating</span>
                  </label>
                </div>

                {draft.measurementType === "auto" ? (
                  <>
                    <label className="sf-field">
                      <span>Pillar</span>
                      <Combobox
                        options={pillarOptions}
                        value={draft.pillarKey}
                        onChange={(pillarKey) => setDraft({ ...draft, pillarKey })}
                        placeholder="Select a pillar"
                      />
                    </label>

                    <div className="sf-field-row">
                      <label className="sf-field">
                        <span>Level to reach</span>
                        <Combobox
                          options={levelOptions}
                          value={draft.requiredLevel}
                          onChange={(requiredLevel) => setDraft({ ...draft, requiredLevel })}
                          placeholder="Select a level"
                        />
                      </label>

                      <label className="sf-field">
                        <span>Measured in</span>
                        <Combobox
                          options={subjectOptions}
                          value={draft.subjectId}
                          onChange={(subjectId) => setDraft({ ...draft, subjectId })}
                        />
                      </label>
                    </div>
                  </>
                ) : null}
              </fieldset>

              {/* Publishing is a decision, not a side effect of saving: a template
                  is only offered once someone says it is ready. */}
              <label className="sf-field sf-field--toggle">
                <input
                  type="checkbox"
                  checked={draft.published}
                  onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
                />
                <span>
                  Publish this template{" "}
                  <span className="sf-field-hint">offered in Goals straight away</span>
                </span>
              </label>
            </div>
          </div>

          <SheetFooter className="flex-row">
            <Button size="sm" onClick={save} isDisabled={!canSave}>
              {editingId ? "Save template" : "Add template"}
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
