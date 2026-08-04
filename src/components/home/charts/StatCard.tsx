"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";

/**
 * A single steady-state figure with no trend to report yet (Number of
 * Students, Total Faculty) — shadcn's own stat-card anatomy (description over
 * a big title), without inventing a delta badge no data backs.
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
            title={`Refresh ${title}, last updated ${formatSalesforceStamp(currentAsOf)}`}
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
    </Card>
  );
}
