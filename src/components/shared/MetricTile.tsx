import type { Metric } from "@/lib/data/types";
import { FreshnessStamp } from "./FreshnessStamp";

const TREND_SYMBOL = {
  up: "▲",
  down: "▼",
  flat: "■"
} as const;

export function MetricTile({ metric }: { metric: Metric }) {
  return (
    <article className="metric-tile">
      <p className="metric-tile-label">{metric.label}</p>
      <h3 className="metric-tile-value">{metric.value}</h3>
      {metric.trend ? (
        <p className={`metric-tile-trend is-${metric.trend.direction}`}>
          <span aria-hidden>{TREND_SYMBOL[metric.trend.direction]}</span> {metric.trend.delta}
        </p>
      ) : null}
      <FreshnessStamp asOf={metric.asOf} source={metric.source} cadence={metric.cadence} />
    </article>
  );
}

/** Platform Pulse strip — district-wide current values, no drill-down. */
export function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="metric-strip">
      {metrics.map((metric) => (
        <MetricTile key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
