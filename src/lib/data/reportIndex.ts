/**
 * The five Reporting & Analytics screens, surfaced as entry points on the
 * Leadership home. Kept in one place so the home cards and the section tab bar
 * can't drift apart.
 */
export type ReportEntry = {
  id: string;
  label: string;
  href: string;
  description: string;
  /** What the card shows at a glance, so it isn't just a link. */
  highlight: string;
};

export const REPORT_ENTRIES: ReportEntry[] = [
  {
    id: "core-metrics",
    label: "Core Metrics",
    href: "/reporting",
    description:
      "Attendance, goal completion and assignment completion, with trend and drill-down to class level.",
    highlight: "3 district metrics"
  },
  {
    id: "admin-dashboard",
    label: "Admin Dashboard",
    href: "/reporting/admin-dashboard",
    description: "Platform health and usage: active logins, portal adoption by school, last sync per integration.",
    highlight: "5 schools tracked"
  },
  {
    id: "student-progress",
    label: "Student Progress",
    href: "/reporting/student-progress",
    description: "Goal and attendance rollups per cohort. Stops at class level — no individual student profiles.",
    highlight: "Rolls up to class"
  },
  {
    id: "faculty-performance",
    label: "Faculty Class Performance",
    href: "/reporting/faculty-performance",
    description: "Attendance, assignment completion, roster size and open alerts for each class.",
    highlight: "Per class"
  },
  {
    id: "custom",
    label: "Custom Report Builder",
    href: "/reporting/custom",
    description: "Build an ad hoc view over the two named reports and export it as CSV.",
    highlight: "Export to CSV"
  }
];
