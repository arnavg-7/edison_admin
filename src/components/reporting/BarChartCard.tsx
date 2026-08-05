"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { RefreshIcon } from "@hugeicons/core-free-icons";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { YAxis } from "@/components/charts/y-axis";
import { useChart, useChartStable } from "@/components/charts/chart-context";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SERIES_VARS, type BarGroup, type SeriesKey } from "@/components/sf/charts";
import { ChartSortButton } from "@/components/shared/ChartSortButton";
import {
  CHART_SORT_MODES_WITH_SOURCE,
  sortChartItems,
  type ChartSortMode
} from "@/lib/chart-sort";
import { formatNumber, formatSalesforceStamp } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One category's height and the chart's own top/bottom margin, outside the
    rows — same constants RatioBarCard uses, so every horizontal bar card on
    this screen keeps the same rhythm. */
const ROW_HEIGHT = 40;
const CHART_VPAD = 16;
const VISIBLE_ROWS = 8;

/**
 * Bar thickness is fixed and the *spacing* is derived from it, rather than the
 * other way round.
 *
 * Bklit sizes a bar as a fraction of its category band, and the band as plot
 * height ÷ category count — so with a filled plot, thickness swung with however
 * tall the row made the card (90px bars on a three-category report next to 36px
 * on a five-row neighbour). Overriding `barWidth` fixes thickness but draws each
 * bar at the *top* of its band, dumping all the slack below it and leaving a gap
 * between the last bar and the axis.
 *
 * Sizing the band to its bars and pushing the slack into the scale's `padding`
 * instead gives a fixed thickness with even gaps and nothing left dangling at
 * the bottom.
 */
const BAR_THICKNESS = 27;
/** Thinner where a category is split between series, or a three-series report
    would stand three times as tall as a single-series one for the same rows. */
const BAR_THICKNESS_GROUPED = 14;
/** Bklit's own default gap between bars within one category. */
const GROUP_GAP = 4;
/** Whitespace between one category and the next. */
const ROW_GAP = 28;

/** The bars of one category, stacked thickness only — no surrounding gap. */
function bandHeightFor(seriesCount: number): number {
  const thickness = seriesCount > 1 ? BAR_THICKNESS_GROUPED : BAR_THICKNESS;
  return seriesCount * thickness + Math.max(0, seriesCount - 1) * GROUP_GAP;
}

/** Fixed height for the vertical (column) orientation: unlike the horizontal
    list, height here isn't driven by category count, so there's no row-count
    formula to size it by. */
const VERTICAL_CHART_HEIGHT = 280;

/** Radius on the bar's value end, matching RatioBarCard. Applied as a CSS
    `border-radius` on the overlay bar rather than an SVG `rx`, which is what lets
    the app's universal `corner-shape: squircle` smooth it — see OverlayBars.
    Capped there at half a bar's thickness, since the 14px grouped bars would
    otherwise turn into lozenges. */
const BAR_RADIUS = 10;

/** Strip along the bottom holding the horizontal chart's value-axis ticks —
    matches RatioBarCard's own axis strip height. */
const TICK_AXIS_HEIGHT = 24;
/** "4-6 tick marks is enough" — same call RatioBarCard makes: the axis is for
    scale, not for reading exact values off (the tooltip carries those). Also
    passed to <Grid numTicksColumns> so the gridlines land on these same ticks. */
const AXIS_TICK_COUNT = 6;

/**
 * Category-axis labels for a horizontal BarChart. Bklit's own `BarYAxis`
 * truncates every label to 70px, which reads fine for its own demos but
 * clips this app's school and student names into nonsense — so this reimplements
 * the same positioning (via the same public `useChart`/`useChartStable` hooks
 * `BarYAxis` uses) without that cap, and adds an optional link-through per
 * row for the one card (Student Attendance) that opens a Student 360 profile.
 */
function CategoryAxis({ hrefs }: { hrefs?: Record<string, string> }) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const container = containerRef.current;
  if (!mounted || !container || !barScale) return null;

  return <CategoryAxisInner hrefs={hrefs} container={container} />;
}

