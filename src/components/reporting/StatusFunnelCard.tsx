"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { FunnelChart, type FunnelStage } from "@/components/charts/funnel-chart";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";
import { ChartDownloadButton } from "@/components/shared/ChartDownloadButton";

export type StatusSlice = { label: string; value: number };

/** This is a status distribution, not a generic series — it reuses the same
    fixed ok/warn/neutral scale every StatusBadge draws from, rather than the
    chart-series palette, so "On Track" reads the same color here as it does
    everywhere else in the app. */
const STATUS_COLOR: Record<string, string> = {
  "On Track": "var(--sf-ok-text)",
  "At Risk": "var(--sf-warn-text)"
};
const DEFAULT_COLOR = "var(--sf-neutral-text)";

/**
 * chart-funnel: largest-to-smallest stages, reused for Students' Status.
 * Runs on the same @bklit/funnel-chart (visx + motion) Home's other rebuilt
 * cards draw from — see TrendStatCard's note on the library split.
 */
export function StatusFunnelCard({
  title,
  data,
  asOf,
  totalLabel = "Total",
  className
}: {
  title: string;
  data: StatusSlice[];
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  totalLabel?: string;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Independent per card: refreshing this funnel never touches another card's
  // state, so two cards on the same screen never block on each other.
  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  const total = data.reduce((sum, stage) => sum + stage.value, 0);

  // FunnelChart reads its stages largest-first (each stage narrows against
  // the first), so the source order must already be worst-first before it
  // gets here rather than being re-sorted inside the card.
  const stages: FunnelStage[] = data.map((stage) => ({
    label: stage.label,
    value: stage.value,
    color: STATUS_COLOR[stage.label] ?? DEFAULT_COLOR
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="sf-card-tools">
          {/* Share of total as well as the count — the funnel's widths encode
              the proportion, so exporting only counts drops what it shows. */}
          <ChartDownloadButton
            chartTitle={title}
            header={["Stage", "Students", "Share of total"]}
            rows={data.map((stage) => [
              stage.label,
              stage.value,
              total > 0 ? `${Math.round((stage.value / total) * 1000) / 10}%` : "0%"
            ])}
          />
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

      <CardContent>
        <FunnelChart data={stages} className="w-full" gap={6} />
        <p className="mt-2 text-xs text-muted-foreground">
          {formatNumber(total)} {totalLabel.toLowerCase()} total.
        </p>
      </CardContent>
    </Card>
  );
}
