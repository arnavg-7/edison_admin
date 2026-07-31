"use client";

import { useState } from "react";
import { useReportFilters } from "@/lib/filters";
import { facultyClassRows, studentProgressRows } from "@/lib/data/reporting";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopeBreadcrumb } from "@/components/reporting/ScopeBreadcrumb";

type ReportType = "student-progress" | "faculty-performance";

const COLUMNS: Record<ReportType, { key: string; label: string }[]> = {
  "student-progress": [
    { key: "cohort", label: "Cohort" },
    { key: "goalsOnTrack", label: "Goals on track" },
    { key: "goalsAtRisk", label: "Goals at risk" },
    { key: "avgAttendance", label: "Avg. attendance" },
    { key: "students", label: "Students" }
  ],
  "faculty-performance": [
    { key: "className", label: "Class" },
    { key: "teacher", label: "Teacher" },
    { key: "avgAttendance", label: "Avg. attendance" },
    { key: "assignmentCompletion", label: "Assignment completion" },
    { key: "rosterSize", label: "Roster" },
    { key: "openAlerts", label: "Open alerts" }
  ]
};

function formatCell(value: unknown): string {
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }
  return String(value ?? "");
}

/**
 * Ad hoc view over the two named report types — deliberately reads the same
 * data as Student Progress and Faculty Class Performance rather than a separate
 * raw data layer, so a custom report can never disagree with the named one.
 */
export default function CustomReportPage() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade, section: filters.section };

  const [reportType, setReportType] = useState<ReportType>("student-progress");
  const [selected, setSelected] = useState<string[]>(
    COLUMNS["student-progress"].map((column) => column.key)
  );

  const rows: Record<string, unknown>[] =
    reportType === "student-progress"
      ? (studentProgressRows(scope) as unknown as Record<string, unknown>[])
      : (facultyClassRows(scope) as unknown as Record<string, unknown>[]);

  const availableColumns = COLUMNS[reportType];
  const activeColumns = availableColumns.filter((column) => selected.includes(column.key));

  const changeType = (next: ReportType) => {
    setReportType(next);
    setSelected(COLUMNS[next].map((column) => column.key));
  };

  const toggleColumn = (key: string) => {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const exportCsv = () => {
    const header = activeColumns.map((column) => column.label).join(",");
    const body = rows
      .map((row) => activeColumns.map((column) => `"${formatCell(row[column.key])}"`).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ScopeBreadcrumb />

      <div className="admin-content-panel">
        <h2>Build a report</h2>
        <p className="builder-note">
          Starts from your current filter scope and reads the same data as the named reports.
        </p>

        <div className="builder-controls">
          <label className="filter-field">
            <span>Report type</span>
            <select value={reportType} onChange={(event) => changeType(event.target.value as ReportType)}>
              <option value="student-progress">Student progress</option>
              <option value="faculty-performance">Faculty class performance</option>
            </select>
          </label>

          <fieldset className="builder-columns">
            <legend>Columns</legend>
            {availableColumns.map((column) => (
              <label key={column.key} className="builder-checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(column.key)}
                  onChange={() => toggleColumn(column.key)}
                />
                {column.label}
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            className="btn btn--primary"
            onClick={exportCsv}
            disabled={activeColumns.length === 0 || rows.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Preview</h2>
          <span className="config-status-summary">{rows.length} rows</span>
        </div>

        {activeColumns.length === 0 ? (
          <EmptyState title="No columns selected" message="Pick at least one column to preview." />
        ) : rows.length === 0 ? (
          <EmptyState title="No rows in this scope" message="Widen the filters above." />
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {activeColumns.map((column) => (
                  <th scope="col" key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)}>
                  {activeColumns.map((column) => (
                    <td key={column.key}>{formatCell(row[column.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="dual-stamp">
          <FreshnessStamp asOf="2026-07-31T06:15:00-04:00" source="genesis" cadence="Attendance" />
          <FreshnessStamp asOf="2026-07-31T12:47:00-04:00" source="classroom" cadence="Assignments" />
          <FreshnessStamp asOf="2026-07-31T13:02:00-04:00" source="admin_db" cadence="Goals & alerts" />
        </div>
      </div>
    </>
  );
}
