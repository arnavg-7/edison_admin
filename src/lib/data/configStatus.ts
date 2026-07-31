import type { SectionId } from "@/lib/role/roles";

// TODO: replace with real Admin DB config-state contract.

export type ConfigStatus = {
  id: string;
  module: string;
  section: SectionId;
  configured: number;
  total: number;
  detail: string;
};

export const configurationStatus: ConfigStatus[] = [
  {
    id: "portal-configuration",
    module: "Portal Configuration",
    section: "portal-configuration",
    configured: 3,
    total: 5,
    detail: "HS layout and branding published; KG layout still in draft"
  },
  {
    id: "academic-goals",
    module: "Academic Goals",
    section: "academic-goals",
    configured: 2,
    total: 3,
    detail: "Templates and categories set; progress tracking not enabled"
  },
  {
    id: "alerts",
    module: "Alerts & Notifications",
    section: "alerts",
    configured: 2,
    total: 2,
    detail: "4 alert rules and 3 notification templates active"
  },
  {
    id: "resources",
    module: "Resources & Content",
    section: "resources",
    configured: 1,
    total: 1,
    detail: "12 resources published"
  },
  {
    id: "system-settings",
    module: "System Settings",
    section: "system-settings",
    configured: 2,
    total: 4,
    detail: "Grade levels and subjects mapped; calendar and announcements pending"
  }
];
