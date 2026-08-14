"use client";

import { useState } from "react";
import {
  BATCH_YEARS,
  CURRENT_BATCH_YEAR,
  CURRICULUM_STREAMS,
  SCHOOL_LEVEL_LABELS,
  newSetupId,
  suggestBatchName,
  suggestGradeName,
  type SetupBatch,
  type SetupGrade,
  type SetupSchool
} from "@/lib/data/schoolSetup";
import type { SchoolLevel } from "@/lib/data/schools";
import { useSchoolSetup } from "@/lib/school-setup-store";
import { Modal } from "@/components/shared/Modal";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { Button } from "@/components/base/buttons/button";

/** What the modal is doing: adding a child of the current node, or editing it. */
export type SetupModalRequest =
  | { mode: "add"; kind: "school" }
  | { mode: "add"; kind: "grade"; school: SetupSchool }
  | { mode: "add"; kind: "batch"; school: SetupSchool; grade: SetupGrade }
  | { mode: "edit"; kind: "school"; school: SetupSchool }
  | { mode: "edit"; kind: "grade"; school: SetupSchool; grade: SetupGrade }
  | { mode: "edit"; kind: "batch"; school: SetupSchool; grade: SetupGrade; batch: SetupBatch };

const LEVEL_OPTIONS: ComboboxOption<SchoolLevel>[] = (["ES", "MS", "HS"] as SchoolLevel[]).map(
  (level) => ({ value: level, label: SCHOOL_LEVEL_LABELS[level] })
);

const STREAM_OPTIONS: ComboboxOption[] = CURRICULUM_STREAMS.map((stream) => ({
  value: stream,
  label: stream
}));

const YEAR_OPTIONS: ComboboxOption[] = BATCH_YEARS.map((year) => ({ value: year, label: year }));

const KIND_LABELS = { school: "school", grade: "grade", batch: "batch" } as const;

/**
 * One modal for all six add/edit combinations rather than six components: the
 * fields differ but the flow does not, and a shared footer keeps "what happens
 * next" (a new grade needs batches before anyone can enrol) in one place.
 *
 * A centered Modal, not the Invite User drawer: this is a short form reached from
 * the node you are already looking at, and the drawer's value there is keeping a
 * long list visible behind it — here the thing behind is the record being edited.
 */