function CategoryAxisInner({
  hrefs,
  container
}: {
  hrefs?: Record<string, string>;
  container: HTMLDivElement;
}) {
  const { margin, barScale, bandWidth, barXAccessor, data } = useChart();
  if (!barScale || !bandWidth || !barXAccessor) return null;

  return createPortal(
    <div
      className="pointer-events-none absolute top-0 bottom-0 left-0"
      style={{ width: margin.left }}
    >
      {data.map((d) => {
        const label = barXAccessor(d);
        const y = (barScale(label) ?? 0) + margin.top;
        const href = hrefs?.[label];
        return (
          <div
            key={label}
            className="absolute right-0 flex items-center justify-end pr-3 text-right"
            style={{ top: y, height: bandWidth, width: margin.left - 12 }}
          >
            {href ? (
              <Link
                href={href}
                className="pointer-events-auto truncate text-xs text-[var(--sf-link)] hover:underline"
              >
                {label}
              </Link>
            ) : (
              <span className="truncate text-xs text-muted-foreground">{label}</span>
            )}
          </div>
        );
      })}
    </div>,
    container
  );
}

/**
 * Squares off the left end of every horizontal bar.
 *
 * Every bar primitive here draws an SVG <rect> with a single `rx`, so a radius
 * always applies to all four corners — there is no per-side option. A bar
 * measured from zero should meet its axis flush, so this refills the two left
 * corner notches with a BAR_RADIUS-wide block of the same colour, leaving only
 * the value end rounded.
 *
 * Unlike RatioBarCard's version this has to handle grouped series: a category's
 * band is split between them, so each bar's own thickness and offset are
 * recomputed the same way `<Bar>` does (bandWidth minus the inter-bar gaps,
 * divided by the series count). Series with no numeric value at a category draw
 * no bar, so they get no patch either — otherwise a block would float at the
 * axis with nothing attached to it.
 */
function OverlayBars({ series }: { series: SeriesKey[] }) {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const container = containerRef.current;
  if (!mounted || !container || !barScale) return null;

  return <OverlayBarsInner series={series} container={container} />;
}

function OverlayBarsInner({
  series,
  container
}: {
  series: SeriesKey[];
  container: HTMLDivElement;
}) {
  const { margin, barScale, bandWidth, barXAccessor, data, hoveredBarIndex, yScale } = useChart();
  if (!barScale || !bandWidth || !barXAccessor) return null;

  const count = series.length;
  const gap = count > 1 ? GROUP_GAP : 0;
  const thickness = (bandWidth - gap * (count - 1)) / count;
  if (thickness <= 0) return null;

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {data.map((row, rowIndex) => {
        const bandTop = (barScale(barXAccessor(row)) ?? 0) + margin.top;
        return series.map((item, seriesIndex) => {
          const value = row[item.label];
          if (typeof value !== "number") return null;

          const barLength = Math.max(0, (yScale?.(value) ?? 0) - (yScale?.(0) ?? 0));
          if (barLength <= 0) return null;

          return (
            <div
              key={`${rowIndex}-${item.label}`}
              className="absolute"
              style={{
                top: bandTop + seriesIndex * (thickness + gap),
                left: margin.left,
                width: barLength,
                height: thickness,
                background: SERIES_VARS[item.colorIndex % SERIES_VARS.length],
                /* Value end only, so a bar measured from zero meets its axis
                   flush — and as CSS rather than an SVG `rx`, so the app's
                   universal corner-shape: squircle smooths it. Capped at half
                   the bar's thickness: past that a squircle reads as a lozenge
                   rather than a smoothed rectangle, which matters here because
                   the grouped series are only 14px tall. */
                borderRadius: (() => {
                  const r = Math.min(BAR_RADIUS, thickness / 2);
                  return `0 ${r}px ${r}px 0`;
                })(),
                // Mirrors the library's own fadedOpacity of 0.3.
                opacity: hoveredBarIndex !== null && hoveredBarIndex !== rowIndex ? 0.3 : 1,
                transition: "opacity 0.15s ease-in-out"
              }}
            />
          );
        });
      })}
    </div>,
    container
  );
}

/**
 * Value-axis ticks along the bottom of a horizontal chart. Bklit ships no
 * value axis for this orientation (`BarXAxis` positions along the category
 * band — it's the *vertical* chart's category axis), so this reads the same
 * value scale `<Grid vertical>` draws its gridlines from (`yScale`, per the
 * note on Grid: "Horizontal bar charts: vertical grid should use yScale") and
 * labels those same tick positions.
 */
function ValueAxisTicks() {
  const { containerRef, barScale } = useChartStable();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const container = containerRef.current;
  if (!mounted || !container || !barScale) return null;

  return <ValueAxisTicksInner container={container} />;
}

