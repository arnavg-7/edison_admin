"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { formatSalesforceStamp } from "@/lib/format";

/**
 * The Salesforce-style metric card: title, refresh tool, body slot, then a
 * footer with the underlying report link and its own freshness stamp.
 *
 * The stamp is per-card by design — it reflects when that Salesforce report
 * last refreshed, so a stale report shows a stale time rather than a wrong
 * number presented as current.
 */
export function MetricCard({
  title,
  /** Salesforce report name, shown in the footer as "View Report (name)". */
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
        {/* TODO: destination unconfirmed — brief open item 7. Currently points at
            the in-app report; may need to deep-link into Salesforce instead. */}
        <a className="sf-card-report" href="/reporting" title={`View Report (${report})`}>
          View Report ({report})
        </a>
        <span className="sf-card-stamp">As of {formatSalesforceStamp(asOf)}</span>
      </div>
    </section>
  );
}
