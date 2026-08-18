"use client";

import { useState } from "react";
import {
  STUDENT_GOAL_CATEGORIES,
  type StudentGoal,
  type StudentGoalCategory
} from "@/lib/data/studentGoals";
import { gradeRoster } from "@/lib/data/studentRoster";
import { addStudentGoal, newStudentGoalId } from "@/lib/student-goals-store";
import { usePoag } from "@/lib/poag-store";
import { ADMIN_ROLE_LABEL } from "@/lib/nav";
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

/**
 * Sets one goal for one student.
 *
 * Individual, unlike the grade goals on the sibling tab: this is the goal that
 * came out of a meeting about one student, and it is theirs alone.
 *
 * It carries no status field. The admin writes the goal; the student or their
 * teacher reports where they have got to, which is the same split the rest of this
 * panel already reflects. A new goal therefore starts at Not started, and the
 * drawer says who moves it from there rather than offering a control that would
 * let an admin claim progress they did not witness.
 */
export function StudentGoalDrawer({
  schoolId,
  grade,
  /** Pre-selects a student when opened from their row. */
  student = "",
  onClose,
  onSaved
}: {
  schoolId: string;
  grade: string;
  student?: string;
  onClose: () => void;
  onSaved: (studentName: string) => void;
}) {
  const { pillars } = usePoag();

  const [studentName, setStudentName] = useState(student);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<StudentGoalCategory>(STUDENT_GOAL_CATEGORIES[0]);
  const [pillarKey, setPillarKey] = useState("");
  const [due, setDue] = useState("");

  const studentOptions = gradeRoster(schoolId, grade).map((entry) => ({
    value: entry.name,
    label: entry.name
  }));

  const canSave = studentName !== "" && title.trim() !== "" && pillarKey !== "";

  const save = () => {
    if (!canSave) return;

    const pillar = pillars.find((entry) => entry.rubricKey === pillarKey);

    const goal: StudentGoal = {
      id: newStudentGoalId(studentName),
      title: title.trim(),
      description: description.trim(),
      category,
      pillarKey,
      pillarTitle: pillar?.displayTitle ?? pillarKey,
      due,
      // Nobody has reported anything yet, and the admin is not about to.
      status: "Not started",
      setBy: ADMIN_ROLE_LABEL,
      setByRole: "Admin"
    };

    addStudentGoal(schoolId, grade, studentName, goal);
    onSaved(studentName);
    onClose();
  };

  return (
    <Sheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Set a goal for a student</SheetTitle>
          <SheetDescription>
            One student, not the whole grade. They or their teacher report progress on it.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <div className="list-editor-form list-editor-form--drawer">
            <label className="sf-field">
              <span>Student</span>
              <Combobox
                options={studentOptions}
                value={studentName}
                onChange={setStudentName}
                placeholder="Select a student"
              />
            </label>

            <label className="sf-field">
              <span>Goal</span>
              <input
                type="text"
                autoFocus
                value={title}
                placeholder="e.g. Join the debate team"
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="sf-field">
              <span>Description</span>
              <textarea
                rows={3}
                value={description}
                placeholder="What was agreed, and what success looks like."
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="sf-field">
              <span>Type</span>
              <Combobox
                options={STUDENT_GOAL_CATEGORIES.map((entry) => ({ value: entry, label: entry }))}
                value={category}
                onChange={(next) => setCategory(next as StudentGoalCategory)}
              />
            </label>

            {/* Required, not optional: the skill tag is what ties a loose
                intention back to something the school measures, and an untagged
                goal would sit outside every report that uses it. */}
            <label className="sf-field">
              <span>POAG skill it builds</span>
              <Combobox
                options={pillars.map((pillar) => ({
                  value: pillar.rubricKey,
                  label: pillar.displayTitle
                }))}
                value={pillarKey}
                onChange={setPillarKey}
                placeholder="Select a skill"
              />
            </label>

            <label className="sf-field">
              <span>Due date (optional)</span>
              <input
                type="date"
                value={due}
                onChange={(event) => setDue(event.target.value)}
              />
            </label>

            {/* Says plainly what this drawer will not do, so the missing status
                field reads as a rule rather than an omission. */}
            <p className="sf-field-hint">
              Saved as Not started. Only {studentName || "the student"} or their teacher can move it
              from there — an admin sets the goal, they report the progress.
            </p>
          </div>
        </div>

        <SheetFooter className="flex-row">
          <Button size="sm" onClick={save} isDisabled={!canSave}>
            Set goal
          </Button>
          <Button color="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
