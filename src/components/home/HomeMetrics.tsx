"use client";

import { BarChartCard } from "@/components/reporting/BarChartCard";
import { StatCard } from "@/components/home/charts/StatCard";
import { TrendLineCard } from "@/components/home/charts/TrendLineCard";
import { REPORTS } from "@/lib/data/salesforce";
import { coreMetricsForScope, trendSeriesForMetric } from "@/lib/data/reporting";
import {
  distributionTitle,
  scopedDistribution,
  scopedFacultyCount,
  scopedRatioRows,
  scopedStudentCount
} from "@/lib/data/homeScope";
import { atRiskStudents } from "@/lib/data/dashboard";
import {
  STUDENT_COUNT_BY_SCHOOL_ASOF,
  TEACHER_STUDENT_RATIO_ASOF,
  attendanceRateBySchoolBars,
  studentsByGradeBandBars
} from "@/lib/data/homeDashboardCharts";
import { useReportFilters } from "@/lib/filters";

/**
 * Five plain KPI tiles, then three grouped rows — Enrollment, Trends,
 * Staffing — each led by a section label so a Super Admin's eye lands on one
 * theme at a time during the morning scan.
 *
 * Every scopeable card reads the page's filter bar via the URL (school/grade),
 * same rule the previous version of this page established: a filter per card
 * would let two adjacent cards silently disagree about which population
 * they're describing. Two things stay district-wide regardless of scope —
 * At-Risk Students (no per-school at-risk breakdown exists yet) and Students
 * by Grade Band (a structural rollup, not a population the school filter
 * narrows) — each noted at its own card below.
 *
 * No card here carries a week-over-week delta or a "vs. last week" chip: the
 * brief was explicit that this reads as more precision than the data backs.
 * Where TrendStatCard's badge used to say "+2.3 pts", the trend line itself —
 * still visible, still real — is now the whole story.
 */
export function HomeMetrics() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade };
  // Reporting's scope shape carries a section too; Home never narrows that far.
  const rateScope = { ...scope, section: null };
  const rates = coreMetricsForScope(rateScope);

  const students = scopedStudentCount(scope);
  const faculty = scopedFacultyCount(scope);
  const studentsPerFaculty = faculty > 0 ? Math.round((students / faculty) * 10) / 10 : 0;

  const distributionBars = scopedDistribution(scope).map((slice) => ({
    label: slice.label,
    rows: [{ label: "Students", value: slice.value, colorIndex: 0 }]
  }));

  const staffingBars = scopedRatioRows(scope).map((row) => ({
    label: row.school,
    rows: [
      { label: "Students", value: row.students, colorIndex: 0 },
      { label: "Faculty", value: row.teachers, colorIndex: 1 }
    ]
  }));

  return (
    <>
      <div className="sf-home-stat-row">
        <StatCard title="Students" value={students} asOf={REPORTS.numberOfStudents.asOf} />

        <StatCard title="Faculty" value={faculty} asOf={REPORTS.totalFaculty.asOf} />

        <StatCard
          title="Students per Faculty"
          value={studentsPerFaculty}
          asOf={REPORTS.numberOfStudents.asOf}
        />

        <StatCard title="Attendance Rate" value={rates[0].value} asOf={REPORTS.attendanceRate.asOf} />

        {/* District-wide regardless of scope — there's no per-school at-risk
            breakdown in the mock data yet, only the district total Reporting &
            Analytics' Students' Status funnel also shows. */}
        <StatCard title="At-Risk Students" value={atRiskStudents} asOf={REPORTS.studentsStatus.asOf} />
      </div>

      <div className="sf-card-grid">
        <h2 className="sf-grid-section-title">Enrollment</h2>

        {/* Same drill-down rule as the old Distribution Donut this replaced:
            schools district-wide, grades once a school is picked — see
            distributionTitle/scopedDistribution in homeScope.ts. */}
        <BarChartCard
          title={distributionTitle(scope)}
          groups={distributionBars}
          series={[{ label: "Students", colorIndex: 0 }]}
          labelWidth={160}
          asOf={STUDENT_COUNT_BY_SCHOOL_ASOF}
          className="sf-col-6"
        />

        {/* Always district-wide: grade bands (Elementary/Middle/High) are a
            structural rollup of which schools serve which grades, not a
            population the school filter narrows the way a headcount is. */}
        <BarChartCard
          title="Students by Grade Band"
          groups={studentsByGradeBandBars}
          series={[{ label: "Students", colorIndex: 1 }]}
          labelWidth={160}
          asOf={REPORTS.numberOfStudents.asOf}
          className="sf-col-6"
        />

        <h2 className="sf-grid-section-title">Trends</h2>

        <TrendLineCard
          title="Attendance Rate"
          series={trendSeriesForMetric("attendance-rate", rateScope)}
          asOf={REPORTS.attendanceRate.asOf}
          className="sf-col-6"
        />

        {/* Always every school, regardless of scope — a "by school" comparison
            has nothing left to compare once the filter narrows to one. */}
        <BarChartCard
          title="Attendance Rate by School"
          groups={attendanceRateBySchoolBars}
          series={[{ label: "Attendance rate", colorIndex: 0 }]}
          labelWidth={160}
          asOf={REPORTS.attendanceRate.asOf}
          hint="Illustrative — not yet broken down by school in Genesis"
          className="sf-col-6"
        />

        <h2 className="sf-grid-section-title">Staffing</h2>

        {/* Same drill-down as Enrollment above: schools, then grades within a
            picked school — scopedRatioRows relabels each row accordingly. */}
        <BarChartCard
          title="Students & Faculty by School"
          groups={staffingBars}
          series={[
            { label: "Students", colorIndex: 0 },
            { label: "Faculty", colorIndex: 1 }
          ]}
          orientation="horizontal"
          labelWidth={160}
          asOf={TEACHER_STUDENT_RATIO_ASOF}
          className="sf-col-12"
        />
      </div>
    </>
  );
}
