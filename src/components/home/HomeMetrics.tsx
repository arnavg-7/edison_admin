import { DistributionDonutCard } from "@/components/home/charts/DistributionDonutCard";
import { RatioBarCard } from "@/components/home/charts/RatioBarCard";
import { StatCard } from "@/components/home/charts/StatCard";
import { TrendStatCard } from "@/components/home/charts/TrendStatCard";
import { REPORTS } from "@/lib/data/salesforce";
import { coreMetrics, numberOfStudents, totalFaculty } from "@/lib/data/dashboard";
import {
  STUDENTS_STATUS_ASOF,
  STUDENT_COUNT_BY_SCHOOL_ASOF,
  TEACHER_STUDENT_RATIO_ASOF,
  TEACHER_STUDENT_RATIO_TARGET,
  studentCountBySchoolDistribution,
  studentsStatusDistribution,
  teacherStudentRatioBySchool
} from "@/lib/data/homeDashboardCharts";

/**
 * Enrollment/staffing, distribution and academic performance grouped into
 * three rows instead of one flat interleaved grid, so a Super Admin's eye
 * lands on one theme at a time during the morning scan rather than jumping
 * between unrelated figures. The two distribution donuts sit side by side at
 * equal width — a ring doesn't need the full row a table or list would.
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

      {/* Full width, own row: a per-school bar list scales with the district's
          school count and needs the Y-axis labels and bar length room a
          six-column card can't give it — pairing it next to two short stat
          numbers just stretched them to match its height instead. */}
      <RatioBarCard
        title="Teacher-Student Ratio"
        schools={teacherStudentRatioBySchool}
        asOf={TEACHER_STUDENT_RATIO_ASOF}
        target={TEACHER_STUDENT_RATIO_TARGET}
        className="sf-col-12"
      />

      <DistributionDonutCard
        title="Student Count By School"
        data={studentCountBySchoolDistribution}
        asOf={STUDENT_COUNT_BY_SCHOOL_ASOF}
        totalLabel="Students"
        className="sf-col-6"
      />

      <DistributionDonutCard
        title="Students' Status"
        data={studentsStatusDistribution}
        asOf={STUDENTS_STATUS_ASOF}
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
