/**
 * v2: single Super Admin role, so there is no access map — every section is
 * visible to everyone with Admin access. The v1 persona gating (SECTION_ACCESS,
 * SectionGuard, RoleSwitcher) was removed rather than left inert.
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
  | "system-settings"
  | "integrations";

export type Section = {
  id: SectionId;
  label: string;
  href: string;
};

export const SECTIONS: Section[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "reporting", label: "Reporting & Analytics", href: "/reporting" },
  { id: "people-360", label: "User Management", href: "/people" },
  { id: "skills-development", label: "Skills & Development", href: "/skills-development" },
  { id: "academic-goals", label: "Academic Goals", href: "/academic-goals" },
  { id: "alerts", label: "Alerts & Notifications", href: "/alerts" },
  { id: "system-settings", label: "System Settings", href: "/system-settings" },
  { id: "integrations", label: "Integrations", href: "/integrations" }
];

export const ADMIN_ROLE_LABEL = "Super Admin";
