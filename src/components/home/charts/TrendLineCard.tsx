"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { LineChart } from "@/components/charts/line-chart";
import { Line } from "@/components/charts/line";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSalesforceStamp } from "@/lib/format";

const LINE_COLOR = "var(--sf-stat)";
const CHART_HEIGHT = 220;

/**
 * A plain trend line — no delta badge, no "+0.6 pts vs. last week" copy.
 * TrendStatCard's sparkline still carries that badge for the three KPI tiles
 * up top; this is the plain-chart version for Home's own Enrollment/
 * Attendance sections, where the brief was explicit: show the shape of the
 * week, not a claim about direction.
 *
 * Same zero-anchoring problem TrendStatCard solves, solved the same way: the
 * underlying chart floors a non-negative series' y-domain at zero, which
 * would flatten a 90-95% band into a hairline. `plot` is the series shifted
 * down by a padded baseline so the real range fills the chart; `formatValue`
 * adds the baseline back for the y-axis ticks, and the tooltip reads the true
 * `value` field, so nothing shifted ever reaches the screen.
 */
export function TrendLineCard({
  title,
  series,
  unit = "%",
  asOf,
  cadenceDays = 7,
  className
}: {
  title: string;
  series: number[];
  /** Appended to every displayed value — y-axis ticks and the tooltip. */
  unit?: string;
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  /** Days between points — see the note on TrendStatCard's own `cadenceDays`. */
  cadenceDays?: number;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  const { chartData, baseline } = useMemo(() => {
    const end = new Date(currentAsOf).getTime();
    const stepMs = cadenceDays * 24 * 60 * 60 * 1000;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const pad = Math.max((max - min) * 0.25, 0.3);
    const base = min - pad;

    return {
      baseline: base,
      chartData: series.map((point, index) => ({
        date: new Date(end - (series.length - 1 - index) * stepMs),
        plot: point - base,
        value: point
      }))
    };
  }, [series, currentAsOf, cadenceDays]);

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

      {/* flex-1 + min-h-0: this card shares a grid row with a bar chart whose
          height comes from its category count, and the row stretches every card
          to the tallest. With a fixed-height plot the line finished ~135px above
          the card's bottom edge, leaving a band of empty card under it while its
          neighbour ran to the edge. Filling the row instead lands both plots on
          the same baseline. */}
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div style={{ minHeight: CHART_HEIGHT }} className="w-full flex-1">
          <LineChart
            data={chartData}
            xDataKey="date"
            margin={{ top: 16, right: 16, bottom: 28, left: 44 }}
            className="h-full w-full"
          >
            <Grid horizontal />
            <YAxis formatValue={(value) => `${Math.round((value + baseline) * 10) / 10}${unit}`} />
            <XAxis />
            <Line dataKey="plot" stroke={LINE_COLOR} strokeWidth={2} />
            <ChartTooltip
              showDatePill={false}
              content={({ point }) => (
                <TooltipContent
                  rows={[
                    {
                      color: LINE_COLOR,
                      label: title,
                      value: typeof point.value === "number" ? `${point.value}${unit}` : "—"
                    }
                  ]}
                />
              )}
            />
          </LineChart>
        </div>
      </CardContent>
    </Card>
  );
}
