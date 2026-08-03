import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  Book02Icon,
  CheckmarkCircle02Icon,
  FlashIcon,
  SmileIcon,
  StarIcon,
  Target01Icon
} from "@hugeicons/core-free-icons";
import type { DevAreaIcon as IconName } from "@/lib/data/skillsDevelopment";

const ICONS: Record<IconName, IconSvgElement> = {
  bolt: FlashIcon,
  smile: SmileIcon,
  target: Target01Icon,
  book: Book02Icon,
  star: StarIcon,
  check: CheckmarkCircle02Icon
};

export function DevAreaIcon({ name }: { name: IconName }) {
  return <HugeiconsIcon icon={ICONS[name] ?? CheckmarkCircle02Icon} size={20} strokeWidth={2} />;
}