function ValueAxisTicksInner({ container }: { container: HTMLDivElement }) {
  const { margin, yScale } = useChart();
  if (!yScale?.ticks) return null;

  const ticks = yScale.ticks(AXIS_TICK_COUNT);

  return createPortal(
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: margin.bottom }}>
      {ticks.map((tick) => (
        <span
          key={tick}
          className="absolute -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
          style={{ left: margin.left + (yScale(tick) ?? 0), top: 4 }}
        >
          {formatNumber(tick)}
        </span>
      ))}
    </div>,
    container
  );
}

/**
 * Bklit's grouped-category bars, applied to Students By Grade, Student
 * Attendance By School, Student Attendance, and Assignment Submissions. One
 * `<Bar>` per series, real hover tooltips instead of always-visible end labels.
 *
 * Defaults to `orientation="horizontal"` (chart-bar-horizontal): a category
 * label column down the left, same engine RatioBarCard's Recharts version
 * draws from. School and student rosters need that column for long names —
 * `labelWidth` exists for exactly that. `orientation="vertical"` flips to
 * columns with the category axis along the bottom instead; only use it where
 * category labels are short enough to sit unrotated under a bar (e.g. "Grade
 * 10"), since Bklit's `BarXAxis` doesn't wrap or rotate them.
 */
