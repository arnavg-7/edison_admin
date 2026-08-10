"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
  CATEGORY_LABEL,
  SEVERITY_TONE,
  needsAttentionOpenCount,
  topAttentionItems
} from "@/lib/data/needsAttention";
import { resolveDateWindow } from "@/lib/date-range";
import { formatSalesforceStamp } from "@/lib/format";
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
          {/* Same "Queue · All categories" strip the triage screen prints above
              its own list, so the two read as one queue seen at two depths.
              The note is fixed rather than filter-driven on purpose: Home has
              no category filter, so this excerpt is always every category —
              which is exactly what the reader needs told before they conclude
              six rows is the whole picture. */}
          <div className="sf-priority-banner-subhead">
            <h3>Queue</h3>
            {/* Both halves of "what am I not seeing": the note says this is
                every category, the link says there is more of it. The count
                is dropped while a school is selected — the triage queue is
                district-wide, so a scoped number on the way in would not
                match what the queue actually shows. */}
            <span className="sf-priority-banner-subhead-meta">
              <span className="sf-panel-note">All categories</span>
              <Link className="sf-inline-link" href="/needs-attention">
                {scope.school ? "View all →" : `View all (${open}) →`}
              </Link>
            </span>
          </div>

          <ul className="sf-priority-banner-list">
            {top.map((item) => (
              <li key={item.id}>
                {/* Subject alone left every row asserting something without
                    saying why — "12 unresolved alerts" reads as a fact rather
                    than a flag. The reason underneath is the rule that fired,
                    the same line the triage queue prints, so an admin can
                    judge whether a row is worth opening from Home. Category
                    and "Flagged …" are the same top-row detail the full triage
                    queue prints above its own subject — Home was missing both,
                    so a row here read as less informative than the one
                    "View all" links out to. */}
                <span className="sf-priority-banner-item">
                  <span className="sf-priority-banner-meta">
                    <span className="sf-triage-category">{CATEGORY_LABEL[item.category]}</span>
                    <span className="sf-triage-when">Flagged {formatSalesforceStamp(item.flaggedAt)}</span>
                  </span>
                  <span className="sf-priority-banner-subject">{item.subject}</span>
                  <span className="sf-priority-banner-reason">{item.reason}</span>
                </span>
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
        </>
      )}
    </div>
  );
}
