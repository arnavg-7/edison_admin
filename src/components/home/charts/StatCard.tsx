"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";

/**
 * A single steady-state figure with no trend to report yet (Number of
 * Students, Total Faculty) — shadcn's own stat-card anatomy (description,
 * big title, footer), without inventing a delta badge no data backs.
 */
export function StatCard({
  title,
  value,
  asOf,
  className
}: {
  title: string;
  value: number;
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Independent per card: refreshing this stat never touches another card's
  // state, so two cards on the same screen never block on each other.
  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl font-semibold tabular-nums text-[var(--sf-stat)]">
          {formatNumber(value)}
        </CardTitle>
        <CardAction>
          <button
            type="button"
            className="sf-card-tool"
            onClick={refresh}
            disabled={isRefreshing}
            title={`Refresh ${title}`}
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              strokeWidth={2}
              className={isRefreshing ? "animate-spin" : undefined}
            />
            <span className="sf-sr-only">Refresh {title}</span>
          </button>
        </CardAction>
      </CardHeader>

      {/* mt-auto: this card sits beside taller cards in the grid (the row
          stretches every card to match), and without it the footer would
          stay pinned right under the header, leaving a dead gap below it
          instead of anchoring to the card's actual bottom edge. */}
      <CardFooter className="mt-auto">
        <span className="sf-card-stamp">As of {formatSalesforceStamp(currentAsOf)}</span>
      </CardFooter>
    </Card>
  );
}
