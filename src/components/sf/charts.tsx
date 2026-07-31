"use client";

import { formatCompact, formatNumber } from "@/lib/format";

/** Fixed series scale — index 0..4 maps to --sf-series-1..5. */
export const SERIES_VARS = [
  "var(--sf-series-1)",
  "var(--sf-series-2)",
  "var(--sf-series-3)",
  "var(--sf-series-4)",
  "var(--sf-series-5)"
];

export type SeriesKey = { label: string; colorIndex: number };

/**
 * Series that are too light to carry white text. On a light theme the palette
 * stays light on purpose, so instead of darkening every fill until it stops
 * being light, labels drawn *on* these fills switch to dark ink.
 */
const LIGHT_SERIES = new Set([2, 4]);
const INK_DARK = "#16203a";

function inkFor(colorIndex: number): string {
  return LIGHT_SERIES.has(colorIndex % SERIES_VARS.length) ? INK_DARK : "#ffffff";
}

export function Legend({ title, series }: { title: string; series: SeriesKey[] }) {
  return (
    <div className="sf-legend">
      <div className="sf-legend-title">{title}</div>
      {series.map((item) => (
        <span className="sf-legend-item" key={item.label}>
          {item.label}
          <span
            className="sf-legend-swatch"
            style={{ background: SERIES_VARS[item.colorIndex % SERIES_VARS.length] }}
            aria-hidden
          />
        </span>
      ))}
    </div>
  );
}

/** Big single-number stat, e.g. "1,702". */
export function StatValue({ value, label }: { value: number; label: string }) {
  return (
    <div className="sf-stat-value" role="img" aria-label={`${label}: ${formatNumber(value)}`}>
      {formatNumber(value)}
    </div>
  );
}

function niceTicks(max: number, count = 6): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

function Ruler({ max }: { max: number }) {
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  return (
    <div className="sf-ruler" aria-hidden>
      {ticks.map((t) => (
        <span className="sf-ruler-tick" key={t} style={{ left: `${(t / top) * 100}%` }}>
          {t}
        </span>
      ))}
    </div>
  );
}

export type BarRow = { label: string; value: number; colorIndex: number };
export type BarGroup = {
  label: string;
  rows: BarRow[];
  /** When set, the group label links through — used by the individual-level
      Student Attendance card to reach Student 360. */
  href?: string;
};

/**
 * Grouped horizontal bars — the workhorse chart in the reference dashboards
 * (Student Attendance, Students By Grade, Well-Being Trend). Value labels sit
 * inside the bar when it's wide enough, outside when it isn't, so small values
 * stay readable.
 */
