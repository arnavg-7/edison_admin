import Link from "next/link";
import { MetricCard } from "@/components/sf/MetricCard";
import { Donut, Funnel, StackedBars, StatValue } from "@/components/sf/charts";
import { CoreMetricCard } from "@/components/sf/CoreMetricCard";
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
import { attentionCountsByCategory, needsAttentionOpenCount } from "@/lib/data/needsAttention";
import { ATTENTION_CATEGORIES } from "@/lib/data/needsAttention";

/**
 * Super Admin landing dashboard. Curated top-level set; the full catalog lives
 * in Reporting & Analytics.
 *
 * The brief's suggested set included Total Events Held and Event Participants.
 * Those are screenshot-derived and outside Edison's scope docs, so the slots go
 * to the three original core metrics instead — attendance, goals and assignment
 * completion are the figures Edison actually tracks.
 *
 * TODO: exact card set is still an open item (brief §6 / open item 6).
 */
export default function HomePage() {
  const counts = attentionCountsByCategory();
  const open = needsAttentionOpenCount();

  return (
    <section className="sf-main">
      <h1 className="sf-page-title">Home</h1>
      <p className="sf-page-sub">
        District-wide overview. Every card carries its own refresh time, because Salesforce reports
        refresh on their own schedules.
      </p>

      <div className="sf-card-grid">
        <MetricCard
          title="Needs Attention"
          report="Needs Attention Queue"
          asOf={REPORTS.studentsStatus.asOf}
          span="sf-col-4"
        >
          <div className="sf-attention-summary">
            <div className="sf-attention-total">{open}</div>
            <ul className="sf-attention-breakdown">
              {ATTENTION_CATEGORIES.map((category) => (
                <li key={category.value}>
                  <span>{category.label}</span>
                  <strong>{counts[category.value]}</strong>
                </li>
              ))}
            </ul>
          </div>
          <Link className="sf-inline-link" href="/needs-attention">
            Open triage queue →
          </Link>
        </MetricCard>

        <MetricCard
          title="Number of Students"
          report={REPORTS.numberOfStudents.name}
          asOf={REPORTS.numberOfStudents.asOf}
          span="sf-col-4"
        >
          <StatValue value={numberOfStudents} label="Number of Students" />
        </MetricCard>

        <MetricCard
          title="Total Faculty"
          report={REPORTS.totalFaculty.name}
          asOf={REPORTS.totalFaculty.asOf}
          span="sf-col-4"
        >
          <StatValue value={totalFaculty} label="Total Faculty" />
        </MetricCard>

        <MetricCard
          title="Teacher-Student Ratio"
          report={REPORTS.teacherStudentRatio.name}
          asOf={REPORTS.teacherStudentRatio.asOf}
          span="sf-col-8"
        >
          <StackedBars
            rows={teacherStudentRatio}
            axisTitle="Record Count (%)"
            legendTitle="Program Enrollment: Record Type"
            series={RATIO_SERIES}
          />
        </MetricCard>

        <MetricCard
          title="Students' Status"
          report={REPORTS.studentsStatus.name}
          asOf={REPORTS.studentsStatus.asOf}
          span="sf-col-4"
        >
          <Funnel stages={studentsStatus} legendTitle="Status" total={numberOfStudents} />
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
    </section>
  );
}
