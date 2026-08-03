"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { formatSalesforceStamp } from "@/lib/format";

/**
 * The Salesforce-style metric card: title, refresh tool, body slot, then a
 * footer carrying the figure's own freshness stamp.
 *
 * The stamp is per-card by design — it reflects when that Salesforce report
 * last refreshed, so a stale report shows a stale time rather than a wrong
 * number presented as current.
 */
export function MetricCard({
  title,
  /** Salesforce report this figure comes from; named in the stamp's tooltip so
      the number stays traceable to its source. */
  report,
  asOf,
  span = "sf-col-4",
  children,
  onRefresh
}: {
  title: string;
  report: string;
  asOf: string;
  span?: string;
  children: React.ReactNode;
  onRefresh?: () => void;
}) {
  return (
    <section className={`sf-card ${span}`}>
      <div className="sf-card-head">
        <h2 className="sf-card-title">{title}</h2>
        <div className="sf-card-tools">
          <button
            type="button"
            className="sf-card-tool"
            onClick={onRefresh}
            title={`Refresh ${title}`}
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={2} />
            <span className="sf-sr-only">Refresh {title}</span>
          </button>
        </div>
      </div>

      <div className="sf-card-body">{children}</div>

      <div className="sf-card-foot">
        <span className="sf-card-stamp" title={`Source report: ${report}`}>
          As of {formatSalesforceStamp(asOf)}
        </span>
      </div>
    </section>
  );
}
