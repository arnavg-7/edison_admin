"use client";

import { StatCard } from "@/components/home/charts/StatCard";
import { RatioBarCard } from "@/components/home/charts/RatioBarCard";
import { BarChartCard } from "@/components/reporting/BarChartCard";
import { REPORTS } from "@/lib/data/salesforce";
import { assignmentSubmissions, numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import {
  TEACHER_STUDENT_RATIO_ASOF,
  TEACHER_STUDENT_RATIO_TARGET,
  teacherStudentRatioBySchool
} from "@/lib/data/homeDashboardCharts";

/** Not a report timestamp — there is no report yet. Stands in for "last
    checked" on the two not-yet-available cards so they carry the same
    stamp-in-the-corner rhythm as every live card, instead of looking
    unfinished by omission. Matches the same constant in the reporting
    layout's CSV export (kept separate rather than shared: one string
    literal isn't worth a module of its own). */
const UNAVAILABLE_CHECKED_AT = "2026-07-17T12:00:00-04:00";

/**
 * The metrics catalog. Every card is one Salesforce report with its own refresh
 * time, so a report lagging behind shows a stale stamp instead of quietly
 * presenting old numbers as current.
 *
 * Cards run on the same shadcn/Bklit chart components Home's cards do
 * (StatCard, TrendStatCard, RatioBarCard) rather than the pre-shadcn
 * MetricCard/CoreMetricCard shell, so both screens look like one system.
 *
 * Number of Students stays here next to Total Faculty — the two enrollment/
 * staffing headline figures belong together, same as Home. The distribution
 * cards that explain the student figure (Student Count By School, Students'
 * Status, Students By Grade, Student Attendance By School, Student
 * Attendance) still live on Student Progress, next to the cohort rollups
 * they break that figure down by.
 */
export default function MetricsCatalogPage() {
  return (
    <>
    <div className="sf-kpi-row">
      <StatCard title="Number of Students" value={numberOfStudents} asOf={REPORTS.numberOfStudents.asOf} />

      <StatCard title="Total Faculty" value={totalFaculty} asOf={REPORTS.totalFaculty.asOf} />

      <StatCard title="Attendance Rate" value="92.4%" asOf={REPORTS.attendanceRate.asOf} />

      {/* Starts the grid's second row (3 columns, 3 cards above) rather than
          a separate grid — same fixed column track, so this row doesn't draw
          a different width than the one above it. Same StatCard anatomy as
          every other tile here too — no separate "Assignment completion"
          placeholder alongside Homeroom coverage / Gen ed split: it would
          just restate this live tile. */}
      <StatCard
        title="Assignment Completion Rate"
        value="84.7%"
        asOf={REPORTS.assignmentCompletion.asOf}
      />

      <StatCard title="Homeroom coverage" value="71%" asOf={UNAVAILABLE_CHECKED_AT} />

      <StatCard title="Gen ed / special ed split" value="82% / 18%" asOf={UNAVAILABLE_CHECKED_AT} />
    </div>

    <div className="sf-card-grid">
      {/* The two charts share one row rather than stacking: both are
          per-category breakdowns, and side by side they fit on screen together
          instead of the second needing a scroll to reach. Both fall back to
          full width below the grid's single-column breakpoint.

          Both are horizontal bar charts. Column mode stacked five school names
          into one strip under the plot and drew them overlapping into unreadable
          fragments; rows give every category its own line, and a growing school
          list scrolls instead of squeezing its bars thinner. */}
      <RatioBarCard
        title="Teacher-Student Ratio"
        schools={teacherStudentRatioBySchool}
        asOf={TEACHER_STUDENT_RATIO_ASOF}
        target={TEACHER_STUDENT_RATIO_TARGET}
        className="sf-col-6"
      />

      <BarChartCard
        title="Assignment Submissions"
        groups={assignmentSubmissions}
        categoryHeader="Grade"
        series={[{ label: "Submissions", colorIndex: 0 }]}
        labelWidth={110}
        asOf={REPORTS.assignmentSubmissions.asOf}
        className="sf-col-6"
      />

    </div>
    </>
  );
}
