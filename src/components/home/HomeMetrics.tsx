"use client";

import { DistributionDonutCard } from "@/components/home/charts/DistributionDonutCard";
import { RatioBarCard } from "@/components/home/charts/RatioBarCard";
import { StatCard } from "@/components/home/charts/StatCard";
import { TrendStatCard } from "@/components/home/charts/TrendStatCard";
import { REPORTS } from "@/lib/data/salesforce";
import { coreMetricsForScope, trendSeriesForMetric } from "@/lib/data/reporting";
import {
  distributionTitle,
  scopedDistribution,
  scopedFacultyCount,
  scopedRatioRows,
  scopedStudentCount
} from "@/lib/data/homeScope";
import {
  STUDENT_COUNT_BY_SCHOOL_ASOF,
  TEACHER_STUDENT_RATIO_ASOF,
  TEACHER_STUDENT_RATIO_TARGET
} from "@/lib/data/homeDashboardCharts";
import { useReportFilters } from "@/lib/filters";

/**
 * Enrollment/staffing, distribution and academic performance grouped into
 * rows instead of one flat interleaved grid, so a Super Admin's eye lands on
 * one theme at a time during the morning scan rather than jumping between
 * unrelated figures.
 *
 * Every card reads one scope, taken from the page's filter bar via the URL.
 * The alternative — a filter per card — was rejected: these cards describe a
 * single population, so independent filters would let two adjacent cards
 * silently disagree about which population that is, and the page would stop
 * being readable as one picture.
 *
 * A "Students' Status" donut (On Track / At Risk / Unassigned) used to sit
 * beside Student Count By School and was removed, for three reasons:
 *
 *  1. It was already on Reporting & Analytics with identical figures, and Home
 *     is the curated set — the full catalog lives there (PRODUCT.md).
 *  2. Both donuts totalled 1,702 and both carried a slice labelled
 *     "Unassigned", worth 41 here and 12 there. Same label, same population,
 *     adjacent cards, different numbers — it read as a contradiction rather
 *     than as the two different things it actually meant (no status vs no
 *     school).
 *  3. Its "At Risk · 460" had nowhere to go. Needs Attention is Home's
 *     actionable surface and it lists individual flagged students, so the 460
 *     was a figure a Super Admin could read but not act on.
 */
export function HomeMetrics() {
  const { filters } = useReportFilters();
  const scope = { school: filters.school, grade: filters.grade };
  // Reporting's scope shape carries a section too; Home never narrows that far.
  const rateScope = { ...scope, section: null };
  const rates = coreMetricsForScope(rateScope);

  return (
    <div className="sf-card-grid">
      <StatCard
        title="Number of Students"
        value={scopedStudentCount(scope)}
        asOf={REPORTS.numberOfStudents.asOf}
        className="sf-col-6"
      />

      <StatCard
        title="Total Faculty"
        value={scopedFacultyCount(scope)}
        asOf={REPORTS.totalFaculty.asOf}
        className="sf-col-6"
      />

      {/* The two per-school breakdowns sit side by side rather than stacked:
          they answer the same question ("how is the district distributed across
          schools?") from two angles, and reading them together beats scrolling
          one past the other. Both drop to full width below the grid's
          single-column breakpoint, where the ratio chart gets its room back. */}
      <RatioBarCard
        title="Teacher-Student Ratio"
        schools={scopedRatioRows(scope)}
        asOf={TEACHER_STUDENT_RATIO_ASOF}
        target={TEACHER_STUDENT_RATIO_TARGET}
        className="sf-col-6"
      />

      <DistributionDonutCard
        title={distributionTitle(scope)}
        data={scopedDistribution(scope)}
        asOf={STUDENT_COUNT_BY_SCHOOL_ASOF}
        totalLabel="Students"
        className="sf-col-6"
      />

      <TrendStatCard
        title="Attendance Rate"
        value={rates[0].value}
        series={trendSeriesForMetric("attendance-rate", rateScope)}
        asOf={REPORTS.attendanceRate.asOf}
        className="sf-col-4"
      />

      <TrendStatCard
        title="Goal Completion %"
        value={rates[1].value}
        series={trendSeriesForMetric("goal-completion", rateScope)}
        asOf={REPORTS.goalCompletion.asOf}
        className="sf-col-4"
      />

      <TrendStatCard
        title="Assignment Completion Rate"
        value={rates[2].value}
        series={trendSeriesForMetric("assignment-completion", rateScope)}
        asOf={REPORTS.assignmentCompletion.asOf}
        className="sf-col-4"
      />
    </div>
  );
}
