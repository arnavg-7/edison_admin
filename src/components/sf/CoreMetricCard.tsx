"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons";
import { MetricCard } from "./MetricCard";

/**
 * The three original core metrics keep a value + delta + trend line, since a
 * single percentage with no direction says very little on its own.
 */
export function CoreMetricCard({
  title,
  report,
  asOf,
  value,
  delta,
  direction,
  series
}: {
  title: string;
  report: string;
  asOf: string;
  value: string;
  delta: string;
  direction: "up" | "down";
  series: number[];
}) {
  const width = 240;
  const height = 42;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const path = series
    .map((point, index) => {
      const x = (index / (series.length - 1)) * width;
      const y = height - ((point - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <MetricCard title={title} report={report} asOf={asOf} span="sf-col-4">
      <div className="sf-metric-value">{value}</div>
      <p className={`sf-metric-delta is-${direction}`}>
        <HugeiconsIcon icon={direction === "up" ? ArrowUp01Icon : ArrowDown01Icon} size={12} strokeWidth={2.5} />
        {delta}
      </p>
      <svg
        className="sf-sparkline"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title} trend`}
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </MetricCard>
  );
}