export function SetupNodeModal({
  request,
  onClose
}: {
  request: SetupModalRequest;
  onClose: () => void;
}) {
  const { addSchool, updateSchool, addGrade, updateGrade, addBatch, updateBatch } = useSchoolSetup();
  const editing = request.mode === "edit";

  const existingSchool = "school" in request ? request.school : null;
  const existingGrade = "grade" in request ? request.grade : null;
  const existingBatch = "batch" in request ? request.batch : null;

  const [name, setName] = useState(() => {
    if (request.mode === "edit") {
      if (request.kind === "school") return request.school.name;
      if (request.kind === "grade") return request.grade.name;
      return request.batch.name;
    }
    if (request.kind === "grade") return suggestGradeName(request.school);
    if (request.kind === "batch") return suggestBatchName(request.grade);
    return "";
  });

  const [code, setCode] = useState(
    request.mode === "edit" && request.kind === "school" ? request.school.code : ""
  );
  const [level, setLevel] = useState<SchoolLevel>(
    request.mode === "edit" && request.kind === "school" ? request.school.level : "HS"
  );
  const [principal, setPrincipal] = useState(
    request.mode === "edit" && request.kind === "school" ? request.school.principal : ""
  );
  const [city, setCity] = useState(
    request.mode === "edit" && request.kind === "school" ? request.school.city : "Edison, NJ"
  );

  const [stream, setStream] = useState(
    request.mode === "edit" && request.kind === "grade"
      ? request.grade.stream
      : (existingSchool?.grades[0]?.stream ?? "General")
  );
  const [lead, setLead] = useState(
    request.mode === "edit" && request.kind === "grade" ? request.grade.lead : ""
  );

  const [year, setYear] = useState(
    request.mode === "edit" && request.kind === "batch" ? request.batch.year : CURRENT_BATCH_YEAR
  );
  const [capacity, setCapacity] = useState(
    request.mode === "edit" && request.kind === "batch" ? String(request.batch.capacity) : "34"
  );

  const trimmedName = name.trim();
  const capacityValue = Number(capacity);
  const enrolled = existingBatch?.enrolled ?? 0;

  /* Capacity below what is already enrolled would make the seat meter read past
     100% for a batch nobody over-filled — the number is simply wrong, so it is
     blocked here rather than clamped silently. */
  const capacityError =
    request.kind === "batch" && capacity !== ""
      ? !Number.isFinite(capacityValue) || capacityValue < 1
        ? "Give the batch at least one seat."
        : capacityValue < enrolled
          ? `${enrolled} students are already enrolled — capacity can't be lower.`
          : undefined
      : request.kind === "batch"
        ? "Enter a seat capacity."
        : undefined;

  const canSave = trimmedName !== "" && !capacityError;

  const save = () => {
    if (!canSave) return;

    if (request.kind === "school") {
      const patch = {
        name: trimmedName,
        code: (code.trim() || trimmedName.slice(0, 3)).toUpperCase(),
        level,
        principal: principal.trim() || "Unassigned",
        city: city.trim() || "—"
      };
      if (request.mode === "edit") updateSchool(request.school.id, patch);
      else addSchool({ id: newSetupId("school", trimmedName), grades: [], ...patch });
    } else if (request.kind === "grade") {
      const patch = { name: trimmedName, stream, lead: lead.trim() || "Unassigned" };
      if (request.mode === "edit") updateGrade(request.school.id, request.grade.id, patch);
      else addGrade(request.school.id, { id: newSetupId("grade", trimmedName), batches: [], ...patch });
    } else {
      const patch = { name: trimmedName, year, capacity: capacityValue };
      if (request.mode === "edit") {
        updateBatch(request.school.id, request.grade.id, request.batch.id, patch);
      } else {
        addBatch(request.school.id, request.grade.id, {
          id: newSetupId("batch", `${request.grade.name} ${trimmedName}`),
          // A new batch starts empty: enrollment comes from Genesis, not from
          // whoever created the batch.
          enrolled: 0,
          ...patch
        });
      }
    }

    onClose();
  };

  const kindLabel = KIND_LABELS[request.kind];
  const parentName =
    request.kind === "batch"
      ? `${existingSchool?.name} · ${existingGrade?.name}`
      : request.kind === "grade"
        ? (existingSchool?.name ?? "")
        : "Edison Unified District";

  const footNote = editing
    ? `Changes apply everywhere this ${kindLabel} is reported.`
    : request.kind === "school"
      ? "Grades and batches are added once the school exists."
      : request.kind === "grade"
        ? "Add batches under this grade next — students enrol into batches."
        : "Enrollment syncs from Genesis, so the batch starts empty.";

  return (
    <Modal title={`${editing ? "Edit" : "Add"} ${kindLabel}`} onClose={onClose}>
      <p className="sf-panel-note">
        {editing ? `In ${parentName}` : `Adding under ${parentName}`}
      </p>

      <label className="sf-field">
        <span>{editing ? "Name" : `${kindLabel[0].toUpperCase()}${kindLabel.slice(1)} name`}</span>
        <input
          type="text"
          value={name}
          placeholder={
            request.kind === "school"
              ? "e.g. Franklin Park High School"
              : request.kind === "grade"
                ? "e.g. Grade 9"
                : "e.g. Batch A"
          }
          onChange={(event) => setName(event.target.value)}
        />
        {trimmedName === "" ? (
          <span className="sf-field-error">Give it a name before saving.</span>
        ) : null}
      </label>

      {request.kind === "school" ? (
        <>
          <div className="sf-field-row">
            <label className="sf-field">
              <span>School code</span>
              <input
                type="text"
                value={code}
                placeholder="e.g. FPH"
                onChange={(event) => setCode(event.target.value)}
              />
            </label>
            <label className="sf-field">
              <span>Level</span>
              <Combobox options={LEVEL_OPTIONS} value={level} onChange={setLevel} />
            </label>
          </div>

          <div className="sf-field-row">
            <label className="sf-field">
              <span>Principal</span>
              <input
                type="text"
                value={principal}
                placeholder="Full name"
                onChange={(event) => setPrincipal(event.target.value)}
              />
            </label>
            <label className="sf-field">
              <span>Location</span>
              <input
                type="text"
                value={city}
                placeholder="City, State"
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
          </div>
        </>
      ) : null}

      {request.kind === "grade" ? (
        <>
          <label className="sf-field">
            <span>Curriculum stream</span>
            <Combobox options={STREAM_OPTIONS} value={stream} onChange={setStream} />
          </label>
          <label className="sf-field">
            <span>Grade lead</span>
            <input
              type="text"
              value={lead}
              placeholder="Full name"
              onChange={(event) => setLead(event.target.value)}
            />
          </label>
        </>
      ) : null}

      {request.kind === "batch" ? (
        <div className="sf-field-row">
          <label className="sf-field">
            <span>Batch year</span>
            <Combobox options={YEAR_OPTIONS} value={year} onChange={setYear} />
          </label>
          <label className="sf-field">
            <span>Seat capacity</span>
            <input
              type="number"
              min={Math.max(1, enrolled)}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
            />
            {capacityError ? <span className="sf-field-error">{capacityError}</span> : null}
          </label>
        </div>
      ) : null}

      <p className="sf-card-hint">{footNote}</p>

      <div className="list-editor-form-actions">
        <Button size="sm" onClick={save} isDisabled={!canSave}>
          {editing ? "Save Changes" : `Create ${kindLabel}`}
        </Button>
        <Button color="tertiary" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
