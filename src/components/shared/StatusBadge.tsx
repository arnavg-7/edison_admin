import type { StatusTone } from "@/lib/data/types";

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <span className={`admin-status admin-status--${tone}`}>{children}</span>;
}
