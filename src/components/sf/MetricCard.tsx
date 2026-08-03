"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { formatSalesforceStamp } from "@/lib/format";

/** "Goal Completion %" -> "goal-completion". Matches card titles 1:1 since
    every MetricCard/CoreMetricCard on both Home and /reporting is keyed by
    the same title string. */
function cardSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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
  const slug = cardSlug(title);

  return (
    <section className={`sf-card ${span}`} id={slug}>
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
        {/* TODO: destination unconfirmed — brief open item 7. Deep-links to this
            card's own place in the in-app Metrics catalog; may need to point at
            Salesforce directly instead. */}
        <a className="sf-card-report" href={`/reporting#${slug}`} title={`View Report (${report})`}>
          View Report ({report})
        </a>
        <span className="sf-card-stamp">As of {formatSalesforceStamp(asOf)}</span>
      </div>
    </section>
  );
}
