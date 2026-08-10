"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { useChart, useChartStable } from "@/components/charts/chart-context";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ChartSortButton } from "@/components/shared/ChartSortButton";
import { ChartDownloadButton } from "@/components/shared/ChartDownloadButton";
import { sortChartItems, type ChartSortMode } from "@/lib/chart-sort";
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

/**
 * Bklit's `<Bar fill>` is one colour for the whole series, with no per-datum
 * equivalent of Recharts' `<Cell>`. Over/under target is carried by two
 * *stacked* series instead: each school puts its ratio in exactly one of these
 * keys and leaves the other at zero, so one full-length bar is drawn in the
 * right colour.
 *
 * Stacked rather than grouped on purpose — grouped would split each category
 * band between both keys and draw every bar at half thickness. The unused key
 * costs nothing: Bklit only floors short bars to `minBarHeight` when a chart is
 * *not* stacked, so a zero renders no bar rather than a stub at the axis.
 */
const OVER_KEY = "overTarget";
const UNDER_KEY = "atTarget";

/** One row's height. Bars stay this tall no matter how many schools there are;
    past VISIBLE_ROWS the body scrolls instead of squeezing them flat. Sized
    generously (rather than just enough to fit the label) so a short school
    list still gives each bar real breathing room instead of a cramped strip
    at the top of a much taller card. */
const ROW_HEIGHT = 60;
const VISIBLE_ROWS = 8;
/** Fraction of each row given to the gap between bars, not the bar itself —
    wider than Bklit's own 0.2 default so bars read as separate rows rather
    than a nearly continuous stack. */
const BAR_GAP = 0.35;

/** Category-label column down the left, wide enough for "James Madison
    Intermediate" over two lines without truncating it. */
const LABEL_WIDTH = 148;
/** Room at the right for the "1 : 25" label drawn past the end of each bar. */
const VALUE_LABEL_SPACE = 52;
/** Clears the "Target 1 : 20" caption sitting above the threshold line. */
const CHART_TOP_SPACE = 32;
/** Strip along the bottom holding the value-axis ticks. */
const TICK_AXIS_HEIGHT = 32;

/** "4-5 tick marks is enough" — the axis here is for scale, not for reading
    values off; the end-of-bar labels carry the precision. */
const AXIS_TICK_COUNT = 4;

/**
 * Radius on the bar's value end. Applied as a CSS `border-radius` on the overlay
 * bar rather than an SVG `rx`, which is what lets the app's universal
 * `corner-shape: squircle` smooth it — see the note in ValueAxisOverlay.
 *
 * 10px on a 34px bar: well under the half-thickness point where a squircle stops
 * reading as a smoothed rectangle and turns into a lozenge (theme.css keeps
 * genuine pills on `corner-shape: round` for that reason).
 */
const BAR_RADIUS = 10;

/**
 * Why a stack gap exists on a chart with nothing actually stacked.
 *
 * Bklit rounds a stacked segment only when it is the last series
 * (`applyRounding = !stacked || stackGap > 0 || isLastSeries`) — sensible for a
 * real stack, where rounding an interior segment would put a curve in the middle
 * of a bar. Here, though, each row's value sits in exactly one of the two series,
 * so every segment *is* the end of its bar: rows coloured by the first series
 * (at target) came out with a square right end while rows coloured by the second
 * (over target) were rounded — visible as flat-ended blue bars next to
 * round-ended amber ones.
 *
 * A positive `stackGap` is the one supported way to opt every segment into
 * rounding. Its geometric cost is `stackGap` px of width on the non-last series
 * and the same shift on the last, so it is set as small as possible: sub-pixel,
 * invisible, while still satisfying `> 0`.
 */
const STACK_GAP = 0.01;

