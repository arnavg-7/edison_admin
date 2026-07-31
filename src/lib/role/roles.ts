// TODO: replace with the real IAM/SSO role contract once it exists. The three
// personas below come from the Build Brief; they are not yet reconciled against
// any production role structure (brief §8 open item 3).

export type Role = "leadership" | "portal_admin" | "it_admin";

export type SectionId =
  | "home"
  | "reporting"
  | "portal-configuration"
  | "academic-goals"
  | "alerts"
  | "resources"
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
  { id: "portal-configuration", label: "Portal Configuration", href: "/portal-configuration" },
  { id: "academic-goals", label: "Academic Goals", href: "/academic-goals" },
  { id: "alerts", label: "Alerts & Notifications", href: "/alerts" },
  { id: "resources", label: "Resources & Content", href: "/resources" },
  { id: "system-settings", label: "System Settings", href: "/system-settings" },
  { id: "integrations", label: "Integrations", href: "/integrations" }
];

export const ROLE_LABELS: Record<Role, string> = {
  leadership: "District & School Leadership",
  portal_admin: "Portal/Program Administrator",
  it_admin: "IT/Systems Administrator"
};

// The single permission model for the app. Sidebar visibility, per-section
// access denial, and System Settings > User Management all read from this map —
// there is deliberately no second admin-of-admin config (brief §2).
export const SECTION_ACCESS: Record<SectionId, Role[]> = {
  home: ["leadership", "portal_admin", "it_admin"],
  reporting: ["leadership"],
  "portal-configuration": ["portal_admin"],
  "academic-goals": ["portal_admin"],
  alerts: ["portal_admin"],
  resources: ["portal_admin"],
  "system-settings": ["portal_admin", "it_admin"],
  integrations: ["it_admin"]
};

export function canAccess(role: Role, section: SectionId): boolean {
  return SECTION_ACCESS[section].includes(role);
}

export function sectionsForRole(role: Role): Section[] {
  return SECTIONS.filter((section) => canAccess(role, section.id));
}
