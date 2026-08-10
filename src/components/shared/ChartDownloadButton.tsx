"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

export type ChartExportRow = (string | number)[];

function toCsvValue(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "chart"
  );
}

/**
 * Per-chart export, sitting beside Sort and Refresh in the card header.
 *
 * Exports exactly what the card is showing — the rows in their current sort
 * order, not the underlying dataset — so a reader who has narrowed or re-ordered
 * a chart gets the figures they are actually looking at. That is also why this
 * builds the file in the browser rather than calling the export API: the API
 * serves whole reports for a scope, and it has no idea how this card is
 * currently ordered.
 *
 * Every card that plots categories carries one. A StatCard is a single figure
 * with nothing to tabulate, so it doesn't.
 */
export function ChartDownloadButton({
  chartTitle,
  header,
  rows
}: {
  chartTitle: string;
  header: string[];
  rows: ChartExportRow[];
}) {
  const download = () => {
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(chartTitle)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className="sf-card-tool"
      onClick={download}
      disabled={rows.length === 0}
      title={`Download ${chartTitle} as CSV`}
    >
      <HugeiconsIcon icon={Download01Icon} size={14} strokeWidth={2} />
      <span className="sf-sr-only">Download {chartTitle} as CSV</span>
    </button>
  );
}
