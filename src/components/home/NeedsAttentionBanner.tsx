"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SEVERITY_TONE, needsAttentionOpenCount, topAttentionItems } from "@/lib/data/needsAttention";
import { resolveDateWindow } from "@/lib/date-range";
import { useReportFilters } from "@/lib/filters";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * The first thing a Super Admin sees each morning: what needs a response,
 * not a curated count buried among steady-state enrollment cards.
 *
 * Client-side because it reads Home's date range straight from the URL, the
 * same `useReportFilters` state HomeFilterBar writes. Items are scoped by
 * `flaggedAt` — the one field on Home with a real timestamp to filter on.
 *
 * Unfiltered (every open item, any date) until the admin explicitly picks a
 * range from HomeFilterBar. `useReportFilters` always resolves a *default*
 * range ("Today") even with no `range` param in the URL, and every one of
 * the shared presets — including "Today" — is a narrow, completed-feeling
 * window; defaulting the banner to one made it read as empty on a normal
 * morning where nothing happens to be flagged in the last 24 hours. Checking
 * the raw search param (not `filters.range`) is what tells "no selection
 * yet" apart from "admin picked Today".
 */
export function NeedsAttentionBanner() {
  const { filters } = useReportFilters();
  const searchParams = useSearchParams();
  const hasExplicitRange = searchParams.has("range");

  const window = useMemo(
    () => (hasExplicitRange ? resolveDateWindow(filters.range, filters.from, filters.to) : undefined),
    [hasExplicitRange, filters.range, filters.from, filters.to]
  );

  const open = needsAttentionOpenCount(window);
  const top = topAttentionItems(6, window);
  const hasAtRiskItem = top.some((item) => item.category === "at-risk");

  return (
    <div className="sf-priority-banner">
      <div className="sf-priority-banner-head">
        <p className="sf-priority-banner-eyebrow">Action Items</p>
        <h2>Needs Attention</h2>
      </div>

      {open === 0 ? (
        // "All clear" would overclaim once a range is applied: nothing flagged
        // in this window is a different statement from nothing flagged at all.
        <p className="sf-priority-banner-empty">
          <StatusBadge tone="ok">Nothing in range</StatusBadge>
          No items were flagged in the selected date range. Widen the range to see earlier items.
        </p>
      ) : (
        <>
          <ul className="sf-priority-banner-list">
            {top.map((item) => (
              <li key={item.id}>
                <span className="sf-priority-banner-subject">{item.subject}</span>
                <StatusBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</StatusBadge>
              </li>
            ))}
          </ul>

          <div className="sf-priority-banner-foot">
            {open > top.length ? (
              <span className="sf-priority-banner-more">
                +{open - top.length} more open item{open - top.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span />
            )}
            <Link className="sf-inline-link" href="/needs-attention">
              Open triage queue ({open}) →
            </Link>
          </div>

          {hasAtRiskItem ? (
            <p className="sf-priority-banner-caveat">
              At-risk thresholds are provisional, not agreed rules. See the triage queue before
              acting.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
