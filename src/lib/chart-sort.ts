/**
 * Shared sort order for the categorical charts on Home and Reporting &
 * Analytics, so "sorted by" means the same thing and offers the same choices
 * on every card rather than each chart inventing its own ordering control.
 *
 * Only charts with a category axis take part. A time series (TrendStatCard)
 * is ordered by date and a single figure (StatCard) has nothing to order, so
 * neither carries a sort control — see the note in ChartSortButton.
 */

export type ChartSortMode =
  /**
   * The order the report itself supplies. Offered only where that order carries
   * meaning — Students By Grade runs 9, 10, 11, 12, which is neither a value
   * order nor an alphabetical one ("Grade 10" sorts before "Grade 9"), so
   * without this a reader could not get back to it.
   */
  | "source"
  | "value-desc"
  | "value-asc"
  | "label-asc"
  | "label-desc";

/** The value orders, offered by every sortable chart. */
export const CHART_SORT_MODES: ChartSortMode[] = [
  "value-desc",
  "value-asc",
  "label-asc",
  "label-desc"
];

/** For charts whose supplied order is meaningful, and is therefore the default. */
export const CHART_SORT_MODES_WITH_SOURCE: ChartSortMode[] = ["source", ...CHART_SORT_MODES];

/**
 * Menu copy. Deliberately plain English rather than "Descending" — on a chart
 * of schools "Highest first" says what will happen to the bars, where
 * "descending" leaves the reader to work out descending by what.
 */
export const CHART_SORT_LABELS: Record<ChartSortMode, string> = {
  source: "Report order",
  "value-desc": "Highest first",
  "value-asc": "Lowest first",
  "label-asc": "Name A–Z",
  "label-desc": "Name Z–A"
};

export type ChartSortAccessors<T> = {
  label: (item: T) => string;
  /** The figure the chart plots — the one thing "highest first" can mean. */
  value: (item: T) => number;
};

/**
 * Returns a new sorted array; never mutates the caller's data, since these
 * arrays come straight from the shared data modules and are rendered by more
 * than one screen.
 *
 * Ties break on label A–Z rather than falling through to source order: two
 * schools on the same ratio would otherwise sit in whichever order the data
 * module happened to list them, which reads as arbitrary when the numbers next
 * to them are identical.
 */
export function sortChartItems<T>(
  items: T[],
  mode: ChartSortMode,
  get: ChartSortAccessors<T>
): T[] {
  const byLabel = (a: T, b: T) => get.label(a).localeCompare(get.label(b));

  if (mode === "source") return [...items];

  return [...items].sort((a, b) => {
    switch (mode) {
      case "value-desc":
        return get.value(b) - get.value(a) || byLabel(a, b);
      case "value-asc":
        return get.value(a) - get.value(b) || byLabel(a, b);
      case "label-asc":
        return byLabel(a, b);
      case "label-desc":
        return byLabel(b, a);
    }
  });
}
