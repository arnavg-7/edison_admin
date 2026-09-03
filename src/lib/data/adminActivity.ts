/**
 * What an admin has actually done: when they signed in, and what they changed.
 *
 * Every entry names the portal it touched as well as the section, because those
 * are two different questions. "Edited a goal" is not the whole story — "edited a
 * goal in Edison High School" is, and for a Super Admin who works across five
 * schools it is the only way to read their history at all.
 *
 * Generated per account and bounded by what that account may reach, so the trail
 * cannot contradict the role it belongs to: a School Admin's entries only ever
 * name their own school, and never name User Management, which their role
 * explicitly does not grant. A log that showed otherwise would be worse than no
 * log — it would be evidence of a permission failure that never happened.
 *
 * TODO: replace with real reads of the audit table. Entries are derived
 * deterministically from the account so a record shows the same history on every
 * render.
 */

import { schools } from "./schools";
import { rosterSeed } from "./studentRoster";
import type { AdminUser } from "./adminUsers";

export type AdminActivityKind = "sign-in" | "change" | "export";

export const ACTIVITY_KIND_LABELS: Record<AdminActivityKind, string> = {
  "sign-in": "Sign-in",
  change: "Change",
  export: "Export"
};

export type AdminActivityEntry = {
  id: string;
  userId: string;
  at: string;
  kind: AdminActivityKind;
  /** The section of the portal, as the nav names it. */
  section: string;
  /** Which school's portal, or null for something district-wide. */
  schoolId: string | null;
  action: string;
  /** What actually changed, where there is something worth naming. */
  detail: string | null;
};

type ActionSeed = { section: string; kind: AdminActivityKind; action: string; details: string[] };

/**
 * What an admin plausibly does in each section.
 *
 * Written out rather than generated because a log is only useful if each line
 * reads like something a person did. "Updated record" ten times over is a log
 * nobody would open twice.
 */
const DISTRICT_WIDE_SECTIONS = new Set(["User Management", "System Settings"]);

const ACTIONS: ActionSeed[] = [
  {
    section: "Goals",
    kind: "change",
    action: "Set a goal",
    details: [
      "Reach Applying in Critical Thinking · Grade 9",
      "Attendance improvement plan · Grade 10",
      "Write and review one personal academic goal · Grade 11"
    ]
  },
  {
    section: "Goals",
    kind: "change",
    action: "Edited a goal",
    details: [
      "Changed the target from Building to Applying",
      "Moved the window to Spring 2027",
      "Added a target: no more than 10% at Learning"
    ]
  },
  {
    section: "Goals",
    kind: "change",
    action: "Recorded student progress",
    details: ["Not started → In progress on 4 students", "Marked 2 students Completed"]
  },
  {
    section: "Skills & Development",
    kind: "change",
    action: "Published a development area",
    details: ["Room To Grow · Mathematics · Grade 9", "Interests · Science · Grade 10"]
  },
  {
    section: "Skills & Development",
    kind: "change",
    action: "Edited the Portrait of a Graduate",
    details: ["Renamed the level Emerging to Learning", "Added the pillar Engaged Community Member"]
  },
  {
    section: "Student & Faculty 360",
    kind: "change",
    action: "Edited personal details",
    details: ["Corrected a guardian phone number", "Added a missing home address"]
  },
  {
    section: "Alerts & Notifications",
    kind: "change",
    action: "Resolved an alert",
    details: ["Attendance below 80% · 3 alerts", "Goal overdue by 14 days · 1 alert"]
  },
  {
    section: "Reporting & Analytics",
    kind: "export",
    action: "Exported a report",
    details: ["Faculty class performance", "Student progress · Grade 9", "Attendance by school"]
  },
  {
    section: "School Master Setup",
    kind: "change",
    action: "Edited the hierarchy",
    details: ["Added batch 9-C for 2026–27", "Changed a grade lead", "Imported 42 rows from CSV"]
  },
  {
    section: "User Management",
    kind: "change",
    action: "Invited an admin",
    details: ["School Admin · Lincoln Elementary", "Super Admin · all schools"]
  },
  {
    section: "User Management",
    kind: "change",
    action: "Changed a role",
    details: ["School Admin → Super Admin", "Moved a School Admin to Edison Middle School"]
  },
  {
    section: "System Settings",
    kind: "change",
    action: "Updated the academic calendar",
    details: ["Term 4 end date moved to 14 Aug", "Added the 2026–27 sessions"]
  },
  {
    section: "System Settings",
    kind: "change",
    action: "Published an announcement",
    details: ["Grade 9 orientation", "Half-term closure"]
  }
];