export function BarChartCard({
  title,
  groups,
  series,
  labelWidth = 180,
  orientation = "horizontal",
  asOf,
  hint,
  className
}: {
  title: string;
  groups: BarGroup[];
  series: SeriesKey[];
  /** Category-label column width in px. Widen for long names (school rosters).
      Only applies to `orientation="horizontal"`. */
  labelWidth?: number;
  /** Bar direction. Default: "horizontal" — see the component doc. */
  orientation?: "horizontal" | "vertical";
  /** ISO timestamp this card's own figure last refreshed. */
  asOf: string;
  /** Short note under the chart, e.g. "select a name to open their profile". */
  hint?: string;
  className?: string;
}) {
  const [currentAsOf, setCurrentAsOf] = useState(asOf);
  const [isRefreshing, setIsRefreshing] = useState(false);
  /** Starts in the order the report supplies, which for Students By Grade is
      9, 10, 11, 12 — an order neither a value nor an alphabetical sort can
      reproduce, so it has to be the default and stay reachable. */
  const [sortMode, setSortMode] = useState<ChartSortMode>("source");

  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => {
      setCurrentAsOf(new Date().toISOString());
      setIsRefreshing(false);
    }, 600);
  };

  const sortedGroups = useMemo(
    () =>
      sortChartItems(groups, sortMode, {
        label: (group) => group.label,
        /*
          A category here is several bars (Present / Absent / half day), so
          "highest first" needs one figure to mean: the category's total.
          Ranking on a single series instead would order a school by its
          absences alone while still drawing all three bars, and the chart
          gives the reader no way to tell that was what happened.
        */
        value: (group) => group.rows.reduce((sum, row) => sum + row.value, 0)
      }),
    [groups, sortMode]
  );

  const data = sortedGroups.map((group) => {
    const row: Record<string, unknown> = { name: group.label };
    for (const item of group.rows) row[item.label] = item.value;
    return row;
  });

  const hrefs = Object.fromEntries(
    sortedGroups.filter((group): group is BarGroup & { href: string } => Boolean(group.href)).map((group) => [group.label, group.href])
  );

  const isVertical = orientation === "vertical";
  /* Vertical (column) mode has no row-count-driven height or scroll: category
     count grows the chart's width, not its height, so a fixed height and no
     scroll wrapper both apply regardless of how many groups there are. */
  /*
    One category's slot = its bars + the gap to the next. `barGap` is a fraction
    of that slot, so handing the scale ROW_GAP / rowHeight leaves exactly
    `bandHeight` for the bars themselves — fixed thickness, even spacing.
  */
  const bandHeight = bandHeightFor(series.length);
  const rowHeight = bandHeight + ROW_GAP;

  const chartHeight = isVertical
    ? VERTICAL_CHART_HEIGHT
    : sortedGroups.length * rowHeight + CHART_VPAD;
  const scrolls = !isVertical && sortedGroups.length > VISIBLE_ROWS;

  /*
    ROW_GAP is the *minimum* gap. A card stretched by a taller neighbour in its
    row used to keep the chart at `chartHeight` and dump all the slack into one
    blank block under the axis; the rows now spread across the whole plot
    instead, spending that slack on the gaps between categories. Thickness is
    still `bandHeight`, so a three-row card's bars stay the same weight as its
    eight-row neighbour's — only the whitespace between them differs.

    The plot has to be measured for that: `barGap` is a fraction of the row, so
    turning "fill the card" into a fraction needs the height flex actually
    handed us. Until the first measurement lands, the minimum-gap fraction
    renders (the same layout as before), so there's no flash of oversized bars.
  */
  const plotRef = useRef<HTMLDivElement>(null);
  const [plotHeight, setPlotHeight] = useState(0);

  useEffect(() => {
    const element = plotRef.current;
    if (!element || isVertical || scrolls) return;

    const observer = new ResizeObserver(([entry]) => {
      setPlotHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [isVertical, scrolls]);

  const measuredRowHeight = plotHeight > 0 ? (plotHeight - CHART_VPAD) / Math.max(1, sortedGroups.length) : 0;
  const effectiveRowHeight = Math.max(rowHeight, measuredRowHeight);
  const barGap = (effectiveRowHeight - bandHeight) / effectiveRowHeight;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction className="sf-card-tools">
          <ChartSortButton
            value={sortMode}
            onChange={setSortMode}
            chartTitle={title}
            modes={CHART_SORT_MODES_WITH_SOURCE}
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

      <CardContent className="flex flex-1 flex-col">
        <div
          ref={plotRef}
          /* flex-1 (not a fixed height) so the plot takes the whole card and the
             rows space themselves out inside it — see the barGap note above.
             `minHeight` keeps the row-count floor: a card that is the tallest in
             its row never squeezes its own gaps below ROW_GAP. */
          className={cn("w-full", scrolls ? "overflow-y-auto pr-1" : "flex-1")}
          style={
            scrolls
              ? { maxHeight: VISIBLE_ROWS * rowHeight + CHART_VPAD }
              : { minHeight: chartHeight }
          }
        >
          <div className="h-full w-full">
            <BarChart
              data={data}
              xDataKey="name"
              orientation={orientation}
              margin={
                isVertical
                  ? { top: 6, right: 12, bottom: 28, left: 44 }
                  : { top: 6, right: 44, bottom: TICK_AXIS_HEIGHT, left: labelWidth }
              }
              className="h-full w-full"
              aspectRatio="auto"
              /*
                barWidth pins the band to the bars' own thickness in pixels, so
                bar weight no longer tracks however tall the row makes this card
                — only the spacing between bars absorbs the extra height. barGap
                still sets the rhythm when the plot is short enough that the
                pixel band is the larger of the two.
              */
              barWidth={isVertical ? undefined : bandHeight}
              barGap={isVertical ? undefined : barGap}
            >
              {series.map((item) => (
                <Bar
                  key={item.label}
                  dataKey={item.label}
                  fill={SERIES_VARS[item.colorIndex % SERIES_VARS.length]}
                  /* Explicit radius rather than the default lineCap="round",
                     which derives one from bar thickness and lifted the bars
                     off the axis they're measured from. Same value RatioBarCard
                     uses, so the two cards sharing a row agree. */
                  lineCap={BAR_RADIUS}
                  /* The grow animation runs bar width up from 0 while the
                     square-start patches are fixed width, so mid-animation they
                     showed as coloured stubs at the axis ahead of their bars. */
                  animate={false}
                />
              ))}
              {isVertical ? (
                <Grid horizontal />
              ) : (
                /* Vertical reference lines against the value axis — horizontal
                   bars have no y-axis need for the horizontal-line default. */
                <Grid
                  horizontal={false}
                  vertical
                  fadeVertical
                  numTicksColumns={AXIS_TICK_COUNT}
                />
              )}
              {isVertical ? (
                <>
                  <YAxis />
                  <BarXAxis />
                </>
              ) : (
                <>
                  <CategoryAxis hrefs={Object.keys(hrefs).length ? hrefs : undefined} />
                  <ValueAxisTicks />
                  {/* Horizontal only: for columns the equivalent flat edge is the
                      bottom baseline, which is a different patch geometry and
                      isn't in use on any card today. */}
                  <OverlayBars series={series} />
                </>
              )}
              <ChartTooltip
                showDatePill={false}
                content={({ point }) => (
                  <TooltipContent
                    rows={series.map((item) => ({
                      color: SERIES_VARS[item.colorIndex % SERIES_VARS.length],
                      label: item.label,
                      value:
                        typeof point[item.label] === "number"
                          ? formatNumber(point[item.label] as number)
                          : "—"
                    }))}
                  />
                )}
              />
            </BarChart>
          </div>
        </div>

        {hint ? <p className="sf-card-hint">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
