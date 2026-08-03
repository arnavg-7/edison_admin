"use client";

import { useState } from "react";
import type { AlertSeverity, StudentAlert } from "@/lib/data/alerts";
import { taggableFaculty } from "@/lib/data/alerts";
import { peopleOfKind } from "@/lib/data/people";
import { schools } from "@/lib/data/schools";
import { Modal } from "@/components/shared/Modal";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";

const CATEGORIES = ["Attendance", "Missing work", "Goal overdue", "Grade drop", "Behavior"];
const SEVERITIES: AlertSeverity[] = ["high", "medium", "low"];

const students = peopleOfKind("student");
const faculty = taggableFaculty();

/** Students store "Grade 10" / department strings, not the "10" ids schools.ts uses. */
function gradeFromGroup(group: string): string {
  if (group === "Kindergarten") return "K";
  return group.replace(/^Grade\s+/i, "");
}

export function CreateAlertModal({
  onClose,
  onCreate
}: {
  onClose: () => void;
  onCreate: (alert: StudentAlert) => void;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState<AlertSeverity>("medium");
  const [description, setDescription] = useState("");
  const [taggedFaculty, setTaggedFaculty] = useState<string[]>([]);

  const canSave = studentId !== "" && description.trim() !== "";

  const toggleFaculty = (id: string) => {
    setTaggedFaculty((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );
  };

  const save = () => {
    const student = students.find((entry) => entry.id === studentId);
    if (!student || !canSave) {
      return;
    }

    const school = schools.find((entry) => entry.name === student.school);

    onCreate({
      id: `local-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      schoolId: school?.id ?? "",
      grade: gradeFromGroup(student.group),
      category,
      severity,
      description: description.trim(),
      status: "Open",
      loggedAt: new Date().toISOString(),
      createdBy: ADMIN_ROLE_LABEL,
      taggedFaculty
    });
    onClose();
  };

  return (
    <Modal title="Create Alert" onClose={onClose}>
      <label className="sf-field">
        <span>Student</span>
        <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} — {student.school}
            </option>
          ))}
        </select>
      </label>

      <div className="sf-field-row">
        <label className="sf-field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="sf-field">
          <span>Severity</span>
          <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)}>
            {SEVERITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="sf-field">
        <span>Description</span>
        <textarea
          rows={3}
          value={description}
          placeholder="What should faculty know about this alert?"
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label className="sf-field">
        <span>Tag faculty</span>
        <div className="alert-checkbox-list">
          {faculty.map((person) => (
            <label key={person.id}>
              <input
                type="checkbox"
                checked={taggedFaculty.includes(person.id)}
                onChange={() => toggleFaculty(person.id)}
              />
              {person.name} · {person.group}
            </label>
          ))}
        </div>
      </label>

      <div className="list-editor-form-actions">
        <button type="button" className="sf-btn sf-btn--primary" onClick={save} disabled={!canSave}>
          Create Alert
        </button>
        <button type="button" className="sf-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
