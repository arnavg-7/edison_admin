"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { numberOfStudents } from "@/lib/data/dashboard";
import {
  EMPTY_SEATS,
  SCHOOL_LEVEL_LABELS,
  batchCount,
  districtSeats,
  gradeSeats,
  schoolSeats,
  type Seats
} from "@/lib/data/schoolSetup";
import { useAdminScope } from "@/lib/admin-scope";
import { useSchoolSetup } from "@/lib/school-setup-store";
import { useSetupSelection } from "@/lib/school-setup-selection";
import { Button, styles as buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/lib/utils/cx";
import { SeatMeter } from "./SeatMeter";
import type { SetupModalRequest } from "./SetupNodeModal";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

/**
 * What the selected node *is* — the same panel in both views, so switching
 * between Drill-down and Columns changes how you navigate without changing what
 * a school looks like once you get there.
 *
 * The level is named in a typographic eyebrow rather than a coloured chip: this
 * theme spends colour on "act here" and on chart series, and four pastel badges
 * for four hierarchy levels would read as four statuses.
 */
export function SetupDetailPanel({ onEdit }: { onEdit: (request: SetupModalRequest) => void }) {
  const { district, removeSchool, removeGrade, removeBatch } = useSchoolSetup();
  const { schoolId: scopedSchoolId } = useAdminScope();
  const { school, grade, batch, kind } = useSetupSelection();

  const fields: { label: string; value: string }[] = [];
  let name = district.name;
  let path = "";
  let seats: Seats = EMPTY_SEATS;
  let edit: SetupModalRequest | null = null;
  let remove: (() => void) | null = null;
  let cascadeNote = "";

  if (kind === "batch" && school && grade && batch) {
    name = batch.name;
    path = `${school.name} · ${grade.name}`;
    seats = { enrolled: batch.enrolled, capacity: batch.capacity };
    fields.push(
      { label: "Batch year", value: batch.year },
      { label: "Capacity", value: String(batch.capacity) },
      { label: "Enrolled", value: String(batch.enrolled) },
      { label: "Seats open", value: String(Math.max(0, batch.capacity - batch.enrolled)) },
      { label: "Grade", value: grade.name },
      { label: "School", value: school.name }
    );
    edit = { mode: "edit", kind: "batch", school, grade, batch };
    remove = () => removeBatch(school.id, grade.id, batch.id);
    cascadeNote =
      batch.enrolled > 0
        ? `${batch.enrolled} enrolled students would need moving to another batch first.`
        : "The batch is empty, so nothing moves with it.";
  } else if (kind === "grade" && school && grade) {
    name = grade.name;
    path = school.name;
    seats = gradeSeats(grade);
    fields.push(
      { label: "Curriculum stream", value: grade.stream },
      { label: "Grade lead", value: grade.lead },
      { label: "Batches", value: String(grade.batches.length) },
      { label: "Students", value: seats.enrolled.toLocaleString() },
      { label: "School", value: school.name }
    );
    edit = { mode: "edit", kind: "grade", school, grade };
    remove = () => removeGrade(school.id, grade.id);
    cascadeNote = `Its ${grade.batches.length} batch${grade.batches.length === 1 ? "" : "es"} and ${seats.enrolled.toLocaleString()} enrolled students go with it.`;
  } else if (kind === "school" && school) {
    name = school.name;
    path = district.name;
    seats = schoolSeats(school);
    fields.push(
      { label: "School code", value: school.code },
      { label: "Level", value: SCHOOL_LEVEL_LABELS[school.level] },
      { label: "Principal", value: school.principal },
      { label: "Location", value: school.city },
      { label: "Grades", value: String(school.grades.length) },
      { label: "Batches", value: String(batchCount(school)) },
      { label: "Students", value: seats.enrolled.toLocaleString() }
    );
    /* The school node itself is the district's to edit and to delete: its name,
       code and level come off the Genesis roster, and deleting it takes every
       grade, batch and enrolment with it. A school admin works below this node,
       where grades and batches edit and delete as normal — so both actions are
       withheld here rather than one, which is also what the head's `edit &&
       remove` guard would have done silently. */
    edit = scopedSchoolId ? null : { mode: "edit", kind: "school", school };
    remove = scopedSchoolId ? null : () => removeSchool(school.id);
    cascadeNote = `Its ${school.grades.length} grades, ${batchCount(school)} batches and ${seats.enrolled.toLocaleString()} enrolled students go with it.`;
  } else {
    seats = districtSeats(district);
    const grades = district.schools.reduce((total, entry) => total + entry.grades.length, 0);
    const batches = district.schools.reduce((total, entry) => total + batchCount(entry), 0);
    fields.push(
      { label: "Schools", value: String(district.schools.length) },
      { label: "Grades", value: String(grades) },
      { label: "Batches", value: String(batches) },
      { label: "Enrolled in a batch", value: seats.enrolled.toLocaleString() }
    );

    /* Home reports 1,702 students district-wide and this tree only holds the ones
       sitting in a batch, so the residual is named rather than left as a silent
       12-student gap between two screens describing the same district. */
    const unplaced = numberOfStudents - seats.enrolled;
    if (unplaced !== 0) {
      fields.push({ label: "Not in a batch yet", value: unplaced.toLocaleString() });
    }
    fields.push({ label: "Region", value: district.region });
  }

  return (
    <div className="sf-panel">
      <div className="sf-panel-head sf-node-head">
        <div className="sf-node-identity">
          <p className="sf-node-kind">{kind}</p>
          <h2>{name}</h2>
          {path ? <span className="sf-panel-note">{path}</span> : null}
        </div>

        {edit && remove ? (
          <div className="sf-row-actions">
            <Button
              color="secondary"
              size="xs"
              onClick={() => onEdit(edit)}
              iconLeading={<HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} />}
            >
              Edit
            </Button>

            <AlertDialog>
              {/* Borrows the Untitled Button's classes rather than being one —
                  same reason as the User Management tables. */}
              <AlertDialogTrigger
                className={cx(
                  buttonStyles.common.root,
                  buttonStyles.sizes.xs.root,
                  buttonStyles.colors["secondary-destructive"].root
                )}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {cascadeNote} Nothing is reported against a deleted level, so every
                    figure above it changes. You can restore it right after.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {/* Close, not Action: the panel survives the delete — it
                      re-renders as the parent level — so the dialog's own subtree
                      would sit there open. */}
                  <AlertDialogClose variant="destructive" onClick={remove}>
                    Delete
                  </AlertDialogClose>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <span className="sf-panel-note">Pick a school to edit it</span>
        )}
      </div>

      <dl className="sf-field-grid">
        {fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>

      <div className="sf-node-foot">
        <span className="sf-panel-note">Seats filled</span>
        <SeatMeter seats={seats} size="panel" />
      </div>
    </div>
  );
}
