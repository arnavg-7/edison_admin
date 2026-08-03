"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { Bar, BarChart, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";
import type { SchoolRatio } from "@/lib/data/homeDashboardCharts";

/**
 * At/below target reuses the muted end of the app's fixed series scale so it
 * reads as ordinary data. Over target uses the app's own warn ink rather than
 * --sf-accent: theme.css reserves the accent for "act here" (CTAs, links,
 * active nav), and a bar is not an action. Warn also already means the same
 * thing in every status pill on the dashboard.
 */
const AT_TARGET_COLOR = "var(--sf-series-5)";
const OVER_TARGET_COLOR = "var(--sf-series-warn)";

/** One row's height. Bars stay this tall no matter how many schools there are;
    past VISIBLE_ROWS the body scrolls instead of squeezing them flat. */
const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 8;
/** Chart's own top/bottom margin, outside the rows. */
const CHART_VPAD = 16;

/** Room at the right for the "1 : 25" label drawn past the end of each bar. */
const VALUE_LABEL_SPACE = 52;
/** Clears the "Target 1 : 20" caption sitting above the threshold line. */
const CHART_TOP_SPACE = 20;

/** Round steps to choose an axis from, smallest first. */
const TICK_STEPS = [5, 10, 20, 25, 50, 100];
/** "4-5 tick marks is enough" — an axis here is for scale, not for reading
    values off; the end-of-bar labels carry the precision. */
const MAX_TICKS = 5;

function ratioFor(students: number, teachers: number): number {
  return teachers > 0 ? Math.round(students / teachers) : 0;
}

/**
 * Picks the smallest round step that fits the data in at most MAX_TICKS ticks,
 * then returns evenly spaced ticks. Letting Recharts derive ticks from a
 * `tickCount` produced a ragged last interval (0, 8, 16, 24, 30), which reads
 * as a mistake rather than a scale.
 *
 * The axis always covers the target as well as the longest bar, or the
 * threshold line would sit off-chart.
 */
function axisScale(maxRatio: number, target: number): { max: number; ticks: number[] } {
  const needed = Math.max(1, maxRatio, target);
  const step =
    TICK_STEPS.find((candidate) => Math.ceil((needed + 1) / candidate) + 1 <= MAX_TICKS) ??
    TICK_STEPS[TICK_STEPS.length - 1];
  const max = step * Math.ceil((needed + 1) / step);
  const ticks = Array.from({ length: max / step + 1 }, (_, index) => index * step);
  return { max, ticks };
}

type RatioRow = {
  school: string;
  teachers: number;
  students: number;
  ratio: number;
  ratioLabel: string;
  overTarget: boolean;
};

/**
 * chart-bar-horizontal: one bar per school, sorted worst-first.
 *
 * Replaces the stat-card grid, which needed a new tile per school and so stopped
 * working once the district had more than a handful. Bar length is the raw
 * students-per-teacher figure — not a percentage — so lengths are directly
 * comparable school to school, and the dashed line at the district target makes
 * over/under readable without a badge per row.
 */
