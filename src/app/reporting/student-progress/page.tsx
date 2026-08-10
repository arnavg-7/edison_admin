"use client";

import { useReportFilters } from "@/lib/filters";
import { studentProgressRows } from "@/lib/data/reporting";
import { REPORTS } from "@/lib/data/salesforce";
import {
  ATTENDANCE_SERIES,
  GRADE_SERIES,
  studentAttendance,
  studentAttendanceBySchool,
  studentsByGrade,
  studentsStatus
} from "@/lib/data/dashboard";
import {
  STUDENT_COUNT_BY_SCHOOL_ASOF,
  studentCountBySchoolDistribution
} from "@/lib/data/homeDashboardCharts";
import { DistributionDonutCard } from "@/components/home/charts/DistributionDonutCard";
import { StatusFunnelCard } from "@/components/reporting/StatusFunnelCard";
import { BarChartCard } from "@/components/reporting/BarChartCard";
import { FreshnessStamp } from "@/components/shared/FreshnessStamp";
import { EmptyState } from "@/components/shared/EmptyState";
import { ScopeBreadcrumb } from "@/components/reporting/ScopeBreadcrumb";
import type { BarGroup } from "@/components/sf/charts";

/**
 * Every student-subject card lives here rather than on the Metrics catalog:
 * this is the tab an admin opens when the question is about students, so the
 * cards and the cohort rollups belong on one screen. Metrics keeps the
 * district- and faculty-level figures.
 */
export default function StudentProgressPage() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade, section: filters.section };
  const rows = studentProgressRows(scope);

  /**
   * Individual-level attendance. v2 reverses v1's class-level ceiling, so each
   * contact links through to their Student 360 profile.
   */
  const attendanceGroups: BarGroup[] = studentAttendance.map((row) => ({
    label: row.contact,
    href: `/people/student/${row.contactId}`,
    rows: [
      { label: "Present", value: row.present, colorIndex: 0 },
      { label: "Absent", value: row.absent, colorIndex: 1 },
      ...(row.halfDay > 0
        ? [{ label: "Attended half a day", value: row.halfDay, colorIndex: 2 }]
        : [])
    ]
  }));

  return (
    <>
      <ScopeBreadcrumb />

      {/*
        The two distributions side by side, then the cohort rollup table, then
        the coarse-to-fine detail charts — the order an admin narrows in.

        A "Number of Students" stat card led this row and was removed: the donut
        beside it already prints 1,702 in the middle of its ring, so the card
        restated its neighbour's centre label across half the screen. The two
        breakdowns of that same figure — by school and by status — are what this
        row is for, and they read better against each other than either did
        against a number both of them already total to.
      */}
      <div className="sf-card-grid">
        <DistributionDonutCard
          title="Student Count By School"
          data={studentCountBySchoolDistribution}
          asOf={STUDENT_COUNT_BY_SCHOOL_ASOF}
          totalLabel="Students"
          className="sf-col-6"
        />

        <StatusFunnelCard
          title="Students' Status"
          data={studentsStatus}
          asOf={REPORTS.studentsStatus.asOf}
          totalLabel="Students"
          className="sf-col-6"
        />
      </div>

      <div className="sf-panel">
        <div className="sf-panel-head">
          <h2>Student progress rollups</h2>
          <span className="sf-panel-note">
            Cohort rollups: open Student 360 from the Student Attendance report for individuals
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

      {/*
        The three detail charts sit side by side (col-4) rather than stacked
        full-width: they're read against each other — the same attendance story
        by grade, by school, then by student — and three full-width rows put two
        of them off-screen. The label column narrows to pay for it (names
        truncate with an ellipsis and stay whole in the tooltip), and below
        900px the grid drops all three back to one per row.
      */}
      <div className="sf-card-grid">
        <BarChartCard
          title="Students By Grade"
          groups={studentsByGrade}
          categoryHeader="School"
          series={GRADE_SERIES}
          labelWidth={110}
          asOf={REPORTS.studentsByGrade.asOf}
          className="sf-col-4"
        />

        <BarChartCard
          title="Student Attendance By School"
          groups={studentAttendanceBySchool}
          categoryHeader="School"
          series={ATTENDANCE_SERIES}
          labelWidth={110}
          asOf={REPORTS.studentAttendanceBySchool.asOf}
          className="sf-col-4"
        />

        <BarChartCard
          title="Student Attendance"
          groups={attendanceGroups}
          categoryHeader="Student"
          series={ATTENDANCE_SERIES}
          labelWidth={100}
          asOf={REPORTS.studentAttendance.asOf}
          className="sf-col-4"
        />
      </div>
    </>
  );
}
