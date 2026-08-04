import { DistributionDonutCard } from "@/components/home/charts/DistributionDonutCard";
import { RatioBarCard } from "@/components/home/charts/RatioBarCard";
import { StatCard } from "@/components/home/charts/StatCard";
import { TrendStatCard } from "@/components/home/charts/TrendStatCard";
import { REPORTS } from "@/lib/data/salesforce";
import { coreMetrics, numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import {
  STUDENT_COUNT_BY_SCHOOL_ASOF,
  TEACHER_STUDENT_RATIO_ASOF,
  TEACHER_STUDENT_RATIO_TARGET,
  studentCountBySchoolDistribution,
  teacherStudentRatioBySchool
} from "@/lib/data/homeDashboardCharts";

/**
 * Enrollment/staffing, distribution and academic performance grouped into
 * rows instead of one flat interleaved grid, so a Super Admin's eye lands on
 * one theme at a time during the morning scan rather than jumping between
 * unrelated figures.
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
  return (
    <div className="sf-card-grid">
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

      {/* The two per-school breakdowns sit side by side rather than stacked:
          they answer the same question ("how is the district distributed across
          schools?") from two angles, and reading them together beats scrolling
          one past the other. Both drop to full width below the grid's
          single-column breakpoint, where the ratio chart gets its room back. */}
      <RatioBarCard
        title="Teacher-Student Ratio"
        schools={teacherStudentRatioBySchool}
        asOf={TEACHER_STUDENT_RATIO_ASOF}
        target={TEACHER_STUDENT_RATIO_TARGET}
        className="sf-col-6"
      />

      <DistributionDonutCard
        title="Student Count By School"
        data={studentCountBySchoolDistribution}
        asOf={STUDENT_COUNT_BY_SCHOOL_ASOF}
        totalLabel="Students"
        className="sf-col-6"
      />

      <TrendStatCard
        title="Attendance Rate"
        value={coreMetrics[0].value}
        delta={coreMetrics[0].trend.replace(/^[-+]/, "")}
        direction="down"
        series={[93.4, 92.8, 93.1, 92.2, 92.9, 92.5, 92.4]}
        asOf={REPORTS.attendanceRate.asOf}
        className="sf-col-4"
      />

      <TrendStatCard
        title="Goal Completion %"
        value={coreMetrics[1].value}
        delta={coreMetrics[1].trend.replace(/^[-+]/, "")}
        direction="up"
        series={[63.2, 64.1, 65.0, 65.4, 66.8, 67.2, 68.1]}
        asOf={REPORTS.goalCompletion.asOf}
        className="sf-col-4"
      />

      <TrendStatCard
        title="Assignment Completion Rate"
        value={coreMetrics[2].value}
        delta={coreMetrics[2].trend.replace(/^[-+]/, "")}
        direction="up"
        series={[82.1, 82.9, 83.4, 83.1, 84.0, 84.4, 84.7]}
        asOf={REPORTS.assignmentCompletion.asOf}
        className="sf-col-4"
      />
    </div>
  );
}
