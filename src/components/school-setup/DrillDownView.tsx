"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Upload03Icon } from "@hugeicons/core-free-icons";
import {
  SCHOOL_LEVEL_LABELS,
  batchCount,
  batchYears,
  gradeSeats,
  schoolSeats,
  setupMark,
  type Seats,
  type SetupSchool
} from "@/lib/data/schoolSetup";
import { useSchoolSetup } from "@/lib/school-setup-store";
import { useAdminScope } from "@/lib/admin-scope";
import { useSetupSelection } from "@/lib/school-setup-selection";
import { Button } from "@/components/base/buttons/button";
import { Combobox, type ComboboxOption } from "@/components/shared/Combobox";
import { EmptyState } from "@/components/shared/EmptyState";
import { SeatMeter } from "./SeatMeter";
import { SetupDetailPanel } from "./SetupDetailPanel";
import { SetupImportDrawer } from "./SetupImportDrawer";
import { SetupNodeModal, type SetupModalRequest } from "./SetupNodeModal";
import { UndoNotice } from "./UndoNotice";

type ChildRow = {
  id: string;
  name: string;
  /** Row mark — a school's code, a grade's number, a batch's letter. */
  mark: string;
  sub: string;
  cells: React.ReactNode[];
  seats: Seats;
  onOpen: () => void;
};

