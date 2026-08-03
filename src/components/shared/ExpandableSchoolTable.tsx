"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export type SchoolTableRow = {
  id: string;
  name: string;
  /** School page, still reachable by clicking the name. */
  href: string;
  /** Cells after the School column, in header order. */
  cells: React.ReactNode[];
  /** Grade breakdown revealed when the row is expanded. */
  detail: React.ReactNode;
};

/**
 * The school picker, with each row expandable to its grades in place.
 *
 * Expanding beats navigating here: an admin comparing "which grades still need
 * configuring" would otherwise open each school page in turn and lose the
 * comparison. The school name stays a link, so the drill-down path is intact.
 */
export function ExpandableSchoolTable({
  head,
  rows
}: {
  /** Includes the leading "School" column. */
  head: string[];
  rows: SchoolTableRow[];
}) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]
    );

  return (
    <div className="sf-table-wrap">
      {/* --expandable shares a column grid with .sf-subtable, so a grade row's
          name and Status line up under the school row's. */}
      <table className="sf-table sf-table--expandable">
        <thead>
          <tr>
            {head.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = expanded.includes(row.id);
            const detailId = `${row.id}-grades`;

            // A Fragment keeps the row and its detail row as siblings inside
            // <tbody>, which a wrapper element would not allow.
            return (
              <Fragment key={row.id}>
                <tr>
                  <td>
                    <div className="sf-row-expander">
                      <button
                        type="button"
                        className={isOpen ? "sf-row-toggle is-open" : "sf-row-toggle"}
                        aria-expanded={isOpen}
                        aria-controls={detailId}
                        onClick={() => toggle(row.id)}
                      >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
                        <span className="sf-sr-only">
                          {isOpen ? `Hide grades for ${row.name}` : `Show grades for ${row.name}`}
                        </span>
                      </button>
                      <Link className="sf-bar-group-link" href={row.href}>
                        {row.name}
                      </Link>
                    </div>
                  </td>
                  {row.cells.map((cell, index) => (
                    <td key={index}>{cell}</td>
                  ))}
                </tr>

                {isOpen ? (
                  <tr className="sf-subrow" id={detailId}>
                    <td colSpan={head.length}>{row.detail}</td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The nested grade table inside an expanded school row. */
export function GradeDetailTable({
  head,
  rows
}: {
  head: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  if (rows.length === 0) {
    return <p className="sf-subrow-empty">This school has no grades on record.</p>;
  }

  return (
    <table className="sf-subtable">
      <thead>
        <tr>
          {head.map((label) => (
            <th key={label} scope="col">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, index) => (
              <td key={index}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
