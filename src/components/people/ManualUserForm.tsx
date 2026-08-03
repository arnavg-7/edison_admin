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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const gradeOptions = school ? gradesForSchool(school.id) : [];

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
        <Select value={kind} onValueChange={(value) => setKind(value as PersonKind)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="faculty">Faculty</SelectItem>
          </SelectContent>
        </Select>
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Grade Level</span>
          <Select
            value={level}
            onValueChange={(value) => setLevelAndReset(value as SchoolLevel | "")}
          >
            <SelectTrigger>
              {/* Base UI's Select never renders a label for value="" (its
                  "nothing selected" sentinel), so the unset state has to come
                  from this placeholder rather than a fake empty SelectItem. */}
              <SelectValue placeholder="Select a level" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {SCHOOL_LEVELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="sf-field">
          <span>School</span>
          <Select
            value={schoolId}
            onValueChange={(value) => setSchoolAndReset(value ?? "")}
            disabled={level === ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {schoolsForLevel.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      {kind === "student" ? (
        <label className="sf-field">
          <span>Grade</span>
          <Select value={grade} onValueChange={(value) => setGrade(value ?? "")} disabled={!school}>
            <SelectTrigger>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {gradeOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {gradeLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

