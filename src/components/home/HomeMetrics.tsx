import { MetricCard } from "@/components/sf/MetricCard";
import { CoreMetricCard } from "@/components/sf/CoreMetricCard";
import { Donut, Funnel, StackedBars, StatValue } from "@/components/sf/charts";
import { REPORTS } from "@/lib/data/salesforce";
import {
  RATIO_SERIES,
  coreMetrics,
  numberOfStudents,
  studentCountBySchool,
  studentsStatus,
  teacherStudentRatio,
  totalFaculty
} from "@/lib/data/dashboard";

/**
 * Enrollment, staffing and academic figures in one flat grid — the steady-state
 * numbers a Super Admin checks after Needs Attention.
 */
export function HomeMetrics() {
  return (
    <div className="sf-card-grid">
      <MetricCard
        title="Number of Students"
        report={REPORTS.numberOfStudents.name}
        asOf={REPORTS.numberOfStudents.asOf}
        span="sf-col-6"
      >
        <StatValue value={numberOfStudents} label="Number of Students" />
      </MetricCard>

      <MetricCard
        title="Total Faculty"
        report={REPORTS.totalFaculty.name}
        asOf={REPORTS.totalFaculty.asOf}
        span="sf-col-6"
      >
        <StatValue value={totalFaculty} label="Total Faculty" />
      </MetricCard>

      <MetricCard
        title="Teacher-Student Ratio"
        report={REPORTS.teacherStudentRatio.name}
        asOf={REPORTS.teacherStudentRatio.asOf}
        span="sf-col-6"
      >
        <StackedBars
          rows={teacherStudentRatio}
          axisTitle="Record Count (%)"
          legendTitle="Role"
          series={RATIO_SERIES}
        />
      </MetricCard>

      <MetricCard
        title="Student Count By School"
        report={REPORTS.studentCountBySchool.name}
        asOf={REPORTS.studentCountBySchool.asOf}
        span="sf-col-6"
      >
        <Donut
          slices={studentCountBySchool}
          legendTitle="School"
          caption="Record Count"
          total={numberOfStudents}
        />
      </MetricCard>

      <MetricCard
        title="Students' Status"
        report={REPORTS.studentsStatus.name}
        asOf={REPORTS.studentsStatus.asOf}
        span="sf-col-12"
      >
        <Funnel stages={studentsStatus} legendTitle="Status" total={numberOfStudents} />
      </MetricCard>

      <CoreMetricCard
        title="Attendance Rate"
        report={REPORTS.attendanceRate.name}
        asOf={REPORTS.attendanceRate.asOf}
        value={coreMetrics[0].value}
        delta={coreMetrics[0].trend.replace(/^[-+]/, "")}
        direction="down"
        series={[93.4, 92.8, 93.1, 92.2, 92.9, 92.5, 92.4]}
      />

      <CoreMetricCard
        title="Goal Completion %"
        report={REPORTS.goalCompletion.name}
        asOf={REPORTS.goalCompletion.asOf}
        value={coreMetrics[1].value}
        delta={coreMetrics[1].trend.replace(/^[-+]/, "")}
        direction="up"
        series={[63.2, 64.1, 65.0, 65.4, 66.8, 67.2, 68.1]}
      />

      <CoreMetricCard
        title="Assignment Completion Rate"
        report={REPORTS.assignmentCompletion.name}
        asOf={REPORTS.assignmentCompletion.asOf}
        value={coreMetrics[2].value}
        delta={coreMetrics[2].trend.replace(/^[-+]/, "")}
        direction="up"
        series={[82.1, 82.9, 83.4, 83.1, 84.0, 84.4, 84.7]}
      />
    </div>
  );
}
