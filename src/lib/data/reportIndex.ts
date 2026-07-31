/**
 * Reporting & Analytics tab set. Shared with anywhere else that needs to list
 * the reports so the lists can't drift.
 *
 * TODO: v2 open item — the screen inventory asks whether drill-down still stops
 * at class level now that Student & Faculty 360 exists. Student Progress and
 * Faculty Class Performance are carried forward from v1 unchanged for now, with
 * links out to 360 where a named person appears.
 */
export type ReportEntry = {
  id: string;
  label: string;
  href: string;
  description: string;
  highlight: string;
};

export const REPORT_ENTRIES: ReportEntry[] = [
  {
    id: "metrics",
    label: "Metrics",
    href: "/reporting",
    description: "The full Salesforce-sourced metrics catalog.",
    highlight: "15 metrics"
  },
  {
    id: "student-progress",
    label: "Student Progress",
    href: "/reporting/student-progress",
    description: "Goal and attendance rollups per cohort.",
    highlight: "By cohort"
  },
  {
    id: "faculty-performance",
    label: "Faculty Class Performance",
    href: "/reporting/faculty-performance",
    description: "Attendance, assignment completion and open alerts per class.",
    highlight: "Per class"
  },
  {
    id: "platform-usage",
    label: "Platform Usage",
    href: "/reporting/admin-dashboard",
    description: "Portal adoption by school and last successful sync per integration.",
    highlight: "Adoption"
  },
  {
    id: "custom",
    label: "Custom Report Builder",
    href: "/reporting/custom",
    description: "Build an ad hoc view over the named reports and export it.",
    highlight: "Export to CSV"
  }
];
