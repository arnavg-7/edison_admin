"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { CartesianGrid, Line, LineChart, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatSalesforceStamp } from "@/lib/format";

const chartConfig: ChartConfig = { value: { label: "Value" } };

/**
 * A figure with a week-over-week delta and a short trend — Attendance Rate,
 * Goal Completion %, Assignment Completion Rate. A bare percentage says
 * nothing about direction on its own, so the badge and the area chart behind
 * it always travel together.
 *
 * The badge stays neutral (`variant="outline"`), matching shadcn's own
 * dashboard block: the app's ok/warn/error scale is reserved for status and
 * severity, and repurposing it for "this week's number moved" would blur
 * what that palette means everywhere else.
 */
export function TrendStatCard({
  title,
  value,
  delta,
  direction,
  series,
  asOf,
  className
}: {
  title: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  series: number[];
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Independent per card: refreshing this trend never touches another
  // card's state, so two cards on the same screen never block on each other.
  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  const chartData = useMemo(() => series.map((point, index) => ({ index, value: point })), [series]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Badge variant="outline">
            <HugeiconsIcon icon={direction === "up" ? ArrowUp01Icon : ArrowDown01Icon} size={12} strokeWidth={2.5} />
            {delta}
          </Badge>
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
        <ChartContainer config={chartConfig} className="aspect-auto h-20 w-full">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            {/* Hidden axis, but its domain is the whole point: with no
                explicit domain Recharts defaults to starting at 0, which
                flattens a ~1-5pt week-over-week move on a 60-95% scale into
                a barely-visible sliver near the top of the chart. Padding
                tightly around the real min/max is what makes the trend
                readable at all. */}
            <YAxis
              hide
              domain={([dataMin, dataMax]) => {
                const pad = Math.max((dataMax - dataMin) * 0.25, 0.3);
                return [dataMin - pad, dataMax + pad];
              }}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--sf-card-border)", strokeWidth: 1 }}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--sf-stat)"
              strokeWidth={2}
              dot={{ r: 2, fill: "var(--sf-stat)", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
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
