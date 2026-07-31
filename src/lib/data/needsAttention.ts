// TODO: replace with real sources. Categories map to: at-risk (derived from
// Salesforce goals/attendance/well-being), overdue alerts (Alerts SLA field),
// sync failures (Integrations failure states), pending config (unconfigured
// items across Portal Config / Academic Goals / System Settings).

export type AttentionCategory = "at-risk" | "overdue-alert" | "sync-failure" | "pending-config";

export type AttentionSeverity = "critical" | "high" | "medium";

export const ATTENTION_CATEGORIES: { value: AttentionCategory; label: string }[] = [
  { value: "at-risk", label: "At risk" },
  { value: "overdue-alert", label: "Overdue alerts" },
  { value: "sync-failure", label: "Sync failures" },
  { value: "pending-config", label: "Pending config" }
];

export const ATTENTION_SEVERITIES: { value: AttentionSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" }
];

export type AttentionItem = {
  id: string;
  category: AttentionCategory;
  severity: AttentionSeverity;
  /** What is flagged. */
  subject: string;
  /** Why it is flagged — the rule that fired. */
  reason: string;
  flaggedAt: string;
  /** Where to go to resolve it. */
  href: string;
  resolveLabel: string;
  resolved?: boolean;
};

/**
 * TODO — PLACEHOLDER THRESHOLDS. The at-risk rules below are invented. Brief
 * §7 lists the real thresholds as an open item: how many consecutive absences
 * counts as chronic, how many missed checkpoints makes a goal off-track, and
 * how long a well-being trend must stay "Unpleasant". Do not treat the numbers
 * in these reasons as agreed logic.
 */
export const AT_RISK_PLACEHOLDER_RULES = [
  "Attendance: 3+ absences in the last 10 school days",
  "Goals: 2+ consecutive missed checkpoints",
  "Well-being: 'Unpleasant' logged 3+ times in 14 days"
];

export const attentionItems: AttentionItem[] = [
  {
    id: "na-1",
    category: "at-risk",
    severity: "critical",
    subject: "Michael Andrew · Grade 10 · Edison High School",
    reason: "18 absences against 6 present days year to date (placeholder rule: 3+ in 10 days)",
    flaggedAt: "2026-07-17T08:20:00-04:00",
    href: "/people/student/michael-andrew",
    resolveLabel: "Open student 360"
  },
  {
    id: "na-2",
    category: "at-risk",
    severity: "high",
    subject: "Nick Johnson · Grade 9 · Edison High School",
    reason: "Well-being logged 'Unpleasant' 3 times in the last 14 days (placeholder rule)",
    flaggedAt: "2026-07-16T14:05:00-04:00",
    href: "/people/student/nick-johnson",
    resolveLabel: "Open student 360"
  },
  {
    id: "na-3",
    category: "at-risk",
    severity: "medium",
    subject: "R.K. Sharma · Grade 8 · James Madison Intermediate",
    reason: "2 consecutive missed goal checkpoints (placeholder rule)",
    flaggedAt: "2026-07-15T09:41:00-04:00",
    href: "/people/student/rk-sharma",
    resolveLabel: "Open student 360"
  },
  {
    id: "na-4",
    category: "overdue-alert",
    severity: "high",
    subject: "Attendance below 80% — 12 unresolved alerts",
    reason: "Past the 48-hour response SLA on the Attendance below 80% rule",
    flaggedAt: "2026-07-15T06:00:00-04:00",
    href: "/alerts",
    resolveLabel: "Review alert rules"
  },
  {
    id: "na-5",
    category: "overdue-alert",
    severity: "medium",
    subject: "Goal overdue by 14 days — 5 unresolved alerts",
    reason: "Advisors have not acknowledged within the SLA window",
    flaggedAt: "2026-07-14T06:00:00-04:00",
    href: "/alerts",
    resolveLabel: "Review alert rules"
  },
  {
    id: "na-6",
    category: "sync-failure",
    severity: "critical",
    subject: "Genesis daily file — not received",
    reason: "No file delivered by the 06:30 cutoff on 29 Jun; attendance figures are stale",
    flaggedAt: "2026-07-17T06:30:00-04:00",
    href: "/integrations",
    resolveLabel: "Open Genesis ingest"
  },
  {
    id: "na-7",
    category: "sync-failure",
    severity: "high",
    subject: "Google Calendar API — elevated error rate",
    reason: "1.80% error rate with rate-limit pressure at 889 of 1,000 requests per minute",
    flaggedAt: "2026-07-17T11:58:00-04:00",
    href: "/integrations/calendar",
    resolveLabel: "Open Calendar sync"
  },
  {
    id: "na-8",
    category: "sync-failure",
    severity: "medium",
    subject: "Homeroom mapping — awaiting Genesis data",
    reason: "Homeroom courses present for 1 of 5 schools, 0 enrollments in any school",
    flaggedAt: "2026-07-10T05:12:00-04:00",
    href: "/integrations",
    resolveLabel: "Open Genesis ingest"
  },
  {
    id: "na-9",
    category: "pending-config",
    severity: "medium",
    subject: "KG development areas — Room To Grow unpublished",
    reason: "Draft area with 1 skill has not been published to the student portal",
    flaggedAt: "2026-07-12T10:00:00-04:00",
    href: "/portal-configuration",
    resolveLabel: "Open Portal Configuration"
  },
  {
    id: "na-10",
    category: "pending-config",
    severity: "medium",
    subject: "Academic calendar — term dates unconfirmed",
    reason: "Reporting date presets still resolve against placeholder term boundaries",
    flaggedAt: "2026-07-08T10:00:00-04:00",
    href: "/system-settings/calendar",
    resolveLabel: "Open Academic Calendar"
  },
  {
    id: "na-11",
    category: "pending-config",
    severity: "medium",
    subject: "Visual & Performing Arts — subject unmapped",
    reason: "Subject has 6 courses but no grade-level mapping",
    flaggedAt: "2026-07-06T10:00:00-04:00",
    href: "/system-settings/subjects",
    resolveLabel: "Open Subject management"
  }
];

export function needsAttentionOpenCount(): number {
  return attentionItems.filter((item) => !item.resolved).length;
}

export function attentionCountsByCategory(): Record<AttentionCategory, number> {
  return attentionItems.reduce(
    (acc, item) => {
      if (!item.resolved) {
        acc[item.category] += 1;
      }
      return acc;
    },
    { "at-risk": 0, "overdue-alert": 0, "sync-failure": 0, "pending-config": 0 } as Record<
      AttentionCategory,
      number
    >
  );
}
