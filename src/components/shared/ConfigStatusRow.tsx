import Link from "next/link";
import type { ConfigStatus } from "@/lib/data/configStatus";
import { StatusBadge } from "./StatusBadge";

export function ConfigStatusRow({ item }: { item: ConfigStatus }) {
  const complete = item.configured >= item.total;
  const missing = item.total - item.configured;

  return (
    <Link href={`/${item.section}`} className="config-status-row">
      <div className="config-status-main">
        <div className="config-status-module">{item.module}</div>
        <div className="config-status-detail">{item.detail}</div>
      </div>
      <div className="config-status-meta">
        <span className="config-status-count">
          {item.configured} of {item.total} configured
        </span>
        <StatusBadge tone={complete ? "ok" : "warn"}>
          {complete ? "Configured" : `${missing} missing`}
        </StatusBadge>
      </div>
    </Link>
  );
}
