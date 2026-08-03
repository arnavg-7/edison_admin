"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";

export type DistributionSlice = { label: string; value: number };

/** Same fixed series scale every other chart in the app draws from
    (theme.css --sf-series-1..5), so this donut reads as one palette with the
    rest of the dashboard rather than a one-off Recharts default. */
const SERIES_COLOR_VARS = [
  "var(--sf-series-1)",
  "var(--sf-series-2)",
  "var(--sf-series-3)",
  "var(--sf-series-4)",
  "var(--sf-series-5)"
];

/** A residual bucket reads as vague if it's just another wedge in the
    rotation — giving it the app's own "de-emphasized text" tone instead of a
    category color marks it as "not a real segment" at a glance, on top of
    the explicit label. */
const OTHER_TONE_VAR = "var(--sf-text-dim)";
const OTHER_LABEL_PATTERN = /^(other|unassigned)\b/i;

/**
 * chart-pie-donut-text: total centered in the ring, segments sorted largest
 * to smallest, ChartLegend/ChartLegendContent below. Reused as-is for both
 * Student Count By School and Students' Status so the two distribution cards
 * are visually the same chart, just fed different data.
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

  const total = useMemo(() => data.reduce((sum, slice) => sum + slice.value, 0), [data]);

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    let seriesIndex = 0;
    return sorted.map((slice) => {
      const isOther = OTHER_LABEL_PATTERN.test(slice.label);
      const fill = isOther ? OTHER_TONE_VAR : SERIES_COLOR_VARS[seriesIndex % SERIES_COLOR_VARS.length];
      if (!isOther) seriesIndex += 1;
      return { label: slice.label, value: slice.value, fill };
    });
  }, [data]);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = { value: { label: title } };
    for (const slice of chartData) {
      config[slice.label] = { label: slice.label, color: slice.fill };
    }
    return config;
  }, [chartData, title]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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

      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-64">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="label" />} />
            <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={64} outerRadius={92} strokeWidth={2}>
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                        {formatNumber(total)}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 20} className="fill-muted-foreground text-xs">
                        {totalLabel}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            {/* Legend defaults to itemSorter="value" (alphabetical by label),
                which silently undoes the largest-to-smallest sort applied
                above — itemSorter={null} keeps the legend in the same order
                as the ring instead of re-sorting it a second time. */}
            <ChartLegend content={<ChartLegendContent nameKey="label" />} itemSorter={null} />
          </PieChart>
        </ChartContainer>
      </CardContent>

      {/* mt-auto: keeps the footer anchored to the card's bottom edge when a
          taller sibling in the same grid row stretches this card past its
          own content height. */}
      <CardFooter className="mt-auto">
        <span className="sf-card-stamp">As of {formatSalesforceStamp(currentAsOf)}</span>
      </CardFooter>
    </Card>
  );
}