/** Every level a query can hit, so filtering a school list can match on a batch. */
function schoolMatches(school: SetupSchool, term: string): boolean {
  const haystack = [
    school.name,
    school.code,
    school.principal,
    school.city,
    SCHOOL_LEVEL_LABELS[school.level],
    ...school.grades.flatMap((grade) => [
      grade.name,
      grade.stream,
      grade.lead,
      ...grade.batches.map((batch) => `${batch.name} ${batch.year}`)
    ])
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

/**
 * One level at a time: the node you are on, then a table of what sits directly
 * under it. The same shape as Skills & Development's school → grade walk, and the
 * same reason — a hierarchy four levels deep is easier to reason about as a
 * sequence of single lists than as one nested tree.
 *
 * The reference flow paired this with a segmented Drill-down / Columns switch;
 * here that becomes the app's routed SectionTabs (see the section layout), so both
 * views are real URLs and the selection travels between them.
 */
export function DrillDownView() {
  const { district } = useSchoolSetup();
  /* A school admin does not do master setup: the root list holds their school
     alone and offers no "add school", because adding one — and deleting one,
     which the detail panel handles — is the district's to do. Everything below
     the school is theirs and behaves exactly as it does for the district. */
  const { schoolId } = useAdminScope();
  const { school, grade, batch, kind, query, year, select } = useSetupSelection();
  const [modal, setModal] = useState<SetupModalRequest | null>(null);
  const [importing, setImporting] = useState(false);

  const term = query.trim().toLowerCase();

  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: district.name, onClick: school ? () => select({ school: null }) : undefined }
  ];
  if (school) {
    crumbs.push({ label: school.name, onClick: grade ? () => select({ grade: null }) : undefined });
  }
  if (grade) {
    crumbs.push({ label: grade.name, onClick: batch ? () => select({ batch: null }) : undefined });
  }
  if (batch) crumbs.push({ label: batch.name });

  /** The table below the detail panel: what sits one level under the selection. */
  const child: {
    heading: string;
    noun: string;
    singular: string;
    head: string[];
    rows: ChildRow[];
    total: number;
    add: SetupModalRequest | null;
    emptyMessage: string;
  } = (() => {
    if (kind === "school" && school) {
      return {
        heading: `Grades in ${school.name}`,
        noun: "grades",
        singular: "grade",
        head: ["Grade", "Curriculum", "Grade lead", "Batches", "Students", "Seats filled"],
        total: school.grades.length,
        add: { mode: "add", kind: "grade", school },
        emptyMessage: `No grades in ${school.name} yet. Add a grade, then batches under it.`,
        rows: school.grades
          .filter(
            (entry) =>
              term === "" ||
              [entry.name, entry.stream, entry.lead].join(" ").toLowerCase().includes(term)
          )
          .map((entry) => {
            const seats = gradeSeats(entry);
            return {
              id: entry.id,
              name: entry.name,
              mark: setupMark(entry.name),
              sub: "",
              seats,
              cells: [
                entry.stream,
                entry.lead,
                entry.batches.length,
                seats.enrolled.toLocaleString()
              ],
              onOpen: () => select({ grade: entry.id })
            };
          })
      };
    }

    if (kind === "grade" && school && grade) {
      return {
        heading: `Batches in ${grade.name}`,
        noun: "batches",
        singular: "batch",
        head: ["Batch", "Year", "Capacity", "Enrolled", "Seats filled"],
        total: grade.batches.length,
        add: { mode: "add", kind: "batch", school, grade },
        emptyMessage:
          "No batches in this grade yet. Students enrol into batches, so add at least one.",
        rows: grade.batches
          .filter((entry) => year === "" || entry.year === year)
          .filter(
            (entry) => term === "" || `${entry.name} ${entry.year}`.toLowerCase().includes(term)
          )
          .map((entry) => ({
            id: entry.id,
            name: entry.name,
            mark: setupMark(entry.name),
            sub: "",
            seats: { enrolled: entry.enrolled, capacity: entry.capacity },
            cells: [entry.year, entry.capacity, entry.enrolled],
            onOpen: () => select({ batch: entry.id })
          }))
      };
    }

    const rootSchools = schoolId
      ? district.schools.filter((entry) => entry.id === schoolId)
      : district.schools;

    return {
      heading: schoolId ? "Your school" : `Schools in ${district.name}`,
      noun: "schools",
      singular: "school",
      head: ["School", "Level", "Principal", "Grades", "Batches", "Seats filled"],
      total: rootSchools.length,
      add: schoolId ? null : { mode: "add", kind: "school" },
      emptyMessage: schoolId
        ? "Your school is not in the district tree."
        : "Add the first school — every grade, batch and report hangs off it.",
      rows: rootSchools
        .filter((entry) => term === "" || schoolMatches(entry, term))
        .map((entry) => ({
          id: entry.id,
          name: entry.name,
          mark: entry.code,
          // The code is already the row's mark, so the second line carries the
          // one school field that has no column of its own.
          sub: entry.city,
          seats: schoolSeats(entry),
          cells: [
            SCHOOL_LEVEL_LABELS[entry.level],
            entry.principal,
            entry.grades.length,
            batchCount(entry)
          ],
          onOpen: () => select({ school: entry.id })
        }))
    };
  })();

  // Pulled out as a const so the narrowing survives into the click handlers.
  const addRequest = child.add;

  const years = grade ? batchYears(grade) : [];
  const yearOptions: ComboboxOption[] = [
    { value: "all", label: "All years" },
    ...years.map((entry) => ({ value: entry, label: entry }))
  ];

  return (
    <>
      <UndoNotice />

      {/* Nothing to trace at the root: a one-item trail is just the district name
          a second time, and the detail panel below already carries it. */}
      {crumbs.length > 1 ? (
        <nav className="sf-crumbs" aria-label="Hierarchy">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="sf-crumb">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.onClick ? (
                <button type="button" onClick={crumb.onClick}>
                  {crumb.label}
                </button>
              ) : (
                <span aria-current="true">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <SetupDetailPanel onEdit={setModal} />

      {/* Below the detail card and immediately above the list, because that is
          the only thing it filters. Above the card it read as a search over the
          whole screen, and sat between the breadcrumb and the record the
          breadcrumb had just led you to. Hidden on a batch, which has no list
          under it to narrow. */}
      {kind === "batch" ? null : (
        <div className="sf-filter-bar sf-filter-bar--flush sf-filter-bar--top-spaced">
          <label className="sf-field sf-field--search">
            <span>Search</span>
            <input
              type="search"
              value={query}
              placeholder="School, grade or batch"
              onChange={(event) => select({ query: event.target.value })}
            />
          </label>

          {/* Only at grade level: a batch year filter is a filter over one grade's
              batch list, and above that it would be filtering rows that don't
              carry a year. */}
          {kind === "grade" && years.length > 1 ? (
            <label className="sf-field">
              <span>Batch year</span>
              <Combobox
                options={yearOptions}
                value={year === "" ? "all" : year}
                onChange={(next) => select({ year: next === "all" ? null : next })}
                placeholder="All years"
              />
            </label>
          ) : null}

          <p className="sf-filter-note">
            {child.rows.length} of {child.total} {child.noun}
          </p>
        </div>
      )}

      {kind === "batch" ? (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>Enrollment</h2>
            <span className="sf-panel-note">Nothing sits below a batch</span>
          </div>
          <p className="sf-card-hint">
            A batch is the lowest level of the hierarchy — students are enrolled here, and
            enrollment syncs in from Genesis rather than being edited on this screen. Its roster
            lives in <Link className="sf-inline-link" href="/people">Student &amp; Faculty 360</Link>.
          </p>
        </div>
      ) : (
        <div className="sf-panel">
          <div className="sf-panel-head">
            <h2>{child.heading}</h2>
            {/* Beside the single-record action, because they answer the same
                question — "how do I get records in here?" — one at a time or a
                spreadsheet at a time. The CSV reaches the whole hierarchy, not
                just this level; the drawer says so. */}
            <div className="sf-row-actions">
              <Button
                color="secondary"
                size="xs"
                onClick={() => setImporting(true)}
                iconLeading={<HugeiconsIcon icon={Upload03Icon} size={16} strokeWidth={2} />}
              >
                Add CSV
              </Button>
              {addRequest ? (
                <Button
                  color="secondary"
                  size="xs"
                  onClick={() => setModal(addRequest)}
                  iconLeading={<HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2.4} />}
                >
                  Add {child.singular}
                </Button>
              ) : null}
            </div>
          </div>

          {child.rows.length === 0 ? (
            <EmptyState
              title={child.total === 0 ? `No ${child.noun} yet` : `No matching ${child.noun}`}
              message={
                child.total === 0
                  ? child.emptyMessage
                  : "Try a different search term, or clear the filters above."
              }
              action={
                child.total === 0 && addRequest ? (
                  <Button size="sm" onClick={() => setModal(addRequest)}>
                    Add {child.singular}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="sf-table-wrap">
              <table className="sf-table">
                <thead>
                  <tr>
                    {child.head.map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {child.rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="sf-node-cell">
                          <span className="sf-node-mark" aria-hidden="true">
                            {row.mark}
                          </span>
                          <span className="sf-node-cell-text">
                            {/* The name is the way in, as it is in Skills &
                                Development's tables — one affordance per row
                                rather than a link and a trailing chevron that
                                do the same thing. */}
                            <button
                              type="button"
                              className="sf-bar-group-link"
                              onClick={row.onOpen}
                            >
                              {row.name}
                            </button>
                            {row.sub ? <span className="sf-node-sub">{row.sub}</span> : null}
                          </span>
                        </span>
                      </td>
                      {row.cells.map((cell, index) => (
                        <td key={`${row.id}-${child.head[index + 1]}`}>{cell}</td>
                      ))}
                      <td>
                        <SeatMeter seats={row.seats} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal ? <SetupNodeModal request={modal} onClose={() => setModal(null)} /> : null}

      {importing ? <SetupImportDrawer onClose={() => setImporting(false)} /> : null}
    </>
  );
}
