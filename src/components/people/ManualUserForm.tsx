"use client";

import { useState } from "react";
import {
  blankAcademicFields,
  blankPersonalFields,
  newPersonId,
  type Person,
  type PersonKind
} from "@/lib/data/people";
import { SCHOOL_LEVELS, gradeLabel, gradesForSchool, schools, type SchoolLevel } from "@/lib/data/schools";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from "@/components/ui/combobox";

type ComboOption = { value: string; label: string };

const isOptionEqual = (a: ComboOption, b: ComboOption) => a.value === b.value;

const KIND_OPTIONS: ComboOption[] = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" }
];

const LEVEL_OPTIONS: ComboOption[] = SCHOOL_LEVELS.map((option) => ({
  value: option.value,
  label: option.label
}));

/**
 * Mirrors the User Management filter cascade (Grade Level -> School -> Grade)
 * so creating a user asks for exactly the fields you'd later filter by.
 *
 * Deliberately minimal: this captures only what's needed to open a real
 * profile. The account is created immediately and its Personal details and
 * Enrollment tabs are seeded blank, so the admin completes the rest on the
 * profile itself and the status moves Draft -> Active as they go.
 */
export function ManualUserForm({
  onBack,
  onCancel,
  onCreate
}: {
  onBack: () => void;
  onCancel: () => void;
  onCreate: (person: Person) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<PersonKind>("student");
  const [level, setLevel] = useState<SchoolLevel | "">("");
  const [schoolId, setSchoolId] = useState("");
  const [grade, setGrade] = useState("");
  const [department, setDepartment] = useState("");

  const schoolsForLevel = level === "" ? [] : schools.filter((entry) => entry.level === level);
  const school = schools.find((entry) => entry.id === schoolId);
  const gradeOptionValues = school ? gradesForSchool(school.id) : [];

  const schoolOptions: ComboOption[] = schoolsForLevel.map((entry) => ({
    value: entry.id,
    label: entry.name
  }));

  const gradeOptions: ComboOption[] = gradeOptionValues.map((value) => ({
    value,
    label: gradeLabel(value)
  }));

  const setLevelAndReset = (value: SchoolLevel | "") => {
    setLevel(value);
    setSchoolId("");
    setGrade("");
  };

  const setSchoolAndReset = (value: string) => {
    setSchoolId(value);
    setGrade("");
  };

  const canSave =
    name.trim() !== "" &&
    school !== undefined &&
    (kind === "faculty" ? department.trim() !== "" : grade !== "");

  const save = () => {
    if (!school || !canSave) {
      return;
    }

    const trimmed = name.trim();

    onCreate({
      id: newPersonId(trimmed),
      kind,
      name: trimmed,
      school: school.name,
      group: kind === "student" ? gradeLabel(grade) : department.trim(),
      status: "Other",
      // Seeded blank so the profile opens with fields ready to complete; this
      // is what puts a new account at Draft until the admin fills them in.
      personal: blankPersonalFields(kind),
      academic: blankAcademicFields(kind),
      alerts: []
    });
  };

  return (
    <>
      <label className="sf-field">
        <span>Full name</span>
        <input
          type="text"
          value={name}
          placeholder="e.g. Priya Nair"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label className="sf-field">
        <span>Type</span>
        <Combobox
          items={KIND_OPTIONS}
          value={KIND_OPTIONS.find((option) => option.value === kind) ?? null}
          onValueChange={(option) => setKind((option?.value ?? "student") as PersonKind)}
          isItemEqualToValue={isOptionEqual}
        >
          <ComboboxInput placeholder="Select a type" />
          <ComboboxContent>
            <ComboboxEmpty>No matches</ComboboxEmpty>
            <ComboboxList>
              {(option: ComboOption) => (
                <ComboboxItem key={option.value} value={option}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Grade Level</span>
          <Combobox
            items={LEVEL_OPTIONS}
            value={LEVEL_OPTIONS.find((option) => option.value === level) ?? null}
            onValueChange={(option) => setLevelAndReset((option?.value ?? "") as SchoolLevel | "")}
            isItemEqualToValue={isOptionEqual}
          >
            <ComboboxInput placeholder="Select a level" />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            items={schoolOptions}
            value={schoolOptions.find((option) => option.value === schoolId) ?? null}
            onValueChange={(option) => setSchoolAndReset(option?.value ?? "")}
            isItemEqualToValue={isOptionEqual}
            disabled={level === ""}
          >
            <ComboboxInput placeholder="Select a school" disabled={level === ""} />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>
      </div>

      {kind === "student" ? (
        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            items={gradeOptions}
            value={gradeOptions.find((option) => option.value === grade) ?? null}
            onValueChange={(option) => setGrade(option?.value ?? "")}
            isItemEqualToValue={isOptionEqual}
            disabled={!school}
          >
            <ComboboxInput placeholder="Select a grade" disabled={!school} />
            <ComboboxContent>
              <ComboboxEmpty>No matches</ComboboxEmpty>
              <ComboboxList>
                {(option: ComboOption) => (
                  <ComboboxItem key={option.value} value={option}>
                    {option.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </label>
      ) : (
        <label className="sf-field">
          <span>Department</span>
          <input
            type="text"
            value={department}
            placeholder="e.g. Mathematics"
            onChange={(event) => setDepartment(event.target.value)}
          />
        </label>
      )}

      <p className="sf-panel-note">
        Their profile opens next, where you can complete the remaining details.
      </p>

      <div className="list-editor-form-actions">
        <Button onClick={save} disabled={!canSave}>
          Create User
        </Button>
        <button type="button" className="sf-btn" onClick={onBack}>
          Back
        </button>
        <button type="button" className="sf-btn sf-btn--quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </>
  );
}
