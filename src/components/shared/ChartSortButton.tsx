"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Sorting01Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  CHART_SORT_LABELS,
  CHART_SORT_MODES,
  type ChartSortMode
} from "@/lib/chart-sort";

/**
 * The sort control every categorical chart card carries, sitting beside its
 * Refresh button in the card header.
 *
 * A menu rather than a button that cycles orders on each click: four orders
 * cycled blindly means a reader has to click and re-read the chart to find the
 * one they wanted, and can't see what's on offer. The menu also shows which
 * order is currently applied, which a cycling button can only put in a tooltip.
 *
 * Not every card gets one. A single figure (StatCard) has nothing to order, and
 * a time series (TrendStatCard) is ordered by date — re-ordering those points
 * by value would not be a sort, it would be a different chart. Students' Status
 * is left out too: its funnel scales every stage against the first, so any
 * order other than largest-first renders stages wider than the funnel itself.
 */
export function ChartSortButton({
  value,
  onChange,
  chartTitle,
  modes = CHART_SORT_MODES
}: {
  value: ChartSortMode;
  onChange: (mode: ChartSortMode) => void;
  /** Named in the accessible label, so a screen reader hears which chart this
      sorts when a page carries several. */
  chartTitle: string;
  modes?: ChartSortMode[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="sf-card-tool"
        title={`Sort ${chartTitle}, ${CHART_SORT_LABELS[value]}`}
      >
        <HugeiconsIcon icon={Sorting01Icon} size={14} strokeWidth={2} />
        <span className="sf-sr-only">
          Sort {chartTitle}, currently {CHART_SORT_LABELS[value]}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as ChartSortMode)}
        >
          {/* Inside the radio group, not above it: this renders Base UI's
              Menu.GroupLabel, which needs a group ancestor for its context —
              and it is the radio group's own label, so it belongs here. */}
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          {modes.map((mode) => (
            <DropdownMenuRadioItem key={mode} value={mode}>
              {CHART_SORT_LABELS[mode]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
