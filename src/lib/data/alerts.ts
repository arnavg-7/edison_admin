import type { ListEditorItem } from "@/components/shared/ListEditor";

// TODO: replace with the real Admin DB alerts contract.
//
// Scope note: built to the simple committed scope — alert rules and
// notification templates only. No rules engine, escalation policies, or
// distribution configuration (brief §5).

export const alertRules: ListEditorItem[] = [
  {
    id: "ar-1",
    title: "Attendance below 80%",
    detail: "Notify the homeroom teacher when a student's weekly attendance drops below 80%.",
    status: { tone: "ok", label: "Active" },
    meta: "Triggered 34 times in the last 30 days"
  },
  {
    id: "ar-2",
    title: "Three or more missing assignments",
    detail: "Flag students with three or more missing assignments in a single week.",
    status: { tone: "ok", label: "Active" },
    meta: "Triggered 112 times in the last 30 days"
  },
  {
    id: "ar-3",
    title: "Goal overdue by 14 days",
    detail: "Alert the advisor when an academic goal passes its target date by two weeks.",
    status: { tone: "ok", label: "Active" },
    meta: "Triggered 27 times in the last 30 days"
  },
  {
    id: "ar-4",
    title: "Grade drop of one letter",
    detail: "Notify faculty when a student's subject grade falls by a full letter.",
    status: { tone: "neutral", label: "Inactive" },
    meta: "Never triggered"
  }
];

export const notificationTemplates: ListEditorItem[] = [
  {
    id: "nt-1",
    title: "Attendance concern — guardian email",
    detail: "Sent to guardians when the attendance rule fires. Includes the attendance figure and contact details.",
    status: { tone: "ok", label: "Active" },
    meta: "Email · last edited Jul 12, 2026"
  },
  {
    id: "nt-2",
    title: "Missing work — faculty digest",
    detail: "Daily digest to faculty listing students with missing assignments.",
    status: { tone: "ok", label: "Active" },
    meta: "Email · last edited Jun 28, 2026"
  },
  {
    id: "nt-3",
    title: "Goal check-in reminder",
    detail: "In-portal reminder prompting an advisor to review an overdue goal.",
    status: { tone: "ok", label: "Active" },
    meta: "In-portal · last edited Jul 03, 2026"
  }
];
