/**
 * The sections, and which persona reaches which.
 *
 * v2 collapsed to a single Super Admin role and the v1 access map went with it.
 * It is back, but it is no longer here: which sections a role holds is
 * configured in User Management (Roles & Access) and lives in role-access-store,
 * so this module only declares what the sections *are*. The signed-in account's
 * roles resolve to a list of ids, and everything below takes that list.
 *
 * The school-level admin is not a separate thing — it is the Super Admin role
 * scoped to one school. Same sections, same write access, one school's data.
 *
 * Sections a persona cannot reach are absent from the nav rather than disabled.
 * A greyed-out row still tells you the section exists and invites the question
 * of who has it — for a persona that will never have it, that is noise.
 *
 * Field-level edit permissions still exist conceptually (most of Student &
 * Faculty 360 is read-only, but Goals checkpoints/status and a student's
 * Alert status are editable) but that is enforced per-field on that screen,
 * not by a section gate.
 */

export type SectionId =
  | "home"
  | "reporting"
  | "people-360"
  | "skills-development"
  | "academic-goals"
  | "alerts"
  | "user-management"
  | "school-setup"
  | "system-settings";

export type Section = {
  id: SectionId;
  label: string;
  href: string;
};

export const SECTIONS: Section[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "reporting", label: "Reporting & Analytics", href: "/reporting" },
  { id: "people-360", label: "Student & Faculty 360", href: "/people" },
  { id: "skills-development", label: "Skills & Development", href: "/skills-development" },
  { id: "academic-goals", label: "Goals", href: "/academic-goals" },
  { id: "alerts", label: "Alerts & Notifications", href: "/alerts" },
  { id: "user-management", label: "User Management", href: "/user-management" },
  /* Above System Settings and below User Management: it is district structure
     rather than portal preferences, and it is the hierarchy every screen above
     it filters by — so it reads as the last of the "what the district is"
     sections, not as one more setting. */
  { id: "school-setup", label: "School Master Setup", href: "/school-setup" },
  { id: "system-settings", label: "System Settings", href: "/system-settings" }
];

export const ADMIN_ROLE_LABEL = "Super Admin";

/** The sections an account holds, in the order SECTIONS declares. */
export function sectionsFor(held: SectionId[]): Section[] {
  return SECTIONS.filter((section) => held.includes(section.id));
}

/**
 * Where an account lands when it has no business being where it is — signing in
 * as somebody who cannot reach the screen you were on, or arriving on a typed
 * URL. Their first section, which is the one the nav opens on.
 *
 * An account with no sections at all has nowhere to land, so it is sent to the
 * screen that says so rather than to a page it would bounce straight out of.
 */
export function landingHref(held: SectionId[], schoolId: string | null): string {
  const first = sectionsFor(held)[0];
  return first ? sectionHref(first, schoolId) : NO_ACCESS_HREF;
}

/** Shown to an account whose roles hold nothing. */
export const NO_ACCESS_HREF = "/no-access";

/**
 * Which section a path belongs to.
 *
 * Longest prefix wins, so `/reporting/faculty-performance` resolves to Reporting
 * rather than to whichever section declared a shorter matching href.
 *
 * Anything matching nothing belongs to Home — today that is `/needs-attention`,
 * which has no nav row of its own and is reached from Home's cards. Defaulting
 * to Home rather than to "allowed" means a persona without Home cannot arrive
 * there sideways, and a persona with Home finds the link on it works.
 */
export function sectionForPath(pathname: string): SectionId {
  const match = SECTIONS.filter(
    (section) => section.href !== "/" && pathname.startsWith(section.href)
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return match?.id ?? "home";
}

/**
 * Paths outside the section model entirely, reachable whoever you are: the
 * invite acceptance screen, which is opened from an email by somebody who has
 * no session yet, and the dead end an account with no sections lands on.
 */
const UNGATED_PREFIXES = ["/invite", NO_ACCESS_HREF];

/** Whether a path sits inside a section this account holds. */
export function canReachPath(held: SectionId[], pathname: string): boolean {
  if (UNGATED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return held.includes(sectionForPath(pathname));
}

/**
 * Sections whose first screen is "pick a school".
 *
 * A school admin has already answered that question by being who they are, so
 * their nav links skip it and point straight at their school — see
 * `sectionHref`. Listing them here rather than testing the id at each call site
 * keeps the set in one place, next to the routes it names.
 */
export const SCOPED_SECTIONS: Section[] = SECTIONS.filter((section) =>
  ["skills-development", "academic-goals"].includes(section.id)
);

/**
 * The section's name for the scope you are administering.
 *
 * School Master Setup is the district's structure: adding a school, deleting
 * one, and everything under it going with it. A school admin does none of that
 * — what they hold is their own school's grades and batches — so for them the
 * section is School Management, and the screens behind it drop the school-level
 * add and delete to match.
 */
export function sectionLabel(section: Section, schoolId: string | null): string {
  return section.id === "school-setup" && schoolId ? "School Management" : section.label;
}

/**
 * Where a section's nav link goes for the current scope.
 *
 * The redirect on the school-picker pages is the safety net for a bookmark or a
 * typed URL; this is the path most people take, and it means a school admin is
 * never shown a list of schools on the way to their own.
 */
export function sectionHref(section: Section, schoolId: string | null): string {
  if (!schoolId) return section.href;
  return SCOPED_SECTIONS.some((entry) => entry.id === section.id)
    ? `${section.href}/${schoolId}`
    : section.href;
}