function ratioFor(students: number, teachers: number): number {
  return teachers > 0 ? Math.round(students / teachers) : 0;
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
 * Everything measured against the value axis: the category labels, the axis
 * ticks, the dashed target line and the end-of-bar ratio labels.
 *
 * All four are HTML portalled into the chart container rather than SVG inside
 * `<BarChart>`, for two reasons. Bklit ships no value axis for a horizontal bar
 * chart — `BarXAxis` positions along the category band (it is the *vertical*
 * chart's category axis), and `BarYAxis`, the horizontal chart's category axis,
 * hard-caps labels at 70px, which cuts this district's school names into
 * nonsense. And every position here is read from the chart's own scale through
 * `useChart()` — the same scale `<Bar>` measures bar length with — so a label
 * cannot drift from the bar it belongs to. `BarChartCard` uses this same
 * technique for its category column.
 */
function ValueAxisOverlay({ rows, target }: { rows: RatioRow[]; target: number }) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const container = containerRef.current;
  if (!mounted || !container || !barScale) return null;

  return <ValueAxisOverlayInner rows={rows} target={target} container={container} />;
}

function ValueAxisOverlayInner({
  rows,
  target,
  container
}: {
  rows: RatioRow[];
  target: number;
  container: HTMLDivElement;
}) {
  // In horizontal orientation Bklit exposes the *value* scale as `yScale`
  // (bar-chart.tsx: `yScale: isHorizontal ? valueScale : primaryYScale`).
  const { margin, yScale, barScale, bandWidth, innerHeight, hoveredBarIndex } = useChart();
  if (!barScale || !bandWidth) return null;

  const x = (value: number) => margin.left + (yScale(value) ?? 0);
  const domainMax = yScale.domain()[1] ?? 0;
  const ticks = yScale.ticks(AXIS_TICK_COUNT);

  /*
    Bklit hardcodes the value domain to [0, max × 1.1] with `nice: true` and
    offers no way to widen it, so a target above every school's ratio would fall
    outside the plot. Drawing the line at a clamped position would put it at a
    value that isn't the target, so it is omitted in that case instead — the
    caption under the chart still states the target in words.
  */
  const targetInRange = target <= domainMax;

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {rows.map((row, index) => {
        const top = (barScale(row.school) ?? 0) + margin.top;
        return (
          <div key={row.school}>
            {/*
              The bar itself, drawn here rather than by the library's <rect>.

              Two things follow from that. `border-radius: 0 R R 0` rounds only
              the value end, so a bar measured from zero meets its axis flush —
              an SVG rect has one `rx` across all four corners and no per-side
              option, which previously took a masking block to hide. And the
              app's universal `corner-shape: squircle` applies, because that is a
              CSS property and cannot reach an `rx` attribute: these were the one
              shape in the product still drawing circular arcs.

              The <Bar> elements stay mounted but transparent. They still define
              the series, so the value domain and the tooltip payload come from
              the library as before; hover is driven by a full-plot rect and the
              SVG's own onMouseMove (bar-chart.tsx), not by the bar rects, so
              nothing is lost by not painting them.

              Dimming mirrors the library's own `fadedOpacity` of 0.3 on
              non-hovered bars, keyed off the same `hoveredBarIndex`.
            */}
            <div
              className="absolute"
              style={{
                top,
                left: margin.left,
                width: Math.max(0, (yScale(row.ratio) ?? 0) - (yScale(0) ?? 0)),
                height: bandWidth,
                background: row.overTarget ? OVER_TARGET_COLOR : AT_TARGET_COLOR,
                borderRadius: `0 ${BAR_RADIUS}px ${BAR_RADIUS}px 0`,
                opacity: hoveredBarIndex !== null && hoveredBarIndex !== index ? 0.3 : 1,
                transition: "opacity 0.15s ease-in-out"
              }}
            />

            {/* Category label */}
            <div
              className="absolute left-0 flex items-center justify-end pr-3 text-right"
              style={{ top, height: bandWidth, width: LABEL_WIDTH - 12 }}
            >
              <span className="text-xs text-muted-foreground">{row.school}</span>
            </div>

            {/* End-of-bar ratio label — the reason this card can replace a grid
                of stat tiles: the exact ratio stays on screen without a hover. */}
            <div
              className="absolute flex items-center"
              style={{ top, height: bandWidth, left: x(row.ratio) + 8 }}
            >
              <span className="text-xs tabular-nums text-foreground">{row.ratioLabel}</span>
            </div>
          </div>
        );
      })}

      {/* Dashed target line, plus its caption above the plot. */}
      {targetInRange ? (
        <>
          <div
            className="absolute border-l border-dashed"
            style={{
              left: x(target),
              top: margin.top,
              height: innerHeight,
              borderColor: "var(--sf-text-muted)"
            }}
          />
          <div
            className="absolute -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
            style={{ left: x(target), top: 0 }}
          >
            Target 1 : {target}
          </div>
        </>
      ) : null}

      {/* Value-axis ticks. */}
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground"
          style={{ left: x(tick), top: margin.top + innerHeight + 6 }}
        >
          {tick}
        </div>
      ))}
    </div>,
    container
  );
}

