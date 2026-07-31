import Link from "next/link";
import { MetricCard } from "@/components/sf/MetricCard";
import { Donut, Funnel, StackedBars, StatValue } from "@/components/sf/charts";
import { REPORTS } from "@/lib/data/salesforce";
import {
  RATIO_SERIES,
  STATUS_SERIES,
  eventParticipants,
  numberOfStudents,
  studentCountBySchool,
  studentsStatus,
  teacherStudentRatio,
  totalEventsHeld,
  totalFaculty
} from "@/lib/data/dashboard";
import { attentionCountsByCategory, needsAttentionOpenCount } from "@/lib/data/needsAttention";
import { ATTENTION_CATEGORIES } from "@/lib/data/needsAttention";

/**
 * Super Admin landing dashboard. Curated top-level set per brief §5; the full
 * catalog lives in Reporting & Analytics.
 *
 * TODO: exact card set is an open item (brief §6 / open item 6). This is the
 * brief's own suggestion, not a confirmed selection.
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

        <MetricCard
          title="Total Events Held"
          report={REPORTS.totalEventsHeld.name}
          asOf={REPORTS.totalEventsHeld.asOf}
          span="sf-col-3"
        >
          <StatValue value={totalEventsHeld} label="Total Events Held" />
        </MetricCard>

        <MetricCard
          title="Event Participants"
          report={REPORTS.eventParticipants.name}
          asOf={REPORTS.eventParticipants.asOf}
          span="sf-col-3"
        >
          <StatValue value={eventParticipants} label="Event Participants" />
        </MetricCard>
      </div>
    </section>
  );
}
