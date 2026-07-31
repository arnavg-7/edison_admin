"use client";

import { MetricCard } from "@/components/sf/MetricCard";
import { CoreMetricCard } from "@/components/sf/CoreMetricCard";
import { Donut, Funnel, GroupedBars, StackedBars, StatValue } from "@/components/sf/charts";
import { REPORTS } from "@/lib/data/salesforce";
import {
  ATTENDANCE_SERIES,
  GRADE_SERIES,
  RATIO_SERIES,
  STATUS_SERIES,
  assignmentSubmissions,
  numberOfStudents,
  studentAttendance,
  studentAttendanceBySchool,
  studentCountBySchool,
  studentsByGrade,
  studentsStatus,
  teacherStudentRatio,
  totalFaculty
} from "@/lib/data/dashboard";
import type { BarGroup } from "@/components/sf/charts";

/**
 * The full metrics catalog. Every card is one Salesforce report with its own
 * refresh time, so a report lagging behind shows a stale stamp instead of
 * quietly presenting old numbers as current.
 */
export default function MetricsCatalogPage() {
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
    <div className="sf-card-grid">
      <CoreMetricCard
        title="Attendance Rate"
        report={REPORTS.attendanceRate.name}
        asOf={REPORTS.attendanceRate.asOf}
        value="92.4%"
        delta="0.6 pts vs. last week"
        direction="down"
        series={[93.4, 92.8, 93.1, 92.2, 92.9, 92.5, 92.4]}
      />
      <CoreMetricCard
        title="Goal Completion %"
        report={REPORTS.goalCompletion.name}
        asOf={REPORTS.goalCompletion.asOf}
        value="68.1%"
        delta="2.3 pts vs. last week"
        direction="up"
        series={[63.2, 64.1, 65.0, 65.4, 66.8, 67.2, 68.1]}
      />
      <CoreMetricCard
        title="Assignment Completion Rate"
        report={REPORTS.assignmentCompletion.name}
        asOf={REPORTS.assignmentCompletion.asOf}
        value="84.7%"
        delta="1.1 pts vs. last week"
        direction="up"
        series={[82.1, 82.9, 83.4, 83.1, 84.0, 84.4, 84.7]}
      />

      <MetricCard
        title="Number of Students"
        report={REPORTS.numberOfStudents.name}
        asOf={REPORTS.numberOfStudents.asOf}
        span="sf-col-3"
      >
        <StatValue value={numberOfStudents} label="Number of Students" />
      </MetricCard>

      <MetricCard
        title="Total Faculty"
        report={REPORTS.totalFaculty.name}
        asOf={REPORTS.totalFaculty.asOf}
        span="sf-col-3"
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
          legendTitle="Program Enrollment: Record Type"
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
          legendTitle="Account Name"
          caption="Record Count"
          total={numberOfStudents}
        />
      </MetricCard>

      <MetricCard
        title="Students' Status"
        report={REPORTS.studentsStatus.name}
        asOf={REPORTS.studentsStatus.asOf}
        span="sf-col-6"
      >
        <Funnel stages={studentsStatus} legendTitle="Status" total={numberOfStudents} />
      </MetricCard>

      <MetricCard
        title="Students By Grade"
        report={REPORTS.studentsByGrade.name}
        asOf={REPORTS.studentsByGrade.asOf}
        span="sf-col-12"
      >
        <GroupedBars
          groups={studentsByGrade}
          axisTitle="Record Count"
          legendTitle="Primary Business Organization"
          series={GRADE_SERIES}
        />
      </MetricCard>

      <MetricCard
        title="Student Attendance"
        report={REPORTS.studentAttendance.name}
        asOf={REPORTS.studentAttendance.asOf}
        span="sf-col-12"
      >
        <GroupedBars
          groups={attendanceGroups}
          axisTitle="Record Count"
          legendTitle="Attendance Status"
          series={ATTENDANCE_SERIES}
        />
        <p className="sf-card-hint">
          Individual level — select a name to open their Student 360 profile.
        </p>
      </MetricCard>

      <MetricCard
        title="Student Attendance By School"
        report={REPORTS.studentAttendanceBySchool.name}
        asOf={REPORTS.studentAttendanceBySchool.asOf}
        span="sf-col-12"
      >
        <GroupedBars
          groups={studentAttendanceBySchool}
          axisTitle="Record Count"
          legendTitle="Attendance Status"
          series={ATTENDANCE_SERIES}
        />
      </MetricCard>



      <MetricCard
        title="Assignment Submissions"
        report={REPORTS.assignmentSubmissions.name}
        asOf={REPORTS.assignmentSubmissions.asOf}
        span="sf-col-6"
      >
        <GroupedBars
          groups={assignmentSubmissions}
          axisTitle="Assignment Submission - Record Count"
          legendTitle="Contact: Primary Academic Program"
          series={[{ label: "Submissions", colorIndex: 0 }]}
          groupLabelIsCategory
        />
      </MetricCard>


    </div>
  );
}