/** Sign-ins are entries too — the question is often only "when were they last in". */
const SIGN_IN: ActionSeed = {
  section: "Home",
  kind: "sign-in",
  action: "Signed in",
  details: []
};

/**
 * Hours back from the account's last sign-in, oldest last.
 *
 * Anchored to `lastLogin` rather than to now: an account disabled in April
 * should have a history that stops in April, not one that runs up to today.
 */
const HOURS_BACK = [0, 5, 26, 30, 51, 74, 98, 122, 147, 170, 195, 220, 246, 270, 295, 320];

/**
 * One account's history, newest first.
 *
 * An account that never signed in has none: an invitation is not activity, and a
 * row of invented entries against someone who has never been in would be a lie
 * the rest of the screen depends on.
 */
export function activityFor(user: AdminUser): AdminActivityEntry[] {
  if (!user.lastLogin) return [];

  const anchor = new Date(user.lastLogin).getTime();
  const scoped = user.scope.type === "school" ? user.scope.schoolId : null;

  /* What this account could have done. A School Admin has no User Management,
     because their role says so — the trail has to agree with the permission. */
  const available = ACTIONS.filter((seed) =>
    user.role === "school_admin" ? seed.section !== "User Management" : true
  );

  return HOURS_BACK.map((hours, index) => {
    const key = rosterSeed(user.id, String(index));
    const at = new Date(anchor - hours * 60 * 60 * 1000).toISOString();

    // Every fourth entry is a sign-in, so a history reads as sessions of work.
    const seed = index % 4 === 0 ? SIGN_IN : available[key % available.length];

    /* Which portal. A School Admin's is always their own; a Super Admin moves
       between them, except in the sections that are district-wide by nature. */
    const schoolId =
      seed.kind === "sign-in" || DISTRICT_WIDE_SECTIONS.has(seed.section)
        ? scoped
        : (scoped ?? schools[key % schools.length].id);

    return {
      id: `aa-${user.id}-${index}`,
      userId: user.id,
      at,
      kind: seed.kind,
      section: seed.section,
      schoolId: seed.section === "User Management" || seed.section === "System Settings" ? scoped : schoolId,
      action: seed.action,
      detail: seed.details.length > 0 ? seed.details[key % seed.details.length] : null
    };
  });
}

/** "Edison High School", or "All schools" for something district-wide. */
export function portalLabel(schoolId: string | null): string {
  if (!schoolId) return "All schools";
  return schools.find((school) => school.id === schoolId)?.name ?? "Unknown school";
}

/** Every account's history, newest first — what the district-wide audit log is. */
export function allActivity(users: AdminUser[]): AdminActivityEntry[] {
  return users
    .flatMap((user) => activityFor(user))
    .sort((a, b) => b.at.localeCompare(a.at));
}

/** The sections an account has actually touched, for its own filter. */
export function sectionsTouched(entries: AdminActivityEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.section))].sort();
}

/** The portals an account has actually touched, for its own filter. */
export function portalsTouched(entries: AdminActivityEntry[]): (string | null)[] {
  const ids = new Set(entries.map((entry) => entry.schoolId));
  return [...ids].sort((a, b) => portalLabel(a).localeCompare(portalLabel(b)));
}