export function RatioBarCard({
  title,
  schools,
  asOf,
  target,
  className
}: {
  title: string;
  schools: SchoolRatio[];
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  /** District target students-per-teacher; drives both the line and the colours. */
  target: number;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Independent per card: refreshing this chart never touches another card's
  // state, so two cards on the same screen never block on each other.
  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  // Highest ratio first, so the schools furthest over target are at the top
  // where they get read first.
  const rows = useMemo<RatioRow[]>(
    () =>
      schools
        .map((school) => {
          const ratio = ratioFor(school.students, school.teachers);
          return {
            school: school.school,
            teachers: school.teachers,
            students: school.students,
            ratio,
            ratioLabel: `1 : ${ratio}`,
            overTarget: ratio > target
          };
        })
        .sort((a, b) => b.ratio - a.ratio),
    [schools, target]
  );

  const chartConfig = useMemo<ChartConfig>(
    () => ({ ratio: { label: "Students per teacher" } }),
    []
  );

  const scale = useMemo(
    () => axisScale(Math.max(0, ...rows.map((row) => row.ratio)), target),
    [rows, target]
  );

  const chartHeight = rows.length * ROW_HEIGHT + CHART_VPAD + CHART_TOP_SPACE;
  const scrolls = rows.length > VISIBLE_ROWS;

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
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No schools reporting a ratio yet.
          </p>
        ) : (
          <>
            {/* Scrolls past VISIBLE_ROWS rather than compressing bars, so a
                20-school district stays legible instead of becoming hairlines. */}
            <div
              className={scrolls ? "overflow-y-auto pr-1" : undefined}
              style={
                scrolls
                  ? { maxHeight: VISIBLE_ROWS * ROW_HEIGHT + CHART_VPAD + CHART_TOP_SPACE }
                  : undefined
              }
            >
              {/* aspect-auto + explicit height: ChartContainer defaults to
                  aspect-video, which would fight a row-count-driven height. */}
              <ChartContainer
                config={chartConfig}
                className="aspect-auto w-full"
                style={{ height: chartHeight }}
              >
                <BarChart
                  accessibilityLayer
                  data={rows}
                  layout="vertical"
                  margin={{ top: CHART_TOP_SPACE, right: VALUE_LABEL_SPACE, bottom: 4, left: 4 }}
                  barCategoryGap={8}
                >
                  <XAxis
                    type="number"
                    domain={[0, scale.max]}
                    ticks={scale.ticks}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                  />
                  <YAxis
                    type="category"
                    dataKey="school"
                    width={148}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    interval={0}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelKey="school"
                        formatter={(_value, _name, item) => {
                          const row = item?.payload as RatioRow | undefined;
                          if (!row) return null;
                          return (
                            <div className="grid gap-0.5">
                              <span className="font-medium text-foreground">
                                {row.ratioLabel} teacher to students
                              </span>
                              <span className="text-muted-foreground">
                                {formatNumber(row.teachers)} teachers ·{" "}
                                {formatNumber(row.students)} students
                              </span>
                              <span className="text-muted-foreground">
                                {row.overTarget
                                  ? `Over the 1 : ${target} target`
                                  : `At or under the 1 : ${target} target`}
                              </span>
                            </div>
                          );
                        }}
                      />
                    }
                  />

                  {/*
                    Declared before <Bar> on purpose. A bar whose ratio is near
                    the target ends right at this line, and its end label would
                    then be drawn straight across the dashes. Painting the line
                    first puts the bars and their labels on top of it; the line
                    still reads clearly through the gaps between bars and above
                    and below the plot.
                  */}
                  <ReferenceLine
                    x={target}
                    stroke="var(--sf-text-muted)"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: `Target 1 : ${target}`,
                      position: "top",
                      fill: "var(--sf-text-muted)",
                      fontSize: 11
                    }}
                  />

                  <Bar dataKey="ratio" radius={4} isAnimationActive={false}>
                    {rows.map((row) => (
                      <Cell
                        key={row.school}
                        fill={row.overTarget ? OVER_TARGET_COLOR : AT_TARGET_COLOR}
                      />
                    ))}
                    {/*
                      The "1 : 19" text is why this can drop the stat tiles: the
                      exact ratio stays on screen without a hover.

                      A bar sitting near the target ends right at the threshold
                      line, putting its label on the dashes — and Recharts paints
                      reference lines in their own layer, so JSX order can't
                      resolve it. The card-coloured stroke under paintOrder
                      ="stroke" draws a halo behind the glyphs, masking the line
                      just around the text and leaving it visible either side.
                    */}
                    <LabelList
                      dataKey="ratioLabel"
                      position="right"
                      offset={8}
                      className="fill-foreground text-xs tabular-nums"
                      stroke="var(--sf-card)"
                      strokeWidth={3}
                      paintOrder="stroke"
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Students per teacher, highest first. Amber bars are above the district target of 1 :{" "}
              {target}.
            </p>
          </>
        )}
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
