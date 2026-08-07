"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDownRight01Icon, ArrowUpRight01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { AreaChart } from "@/components/charts/area-chart";
import { AreaChartLoading } from "@/components/charts/area-chart-loading";
import { Area } from "@/components/charts/area";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatSalesforceStamp } from "@/lib/format";

/** Bklit's own default series colour is near-white and vanishes on a light card,
    so the fill and stroke are the app's stat tone — the same colour the big
    figures use. */
const LINE_COLOR = "var(--sf-stat)";

/** Plot height. The chart fills a sized parent when `aspectRatio` is omitted. */
const CHART_HEIGHT = 88;

/**
 * A figure with a short trend line and an optional week-over-week badge —
 * Attendance Rate, Goal Completion %, Assignment Completion Rate on Reporting
 * & Analytics, where the period is the point. Home dropped the badge (its
 * figures are scoped by the page's school/grade filter, and a delta against
 * an unscoped previous week would be comparing two different populations) —
 * pass no `delta`/`direction` there and no badge renders.
 *
 * Runs on @bklit/area-chart (visx), not the shadcn/Recharts chart the other
 * Home cards use — see the note on `cadenceDays` for the one wrinkle that
 * caused.
 */
export function TrendStatCard({
  title,
  value,
  delta,
  direction,
  series,
  asOf,
  cadenceDays = 7,
  className
}: {
  title: string;
  value: string;
  /**
   * Week-over-week change. Optional: Home dropped it (the figure there is
   * scoped by the page filter, and a delta against an unscoped previous week
   * would be comparing two different populations), while Reporting — where the
   * period is the point — still shows it. Omit both to render no badge.
   */
  delta?: string;
  direction?: "up" | "down";
  series: number[];
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  /**
   * Days between points. Bklit's LineChart is time-series only — its x-scale is
   * a visx `scaleTime` that coerces every x value to a Date — but `series` is
   * bare numbers with no timestamps. So dates are derived backwards from `asOf`
   * at this cadence purely to give the scale something to lay points out on.
   *
   * 7 because the card's own delta reads "vs. last week". That is an assumption,
   * not a fact in the data, which is why no date is ever shown: there is no
   * x-axis and the tooltip's date pill is off. The spacing is even either way,
   * so an incorrect cadence cannot distort the shape of the line.
   *
   * TODO: have the data supply real timestamps per point, then drop this.
   */
  cadenceDays?: number;
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

  /*
   * Two fields per point, and the reason is Bklit's y-domain.
   *
   * Its `resolveTimeSeriesYDomain` anchors any non-negative series at zero
   * (`[0, max * 1.1]`) and exposes no override. These figures live in a 60-95%
   * band, so a 1-5pt week-over-week move renders as ~1% of the plot height —
   * a flat line, which is the one thing this card exists to show.
   *
   * `plot` is therefore the value shifted down by a padded baseline, so the
   * zero-anchored domain lands snugly around the real range. Shifting is a
   * linear translation, so the shape of the line is unchanged. `value` keeps
   * the true figure alongside it and is what the tooltip reads — the invented
   * baseline never reaches the screen, and there is no y-axis to mislabel.
   */
  const chartData = useMemo(() => {
    const end = new Date(currentAsOf).getTime();
    const stepMs = cadenceDays * 24 * 60 * 60 * 1000;
    const min = Math.min(...series);
    const max = Math.max(...series);
    // Same padding the Recharts version used, so the line keeps clear of the
    // top and bottom edges instead of touching them.
    const pad = Math.max((max - min) * 0.25, 0.3);
    const baseline = min - pad;

    return series.map((point, index) => ({
      date: new Date(end - (series.length - 1 - index) * stepMs),
      plot: point - baseline,
      value: point
    }));
  }, [series, currentAsOf, cadenceDays]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
        <CardAction className="flex items-center gap-2">
          {delta ? (
            <Badge variant="outline">
              <HugeiconsIcon
                icon={direction === "down" ? ArrowDownRight01Icon : ArrowUpRight01Icon}
                size={12}
                strokeWidth={2.5}
              />
              {delta}
            </Badge>
          ) : null}
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
        {/* Fixed-height wrapper, not aspectRatio, on both branches: height
            needs to stay the same three-cards-in-a-row constant whether the
            card is showing the real chart or its loading state. */}
        <div style={{ height: CHART_HEIGHT }} className="w-full">
          {isRefreshing ? (
            // Sweep, not the default pulse: a pulse traveling along a fake
            // flat line would read as this card's own trend, which is
            // exactly the wrong thing to suggest while the real one is
            // mid-refresh. The diagonal sweep reads as "loading" with no
            // implied shape.
            <AreaChartLoading
              loadingStyle="sweep"
              stroke={LINE_COLOR}
              label={`Refreshing ${title}`}
              className="h-full w-full"
            />
          ) : (
            <AreaChart
              data={chartData}
              xDataKey="date"
              // Bklit defaults to 40px on every side, which would leave almost
              // no plot in a card this short. No axis or labels sit outside
              // the area, so the margin only needs to clear the stroke and
              // hover markers.
              margin={{ top: 6, right: 6, bottom: 6, left: 6 }}
              className="h-full w-full"
            >
              <Area
                // The shifted field, not the raw one — see the chartData note.
                dataKey="plot"
                fill={LINE_COLOR}
                stroke={LINE_COLOR}
                strokeWidth={2}
                // Kept low: the fill is here to give the line weight, not to be
                // read as a quantity. The area's baseline is the shifted zero, not
                // a true zero, so a heavy fill would imply a magnitude that isn't
                // real — see the chartData note.
                fillOpacity={0.18}
                // Off: the fade lightens the stroke exactly where the newest and
                // oldest points are, which is the part being read.
                fadeEdges={false}
              />
              {/*
                Full `content` override rather than `rows`. The dates behind this
                scale are derived (see `cadenceDays`), and Bklit's default tooltip
                titles each point with one ("Fri, Jun 26") — `showDatePill` only
                hides the pill at the bottom, not that title. Rendering the box
                directly is the only way to keep an invented date off the screen.
              */}
              <ChartTooltip
                showDatePill={false}
                content={({ point }) => (
                  <TooltipContent
                    rows={[
                      {
                        color: LINE_COLOR,
                        label: title,
                        value: typeof point.value === "number" ? `${point.value}` : "—"
                      }
                    ]}
                  />
                )}
              />
            </AreaChart>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
