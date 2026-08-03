import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  ChartBarLineIcon,
  Home01Icon,
  Link04Icon,
  Notification01Icon,
  PreferenceHorizontalIcon,
  Settings02Icon,
  Target01Icon,
  UserGroupIcon
} from "@hugeicons/core-free-icons";
import type { SectionId } from "@/lib/nav";

const ICONS: Record<SectionId, IconSvgElement> = {
  home: Home01Icon,
  reporting: ChartBarLineIcon,
  "people-360": UserGroupIcon,
  "skills-development": PreferenceHorizontalIcon,
  "academic-goals": Target01Icon,
  alerts: Notification01Icon,
  "system-settings": Settings02Icon,
  integrations: Link04Icon
};

export function NavIcon({ name }: { name: SectionId }) {
  return <HugeiconsIcon icon={ICONS[name] ?? Home01Icon} size={16} strokeWidth={1.8} />;
}