/**
 * chart-bar-horizontal on Bklit's `<BarChart>` — the same engine every other
 * chart card on Home and Reporting & Analytics runs, so this card is no longer
 * the one Recharts holdout among them.
 *
 * One bar per school. Bar length is the raw students-per-teacher figure — not a
 * percentage — so lengths are directly comparable school to school, and the
 * dashed line at the district target makes over/under readable without a badge
 * per row.
 *
 * Horizontal only, deliberately: a school list grows, and rows can scroll,
 * where a widening row of columns can only squeeze its bars thinner and stack
 * its category labels on top of one another.
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
  /** Highest ratio first by default, so the schools furthest over target are at
      the top where they get read first — the reader can re-order from there. */
  const [sortMode, setSortMode] = useState<ChartSortMode>("value-desc");

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

  const rows = useMemo<RatioRow[]>(() => {
    const mapped = schools.map((school) => {
      const ratio = ratioFor(school.students, school.teachers);
      return {
        school: school.school,
        teachers: school.teachers,
        students: school.students,
        ratio,
        ratioLabel: `1 : ${ratio}`,
        overTarget: ratio > target
      };
    });

    // Sorts on the rounded `ratio` the bars actually draw, not on raw
    // students/teachers — otherwise two schools showing "1 : 21" could order
    // as though one were larger, contradicting the labels beside them.
    return sortChartItems(mapped, sortMode, {
      label: (row) => row.school,
      value: (row) => row.ratio
    });
  }, [schools, target, sortMode]);

  const data = useMemo(
    () =>
      rows.map((row) => ({
        name: row.school,
        /*
          The unused key is left `undefined`, not 0. Zero is a number, so Bklit
          draws it — and in a stacked horizontal chart the zero segment's width
          is computed as `scale(0) - scale(stackOffset)`, which for the *second*
          series of a row whose value sits in the first is negative. That
          rendered no visible bar but emitted an SVG "negative value is not
          valid" error on every animation frame. `undefined` fails Bklit's
          `typeof value === "number"` guard in both the bar renderer and the
          stack-offset pass, so the segment is skipped outright.
        */
        [OVER_KEY]: row.overTarget ? row.ratio : undefined,
        [UNDER_KEY]: row.overTarget ? undefined : row.ratio,
        // Carried for the tooltip. Extra keys are safe: the value domain sums
        // the rendered <Bar> series only, not every key on the row.
        ratioLabel: row.ratioLabel,
        teachers: row.teachers,
        students: row.students,
        over: row.overTarget
      })),
    [rows]
  );

  const chartHeight = rows.length * ROW_HEIGHT + CHART_TOP_SPACE + TICK_AXIS_HEIGHT;
  const scrolls = rows.length > VISIBLE_ROWS;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="sf-card-tools">
          {/* Teachers and students as well as the ratio: the ratio alone can't
              be checked or recomputed once it's out of the app. */}
          <ChartDownloadButton
            chartTitle={title}
            header={["School", "Teachers", "Students", "Students per teacher", "Over target"]}
            rows={rows.map((row) => [
              row.school,
              row.teachers,
              row.students,
              row.ratio,
              row.overTarget ? "Yes" : "No"
            ])}
          />
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
                  ? { maxHeight: VISIBLE_ROWS * ROW_HEIGHT + CHART_TOP_SPACE + TICK_AXIS_HEIGHT }
                  : undefined
              }
            >
              <div style={{ height: chartHeight }} className="w-full">
                <BarChart
                  data={data}
                  xDataKey="name"
                  orientation="horizontal"
                  stacked
                  barGap={BAR_GAP}
                  margin={{
                    top: CHART_TOP_SPACE,
                    right: VALUE_LABEL_SPACE,
                    bottom: TICK_AXIS_HEIGHT,
                    left: LABEL_WIDTH
                  }}
                  className="h-full w-full"
                  aspectRatio="auto"
                >
                  {/* vertical, not horizontal: the value axis runs left to right
                      here, so the gridlines that mean anything are the upright
                      ones crossing the bars. */}
                  <Grid horizontal={false} vertical fadeVertical />

                  {/*
                    Mounted but not painted. These still declare the two series,
                    so the value domain and the tooltip payload are the library's
                    as before — but the visible bar is drawn in ValueAxisOverlay,
                    where CSS gives it the app's squircle corners and a radius on
                    the value end only. See the note there.

                    animate={false} because there is nothing to animate now, and
                    the overlay bar is not tied to the rect's growth.
                  */}
                  <Bar
                    dataKey={UNDER_KEY}
                    fill="transparent"
                    stackGap={STACK_GAP}
                    animate={false}
                  />
                  <Bar
                    dataKey={OVER_KEY}
                    fill="transparent"
                    stackGap={STACK_GAP}
                    animate={false}
                  />

                  <ValueAxisOverlay rows={rows} target={target} />

                  <ChartTooltip
                    showDatePill={false}
                    content={({ point }) => (
                      <TooltipContent
                        title={String(point.name ?? "")}
                        rows={[
                          {
                            color: point.over ? OVER_TARGET_COLOR : AT_TARGET_COLOR,
                            label: "Students per teacher",
                            value: String(point.ratioLabel ?? "—")
                          },
                          {
                            color: "transparent",
                            label: "Teachers",
                            value:
                              typeof point.teachers === "number"
                                ? formatNumber(point.teachers)
                                : "—"
                          },
                          {
                            color: "transparent",
                            label: "Students",
                            value:
                              typeof point.students === "number"
                                ? formatNumber(point.students)
                                : "—"
                          },
                          {
                            color: "transparent",
                            label: point.over ? "Over target" : "At or under target",
                            value: `1 : ${target}`
                          }
                        ]}
                      />
                    )}
                  />
                </BarChart>
              </div>
            </div>

            {/* No claim about order — the reader can change it from the header,
                and a caption asserting "highest first" would go stale the moment
                they did. */}
            <p className="mt-2 text-xs text-muted-foreground">
              Students per teacher. Amber bars are above the district target of 1 : {target}.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
