"use client";

import { useReportFilters } from "@/lib/filters";
import { studentProgressRows } from "@/lib/data/reporting";
import { REPORTS } from "@/lib/data/salesforce";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopeBreadcrumb } from "@/components/reporting/ScopeBreadcrumb";

export default function StudentProgressPage() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade, section: filters.section };
  const rows = studentProgressRows(scope);

  return (
    <>
      <ScopeBreadcrumb />

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Student progress rollups</h2>
          <span className="sf-panel-note">
            Cohort rollups — open Student 360 from the Student Attendance report for individuals
          </span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No cohorts in this scope"
            message="Widen the filters above to see student progress rollups."
          />
        ) : (
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">Cohort</th>
                <th scope="col">Goals on track</th>
                <th scope="col">Goals at risk</th>
                <th scope="col">Avg. attendance</th>
                <th scope="col">Students</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.cohort}</td>
                  <td>{row.goalsOnTrack}%</td>
                  <td>{row.goalsAtRisk}%</td>
                  <td>{row.avgAttendance.toFixed(1)}%</td>
                  <td>{row.students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="dual-stamp">
          <FreshnessStamp
            asOf={REPORTS.goalCompletion.asOf}
            report={REPORTS.goalCompletion.name}
            note="Goal rollups"
          />
          <FreshnessStamp
            asOf={REPORTS.attendanceRate.asOf}
            report={REPORTS.attendanceRate.name}
            note="Attendance rollups"
          />
        </div>
      </div>
    </>
  );
}
