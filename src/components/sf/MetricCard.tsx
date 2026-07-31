"use client";

import { formatSalesforceStamp } from "@/lib/format";

/**
 * The Salesforce-style metric card: title, refresh + expand tools, body slot,
 * then a footer with the underlying report link and its own freshness stamp.
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
            <RefreshIcon />
            <span className="sf-sr-only">Refresh {title}</span>
          </button>
          <button type="button" className="sf-card-tool" title={`Expand ${title}`}>
            <ExpandIcon />
            <span className="sf-sr-only">Expand {title}</span>
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

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M20 11.5A8 8 0 1 0 12 20a8 8 0 0 0 6.3-3" />
      <path d="M20 4.5V11h-6.2" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5" />
    </svg>
  );
}
