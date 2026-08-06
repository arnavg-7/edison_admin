"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { SEVERITY_TONE, needsAttentionOpenCount, topAttentionItems } from "@/lib/data/needsAttention";
import { resolveDateWindow } from "@/lib/date-range";
import { useReportFilters } from "@/lib/filters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/base/buttons/button";

/**
 * The first thing a Super Admin sees each morning: what needs a response,
 * not a curated count buried among steady-state enrollment cards.
 *
 * Client-side because it reads Home's filters straight from the URL, the same
 * `useReportFilters` state the page's filter bar writes. Items are narrowed by
 * `flaggedAt` — the one field on Home with a real timestamp to filter on — and
 * by the school/grade scope the metric cards above use.
 *
 * Unfiltered (every open item, any date) until the admin explicitly picks a
 * range from the filter bar. `useReportFilters` always resolves a *default*
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

  // Same scope as the metric cards above, so the whole page reads as one
  // filtered view rather than a filtered top half and an unfiltered bottom.
  const scope = { school: filters.school, grade: filters.grade };
  const open = needsAttentionOpenCount(window, scope);
  const top = topAttentionItems(6, window, scope);
  const hasAtRiskItem = top.some((item) => item.category === "at-risk");

  return (
    <div className="sf-priority-banner">
      <div className="sf-priority-banner-head">
        <p className="sf-priority-banner-eyebrow">Action Items</p>
        <h2>Needs Attention</h2>
      </div>

      {open === 0 ? (
        // "All clear" would overclaim once a filter is applied: nothing flagged
        // in this window, or for this school, is a different statement from
        // nothing flagged at all.
        <p className="sf-priority-banner-empty">
          <StatusBadge tone="ok">Nothing in scope</StatusBadge>
          {scope.school
            ? "No items were flagged for the selected school and grade. Widen the filters to see more."
            : "No items were flagged in the selected date range. Widen the range to see earlier items."}
        </p>
      ) : (
        <>
          <ul className="sf-priority-banner-list">
            {top.map((item) => (
              <li key={item.id}>
                <span className="sf-priority-banner-subject">{item.subject}</span>
                {/* Severity and the way out travel together: the row says how
                    urgent it is and, in the same glance, where to go and do
                    something about it. Each item already knows its own
                    destination, so the label names the screen rather than
                    saying a generic "View". */}
                <span className="sf-priority-banner-actions">
                  <StatusBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</StatusBadge>
                  <Button
                    color="secondary"
                    size="xs"
                    href={item.href}
                    iconTrailing={
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
                    }
                  >
                    {item.resolveLabel}
                  </Button>
                </span>
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
            {/* The count is dropped while a school is selected: the triage
                queue is district-wide, so a scoped number on the way in would
                not match what the queue actually shows. */}
            <Link className="sf-inline-link" href="/needs-attention">
              {scope.school ? "Open triage queue →" : `Open triage queue (${open}) →`}
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
