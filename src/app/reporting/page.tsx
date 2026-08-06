"use client";

import { StatCard } from "@/components/home/charts/StatCard";
import { TrendStatCard } from "@/components/home/charts/TrendStatCard";
import { RatioBarCard } from "@/components/home/charts/RatioBarCard";
import { BarChartCard } from "@/components/reporting/BarChartCard";
import { REPORTS } from "@/lib/data/salesforce";
import { assignmentSubmissions, numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import {
  TEACHER_STUDENT_RATIO_ASOF,
  TEACHER_STUDENT_RATIO_TARGET,
  teacherStudentRatioBySchool
} from "@/lib/data/homeDashboardCharts";

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
    <div className="sf-card-grid">
      <TrendStatCard
        title="Attendance Rate"
        value="92.4%"
        series={[93.4, 92.8, 93.1, 92.2, 92.9, 92.5, 92.4]}
        asOf={REPORTS.attendanceRate.asOf}
        className="sf-col-4"
      />
      <TrendStatCard
        title="Goal Completion %"
        value="68.1%"
        series={[63.2, 64.1, 65.0, 65.4, 66.8, 67.2, 68.1]}
        asOf={REPORTS.goalCompletion.asOf}
        className="sf-col-4"
      />
      <TrendStatCard
        title="Assignment Completion Rate"
        value="84.7%"
        series={[82.1, 82.9, 83.4, 83.1, 84.0, 84.4, 84.7]}
        asOf={REPORTS.assignmentCompletion.asOf}
        className="sf-col-4"
      />

      <StatCard
        title="Number of Students"
        value={numberOfStudents}
        asOf={REPORTS.numberOfStudents.asOf}
        className="sf-col-6"
      />

      <StatCard
        title="Total Faculty"
        value={totalFaculty}
        asOf={REPORTS.totalFaculty.asOf}
        className="sf-col-6"
      />

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
        series={[{ label: "Submissions", colorIndex: 0 }]}
        labelWidth={110}
        asOf={REPORTS.assignmentSubmissions.asOf}
        className="sf-col-6"
      />

    </div>
  );
}
