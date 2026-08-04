"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import { Legend, LegendItem, LegendLabel, LegendMarker } from "@/components/charts/legend";
import { formatSalesforceStamp } from "@/lib/format";
import { ChartSortButton } from "@/components/shared/ChartSortButton";
import { sortChartItems, type ChartSortMode } from "@/lib/chart-sort";

export type DistributionSlice = { label: string; value: number };

/** Donut-only palette (theme.css --sf-donut-1..5) — deliberately its own
    scale rather than --sf-series-1..5, which every bar/funnel chart on
    Reporting & Analytics also draws from. That scale's pale blue-grays
    (series-3/5) sat too close to each other and to the "Unassigned" slice's
    own neutral tone; this set alternates hue/value across the same
    blue/purple/teal family so every wedge stays distinct at a glance. */
const SERIES_COLOR_VARS = [
  "var(--sf-donut-1)",
  "var(--sf-donut-2)",
  "var(--sf-donut-3)",
  "var(--sf-donut-4)",
  "var(--sf-donut-5)"
];

/** A residual bucket reads as vague if it's just another wedge in the
    rotation — giving it the app's own "de-emphasized text" tone instead of a
    category color marks it as "not a real segment" at a glance, on top of
    the explicit label. */
const OTHER_TONE_VAR = "var(--sf-text-dim)";
const OTHER_LABEL_PATTERN = /^(other|unassigned)\b/i;

/**
 * Total centered in the ring, largest segment first by default (re-orderable
 * from the header), legend beside it. Shared by Home and Reporting & Analytics
 * so the same distribution reads identically on both.
 *
 * Built on the in-repo visx pie primitives (PieChart/PieSlice/PieCenter) with
 * the matching Legend, not Recharts: hover is one piece of shared state here, so
 * pointing at either the ring or a legend row lifts that slice, fades the rest
 * and swaps the centre total for that segment's own figure. That replaces the
 * old floating tooltip — the number appears where the reader is already looking.
 */
export function DistributionDonutCard({
  title,
  data,
  asOf,
  totalLabel = "Total",
  className
}: {
  title: string;
  data: DistributionSlice[];
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  totalLabel?: string;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Largest slice first by default; the reader can re-order from the header. */
  const [sortMode, setSortMode] = useState<ChartSortMode>("value-desc");

  // Independent per card: refreshing this donut never touches another card's
  // state, so two cards on the same screen never block on each other.
  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  /** One hover index drives the ring, the centre figure and the legend at once. */
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    /*
      Colour is assigned from the largest-first order and then travels with the
      label, so changing the sort re-orders the ring without recolouring it. If
      the palette were handed out in display order instead, sorting A–Z would
      silently repaint every school — the reader would think the data changed.
    */
    const byValue = sortChartItems(data, "value-desc", {
      label: (slice) => slice.label,
      value: (slice) => slice.value
    });

    let seriesIndex = 0;
    const colored = byValue.map((slice) => {
      const isOther = OTHER_LABEL_PATTERN.test(slice.label);
      const color = isOther ? OTHER_TONE_VAR : SERIES_COLOR_VARS[seriesIndex % SERIES_COLOR_VARS.length];
      if (!isOther) seriesIndex += 1;
      return { label: slice.label, value: slice.value, color };
    });

    return sortChartItems(colored, sortMode, {
      label: (slice) => slice.label,
      value: (slice) => slice.value
    });
  }, [data, sortMode]);

  /** Same array, same order as the ring — index i is slice i in both. */
  const legendItems = chartData;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="sf-card-tools">
          <ChartSortButton value={sortMode} onChange={setSortMode} chartTitle={title} />
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
        {/* Ring and legend side by side, wrapping to stacked on a narrow card.
            The legend is a vertical list, so it holds long school names on one
            line each instead of the centred wrap-anywhere row it replaces. */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {/* No fixed `size`: PieChart falls back to filling this wrapper's
              width (ParentSize), so the ring actually grows to use a wide
              card's real estate instead of sitting at one guessed pixel
              value regardless of how much room the card has. Capped so it
              doesn't overwhelm an ultra-wide card. */}
          <div className="w-full max-w-[340px] shrink-0">
            <PieChart
              data={chartData}
              hoveredIndex={hoveredIndex}
              innerRadius={110}
              onHoverChange={setHoveredIndex}
            >
              {chartData.map((slice, index) => (
                <PieSlice animate={false} index={index} key={slice.label} />
              ))}
              <PieCenter defaultLabel={totalLabel} />
            </PieChart>
          </div>

          <Legend
            className="min-w-0 flex-1 basis-64 gap-1.5"
            hoveredIndex={hoveredIndex}
            items={legendItems}
            onHoverChange={setHoveredIndex}
          >
            <LegendItem className="flex items-center gap-2">
              <LegendMarker className="h-2.5 w-2.5" />
              <LegendLabel className="truncate text-sm font-normal" />
            </LegendItem>
          </Legend>
        </div>
      </CardContent>
    </Card>
  );
}
