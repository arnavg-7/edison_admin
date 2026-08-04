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
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/base/buttons/button";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";

type ComboOption = ComboboxOption;

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
  onCreate
}: {
  onBack: () => void;
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
      active: true,
      // Never signed in yet — this is a brand new account.
      lastLogin: null,
      // Seeded blank so the profile opens with fields ready to complete; this
      // is what puts a new account at Draft until the admin fills them in.
      personal: blankPersonalFields(kind),
      academic: blankAcademicFields(kind),
      alerts: []
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto auto-rows-min">
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
          options={KIND_OPTIONS}
          value={kind}
          onChange={(next) => setKind(next as PersonKind)}
          placeholder="Select a type"
        />
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Grade Level</span>
          <Combobox
            options={LEVEL_OPTIONS}
            value={level}
            onChange={(next) => setLevelAndReset(next as SchoolLevel)}
            placeholder="Select a level"
          />
        </label>

        <label className="sf-field">
          <span>School</span>
          <Combobox
            options={schoolOptions}
            value={schoolId}
            onChange={setSchoolAndReset}
            placeholder="Select a school"
            disabled={level === ""}
          />
        </label>
      </div>

      {kind === "student" ? (
        <label className="sf-field">
          <span>Grade</span>
          <Combobox
            options={gradeOptions}
            value={grade}
            onChange={setGrade}
            placeholder="Select a grade"
            disabled={!school}
          />
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
      </div>

      <div className="list-editor-form-actions list-editor-form-actions--drawer">
        <Button
          size="sm"
          onClick={save}
          isDisabled={!canSave}
          iconLeading={<HugeiconsIcon icon={UserAdd02Icon} size={16} />}
        >
          Create User
        </Button>
        <Button color="secondary" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}
