"use client";

import { formatNumber } from "@/lib/format";

/** Fixed series scale — index 0..4 maps to --sf-series-1..5. */
export const SERIES_VARS = [
  "var(--sf-series-1)",
  "var(--sf-series-2)",
  "var(--sf-series-3)",
  "var(--sf-series-4)",
  "var(--sf-series-5)"
];

export type SeriesKey = { label: string; colorIndex: number };

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

function niceTicks(max: number, count = 6): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? mag * 10;
  // The top tick must be >= max (not just the largest multiple <= max), or a
  // bar whose value sits between the last tick and the true max scales past
  // 100% width and overflows its card.
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
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
 * Grouped horizontal bars — the workhorse chart here (Student Attendance,
 * Students By Grade). Value labels always sit outside the fill: on a light
 * surface the pale end of the series palette can't carry white text, and
 * outside-only keeps one label position rather than two.
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
        <Ruler max={max} />
        <div className="sf-axis-title">{axisTitle}</div>
      </div>
      <Legend title={legendTitle} series={series} />
    </div>
  );
}

/** Kept for the data layer: `dashboard.ts`'s `studentsStatus` is typed against
    this shape, though the funnel itself now renders via
    `components/charts/funnel-chart.tsx` (see StatusFunnelCard). */
export type FunnelStage = { label: string; value: number; colorIndex: number };
