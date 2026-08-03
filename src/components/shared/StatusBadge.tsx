import type { StatusTone } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <Badge variant={tone}>{children}</Badge>;
}
