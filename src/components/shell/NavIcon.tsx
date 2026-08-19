import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  ChartBarLineIcon,
  Home01Icon,
  Mortarboard02Icon,
  Notification01Icon,
  PreferenceHorizontalIcon,
  SchoolIcon,
  Settings02Icon,
  Target01Icon,
  UserSettings01Icon
} from "@hugeicons/core-free-icons";
import type { SectionId } from "@/lib/nav";

const ICONS: Record<SectionId, IconSvgElement> = {
  home: Home01Icon,
  reporting: ChartBarLineIcon,
  "people-360": Mortarboard02Icon,
  "skills-development": PreferenceHorizontalIcon,
  "academic-goals": Target01Icon,
  alerts: Notification01Icon,
  "user-management": UserSettings01Icon,
  "school-setup": SchoolIcon,
  "system-settings": Settings02Icon
};

export function NavIcon({ name }: { name: SectionId }) {
  return <HugeiconsIcon icon={ICONS[name] ?? Home01Icon} size={16} strokeWidth={1.8} />;
}
