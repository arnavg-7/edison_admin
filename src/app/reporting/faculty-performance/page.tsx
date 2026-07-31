"use client";

import { useReportFilters } from "@/lib/filters";
import { facultyClassRows } from "@/lib/data/reporting";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopeBreadcrumb } from "@/components/reporting/ScopeBreadcrumb";

export default function FacultyPerformancePage() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade, section: filters.section };
  const rows = facultyClassRows(scope);

  return (
    <>
      <ScopeBreadcrumb />

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Faculty class performance</h2>
          <span className="sf-panel-note">
            Rolls up to class level — no individual faculty profiles
          </span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No classes in this scope"
            message="Widen the filters above to see class performance."
          />
        ) : (
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Class</th>
                <th scope="col">Teacher</th>
                <th scope="col">Avg. attendance</th>
                <th scope="col">Assignment completion</th>
                <th scope="col">Roster</th>
                <th scope="col">Open alerts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.className}</td>
                  <td>{row.teacher}</td>
                  <td>{row.avgAttendance.toFixed(1)}%</td>
                  <td>{row.assignmentCompletion.toFixed(1)}%</td>
                  <td>{row.rosterSize}</td>
                  <td>
                    <StatusBadge tone={row.openAlerts > 2 ? "warn" : "neutral"}>
                      {row.openAlerts}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="dual-stamp">
          <FreshnessStamp
            asOf="2026-07-31T06:15:00-04:00"
            source="genesis"
            cadence="Attendance — once daily"
          />
          <FreshnessStamp
            asOf="2026-07-31T12:47:00-04:00"
            source="classroom"
            cadence="Assignments — near real-time"
          />
          <FreshnessStamp
            asOf="2026-07-31T13:02:00-04:00"
            source="admin_db"
            cadence="Alerts — immediate"
          />
        </div>
      </div>
    </>
  );
}
