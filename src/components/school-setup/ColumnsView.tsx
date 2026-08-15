"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Upload03Icon } from "@hugeicons/core-free-icons";
import {
  batchCount,
  gradeSeats,
  schoolSeats,
  seatsPct,
  setupMark,
  type SetupBatch,
  type SetupGrade,
  type SetupSchool
} from "@/lib/data/schoolSetup";
import { useSchoolSetup } from "@/lib/school-setup-store";
import { useSetupSelection } from "@/lib/school-setup-selection";
import { SetupDetailPanel } from "./SetupDetailPanel";
import { SetupImportDrawer } from "./SetupImportDrawer";
import { SetupNodeModal, type SetupModalRequest } from "./SetupNodeModal";
import { UndoNotice } from "./UndoNotice";

type ColumnRow = {
  id: string;
  name: string;
  /** Row mark — a school's code, a grade's number, a batch's letter. */
  mark: string;
  meta: string;
  /** Right-aligned marker: seat fill for a batch, a chevron for a parent level. */
  trail: string;
  trailTone?: "warn";
  selected: boolean;
  onSelect: () => void;
};

function Column({
  label,
  rows,
  emptyMessage,
  onAdd,
  addLabel,
  onImport
}: {
  label: string;
  rows: ColumnRow[];
  emptyMessage: string;
  /** Absent when the parent level isn't picked yet, so there is nothing to add to. */
  onAdd?: () => void;
  addLabel: string;
  /** Schools only — a CSV covers the whole hierarchy, so it needs one home. */
  onImport?: () => void;
}) {
  return (
    <div className="sf-column">
      <div className="sf-column-head">
        <span className="sf-column-label">{label}</span>
        <span className="sf-column-count">{rows.length}</span>
        {onImport ? (
          <button
            type="button"
            className="sf-icon-btn"
            onClick={onImport}
            aria-label="Add CSV"
            title="Add CSV"
          >
            <HugeiconsIcon icon={Upload03Icon} size={15} strokeWidth={2} />
          </button>
        ) : null}
        {onAdd ? (
          <button type="button" className="sf-icon-btn" onClick={onAdd} aria-label={addLabel}>
            <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={2.4} />
          </button>
        ) : null}
      </div>

      <div className="sf-column-list">
        {rows.length === 0 ? (
          <p className="sf-column-empty">{emptyMessage}</p>
        ) : (
          rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className={row.selected ? "sf-column-row is-selected" : "sf-column-row"}
              aria-current={row.selected ? "true" : undefined}
              onClick={row.onSelect}
            >
              <span className="sf-node-mark" aria-hidden="true">
                {row.mark}
              </span>
              <span className="sf-column-row-text">
                <span className="sf-column-row-name">{row.name}</span>
                <span className="sf-column-row-meta">{row.meta}</span>
              </span>
              <span
                className={
                  row.trailTone === "warn" ? "sf-column-row-trail is-warn" : "sf-column-row-trail"
                }
              >
                {row.trail}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Schools, grades and batches side by side — the whole path stays visible, so
 * "which grade of which school am I looking at" needs no breadcrumb and moving
 * between siblings is one click rather than up-then-down.
 *
 * Same selection and same detail panel as the Drill-down tab; only the navigation
 * differs, which is why the two are tabs over one URL rather than two screens.
 */
export function ColumnsView() {
  const { district } = useSchoolSetup();
  const { school, grade, batch, query, select } = useSetupSelection();
  const [modal, setModal] = useState<SetupModalRequest | null>(null);
  const [importing, setImporting] = useState(false);

  const term = query.trim().toLowerCase();
  const hit = (value: string) => value.toLowerCase().includes(term);

  // A school stays listed when the term matches anything beneath it, so a search
  // for a batch name doesn't empty the column you'd have to click through.
  const schoolRows: ColumnRow[] = district.schools
    .filter(
      (entry: SetupSchool) =>
        term === "" ||
        hit(`${entry.name} ${entry.code} ${entry.principal}`) ||
        entry.grades.some(
          (item) => hit(item.name) || item.batches.some((child) => hit(child.name))
        )
    )
    .map((entry) => {
      const seats = schoolSeats(entry);
      return {
        id: entry.id,
        name: entry.name,
        mark: entry.code,
        meta: `${entry.grades.length} grades · ${seats.enrolled.toLocaleString()} students`,
        trail: "›",
        selected: entry.id === school?.id,
        onSelect: () =>
          select({ school: entry.id, grade: entry.grades[0]?.id ?? null })
      };
    });

  const gradeRows: ColumnRow[] = (school?.grades ?? [])
    .filter(
      (entry: SetupGrade) =>
        term === "" ||
        hit(entry.name) ||
        hit(school?.name ?? "") ||
        entry.batches.some((child) => hit(child.name))
    )
    .map((entry) => {
      const seats = gradeSeats(entry);
      return {
        id: entry.id,
        name: entry.name,
        mark: setupMark(entry.name),
        meta: `${entry.batches.length} batches · ${seats.enrolled.toLocaleString()} students`,
        trail: "›",
        selected: entry.id === grade?.id,
        onSelect: () => select({ grade: entry.id })
      };
    });

  const batchRows: ColumnRow[] = (grade?.batches ?? [])
    .filter((entry: SetupBatch) => term === "" || hit(entry.name) || hit(grade?.name ?? ""))
    .map((entry) => {
      const pct = seatsPct({ enrolled: entry.enrolled, capacity: entry.capacity });
      return {
        id: entry.id,
        name: entry.name,
        mark: setupMark(entry.name),
        meta: entry.year,
        trail: `${entry.enrolled}/${entry.capacity}`,
        // A full batch is the one thing an admin has to act on from this list.
        trailTone: pct >= 100 ? ("warn" as const) : undefined,
        selected: entry.id === batch?.id,
        onSelect: () => select({ batch: entry.id })
      };
    });

  return (
    <>
      <UndoNotice />

      <div className="sf-filter-bar sf-filter-bar--flush">
        <label className="sf-field sf-field--search">
          <span>Search</span>
          <input
            type="search"
            value={query}
            placeholder="School, grade or batch"
            onChange={(event) => select({ query: event.target.value })}
          />
        </label>
        <p className="sf-filter-note">
          {schoolRows.length} schools · {gradeRows.length} grades · {batchRows.length} batches
        </p>
      </div>

      <div className="sf-panel sf-panel--flush">
        <div className="sf-columns">
          <Column
            label="Schools"
            rows={schoolRows}
            emptyMessage={term ? "No school matches this search." : "No schools yet."}
            onAdd={() => setModal({ mode: "add", kind: "school" })}
            addLabel="Add school"
            onImport={() => setImporting(true)}
          />
          <Column
            label="Grades"
            rows={gradeRows}
            emptyMessage={
              !school
                ? "Pick a school to see its grades."
                : term
                  ? "No grade matches this search."
                  : `No grades in ${school.name} yet.`
            }
            onAdd={school ? () => setModal({ mode: "add", kind: "grade", school }) : undefined}
            addLabel="Add grade"
          />
          <Column
            label="Batches"
            rows={batchRows}
            emptyMessage={
              !grade
                ? "Pick a grade to see its batches."
                : term
                  ? "No batch matches this search."
                  : `No batches in ${grade.name} yet.`
            }
            onAdd={
              school && grade
                ? () => setModal({ mode: "add", kind: "batch", school, grade })
                : undefined
            }
            addLabel="Add batch"
          />
        </div>
      </div>

      <SetupDetailPanel onEdit={setModal} />

      {modal ? <SetupNodeModal request={modal} onClose={() => setModal(null)} /> : null}

      {importing ? <SetupImportDrawer onClose={() => setImporting(false)} /> : null}
    </>
  );
}