export function GroupedBars({
  groups,
  axisTitle,
  legendTitle,
  series,
  groupLabelIsCategory = false
}: {
  groups: BarGroup[];
  axisTitle: string;
  legendTitle: string;
  series: SeriesKey[];
  groupLabelIsCategory?: boolean;
}) {
  const max = Math.max(1, ...groups.flatMap((g) => g.rows.map((r) => r.value)));
  const top = niceTicks(max).slice(-1)[0] || max;

  return (
    <div className="sf-chart">
      <div className="sf-chart-main">
        <div className="sf-axis-title">{axisTitle}</div>
        <Ruler max={max} />
        <div className="sf-bars">
          {groups.map((group) => (
            <div className="sf-bar-group" key={group.label}>
              <div className="sf-bar-group-label">
                {group.href ? (
                  <a className="sf-bar-group-link" href={group.href}>
                    {group.label}
                  </a>
                ) : (
                  group.label
                )}
              </div>
              <div className="sf-bar-rows">
                {group.rows.map((row) => {
                  const pct = (row.value / top) * 100;
                  return (
                    <div className="sf-bar-row" key={`${group.label}-${row.label}`}>
                      {groupLabelIsCategory ? null : (
                        <div className="sf-bar-row-label">{row.label}</div>
                      )}
                      <div
                        className="sf-bar-track"
                        style={groupLabelIsCategory ? { gridColumn: "1 / -1" } : undefined}
                      >
                        <div
                          className="sf-bar-fill"
                          style={{
                            width: `${Math.max(pct, 0.6)}%`,
                            background: SERIES_VARS[row.colorIndex % SERIES_VARS.length]
                          }}
                          role="img"
                          aria-label={`${group.label}, ${row.label}: ${formatNumber(row.value)}`}
                        />
                        {/* Value sits outside the fill: on a light palette an
                            in-bar label can't clear contrast on every series. */}
                        <span
                          className="sf-bar-value-outside"
                          style={{ left: `${Math.max(pct, 0.6)}%` }}
                          aria-hidden
                        >
                          {formatNumber(row.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Legend title={legendTitle} series={series} />
    </div>
  );
}

export type StackRow = { label: string; segments: { value: number; colorIndex: number }[] };

/** Stacked 100% horizontal bars — Teacher-Student Ratio in the reference. */
export function StackedBars({
  rows,
  axisTitle,
  legendTitle,
  series
}: {
  rows: StackRow[];
  axisTitle: string;
  legendTitle: string;
  series: SeriesKey[];
}) {
  return (
    <div className="sf-chart">
      <div className="sf-chart-main">
        <div className="sf-axis-title">{axisTitle}</div>
        <div className="sf-ruler" aria-hidden>
          {[0, 20, 40, 60, 80, 100].map((t) => (
            <span className="sf-ruler-tick" key={t} style={{ left: `${t}%` }}>
              {t}%
            </span>
          ))}
        </div>
        <div className="sf-stack">
          {rows.map((row) => {
            const total = row.segments.reduce((sum, s) => sum + s.value, 0) || 1;
            return (
              <div className="sf-stack-row" key={row.label}>
                <div className="sf-bar-group-label">{row.label}</div>
                <div className="sf-stack-track">
                  {row.segments.map((seg, index) => {
                    const pct = (seg.value / total) * 100;
                    return (
                      <div
                        className="sf-stack-seg"
                        key={index}
                        style={{
                          width: `${pct}%`,
                          background: SERIES_VARS[seg.colorIndex % SERIES_VARS.length],
                          color: inkFor(seg.colorIndex)
                        }}
                        role="img"
                        aria-label={`${row.label}, ${series[index]?.label ?? ""}: ${pct.toFixed(0)}%`}
                      >
                        {pct > 8 ? `${pct.toFixed(0)}%` : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Legend title={legendTitle} series={series} />
    </div>
  );
}

export type DonutSlice = { label: string; value: number; colorIndex: number };

/** Donut with the total in the middle — Student Count By School. */
export function Donut({
  slices,
  legendTitle,
  caption,
  /**
   * Grand total shown in the middle. Passed explicitly because the ring charts
   * the top categories plus a small "Other" — as in the reference dashboards,
   * the centre figure is the district total, not the sum of the visible slices.
   */
  total: centreTotal
}: {
  slices: DonutSlice[];
  legendTitle: string;
  caption: string;
  total?: number;
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const centre = centreTotal ?? total;
  const size = 200;
  const r = 74;
  const stroke = 30;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="sf-donut-wrap">
      <div className="sf-chart-main">
        <div className="sf-axis-title">{caption}</div>
        <svg className="sf-donut" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption}>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {slices.map((slice) => {
              const len = (slice.value / total) * c;
              const dash = `${len} ${c - len}`;
              const el = (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  strokeWidth={stroke}
                  stroke={SERIES_VARS[slice.colorIndex % SERIES_VARS.length]}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })}
          </g>
          <text className="sf-donut-total" x={size / 2} y={size / 2 + 7}>
            {formatNumber(centre)}
          </text>
        </svg>
      </div>
      <div className="sf-legend">
        <div className="sf-legend-title">{legendTitle}</div>
        {slices.map((slice) => (
          <span className="sf-legend-item" key={slice.label}>
            {slice.label} · {formatNumber(slice.value)}
            <span
              className="sf-legend-swatch"
              style={{ background: SERIES_VARS[slice.colorIndex % SERIES_VARS.length] }}
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}

export type FunnelStage = { label: string; value: number; colorIndex: number };

/**
 * Funnel — Students' Status. The stages are the statuses themselves; the grand
 * total appears only in the caption ("Record Count: 1.7k"), matching the
 * reference. Each band's top width is its share of `total`, and its bottom
 * width is the next band's share, so the taper reads as fall-off between
 * stages rather than collapsing to a point.
 */
export function Funnel({
  stages,
  legendTitle,
  total
}: {
  stages: FunnelStage[];
  legendTitle: string;
  total: number;
}) {
  const width = 260;
  const stageHeight = 62;
  const height = stages.length * stageHeight;

  let y = 0;

  return (
    <div className="sf-donut-wrap">
      <div className="sf-chart-main">
        <div className="sf-funnel-caption">Record Count: {formatCompact(total).toLowerCase()}</div>
        <svg
          className="sf-funnel"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Students' status funnel, ${stages
            .map((s) => `${s.label} ${formatNumber(s.value)}`)
            .join(", ")}`}
        >
          {stages.map((stage, index) => {
            const next = stages[index + 1];
            const wTop = (stage.value / total) * width;
            const wBottom = next ? (next.value / total) * width : wTop * 0.55;
            const xTop = (width - wTop) / 2;
            const xBottom = (width - wBottom) / 2;
            const top = y;
            const bottom = y + stageHeight - 4;
            y += stageHeight;

            return (
              <g key={stage.label}>
                <polygon
                  points={`${xTop},${top} ${xTop + wTop},${top} ${xBottom + wBottom},${bottom} ${xBottom},${bottom}`}
                  fill={SERIES_VARS[stage.colorIndex % SERIES_VARS.length]}
                />
                {wTop > 60 ? (
                  <text
                    className="sf-funnel-label"
                    x={width / 2}
                    y={top + stageHeight / 2}
                    fill={inkFor(stage.colorIndex)}
                  >
                    {formatNumber(stage.value)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="sf-legend">
        <div className="sf-legend-title">{legendTitle}</div>
        {stages.map((stage) => (
          <span className="sf-legend-item" key={stage.label}>
            {stage.label} · {formatNumber(stage.value)}
            <span
              className="sf-legend-swatch"
              style={{ background: SERIES_VARS[stage.colorIndex % SERIES_VARS.length] }}
              aria-hidden
            />
          </span>
        ))}
      </div>
    </div>
  );
}
