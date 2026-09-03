/**
 * The sections, and where each one opens.
 *
 * One audience now: a Super Admin administers every school and a School Admin
 * does the same job over one, so every section is in the nav for both and the
 * difference is scope rather than which rows exist. The per-persona allow-lists
 * that used to live here went with the Leadership and IT personas.
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

/**
 * Which section a path belongs to.
 *
 * Longest prefix wins, so `/reporting/faculty-performance` resolves to Reporting
 * rather than to whichever section declared a shorter matching href.
 *
 * Anything matching nothing belongs to Home — today that is `/needs-attention`,
 * which has no nav row of its own and is reached from Home's cards.
 */
export function sectionForPath(pathname: string): SectionId {
  const match = SECTIONS.filter(
    (section) => section.href !== "/" && pathname.startsWith(section.href)
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return match?.id ?? "home";
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
