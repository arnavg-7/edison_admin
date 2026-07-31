import type { Role } from "./roles";

/**
 * System Settings is one nav entry owned by two personas: Portal admin owns the
 * academic configuration screens, IT admin owns users and audit. This extends
 * the same SECTION_ACCESS idea down to sub-screens rather than introducing a
 * second permission mechanism.
 */
export type SettingsScreenId =
  | "grade-levels"
  | "subjects"
  | "calendar"
  | "announcements"
  | "users"
  | "audit-log";

export type SettingsScreen = {
  id: SettingsScreenId;
  label: string;
  href: string;
  roles: Role[];
};

export const SETTINGS_SCREENS: SettingsScreen[] = [
  { id: "grade-levels", label: "Grade Levels", href: "/system-settings", roles: ["portal_admin"] },
  { id: "subjects", label: "Subjects", href: "/system-settings/subjects", roles: ["portal_admin"] },
  {
    id: "calendar",
    label: "Academic Calendar",
    href: "/system-settings/calendar",
    roles: ["portal_admin"]
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/system-settings/announcements",
    roles: ["portal_admin"]
  },
  { id: "users", label: "User Management", href: "/system-settings/users", roles: ["it_admin"] },
  {
    id: "audit-log",
    label: "Data Privacy & Audit Log",
    href: "/system-settings/audit-log",
    roles: ["it_admin"]
  }
];

export function settingsScreensForRole(role: Role): SettingsScreen[] {
  return SETTINGS_SCREENS.filter((screen) => screen.roles.includes(role));
}

export function canAccessSettingsScreen(role: Role, id: SettingsScreenId): boolean {
  return SETTINGS_SCREENS.find((screen) => screen.id === id)?.roles.includes(role) ?? false;
}
