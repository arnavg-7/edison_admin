"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DATE_RANGE_OPTIONS, dateRangeLabel, type DateRangePreset } from "@/lib/filters";
import { resolveDateWindow } from "@/lib/date-range";

function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function spanLabel(from?: Date, to?: Date): string {
  if (!from) return "Select dates";
  if (!to) return `${format(from, "d MMM, yyyy")} – …`;
  return `${format(from, "d MMM, yyyy")} – ${format(to, "d MMM, yyyy")}`;
}

/**
 * One control for the whole date scope: a preset rail (Today … Last year) beside
 * a two-month range calendar, rather than a preset dropdown plus a separate
 * calendar button that only appeared after picking "Custom". Presets are what
 * gets used nine times in ten, and they're now visible without opening a second
 * control; an arbitrary span is still one click away on the same surface.
 *
 * Selections are staged and only committed on Save, so scrubbing through presets
 * to compare their spans doesn't re-run every query on the page underneath, and
 * a half-picked custom range can't be applied. Clicking any day switches the
 * selection to "Custom range" — dates and presets are the same setting, so the
 * rail always reflects what the calendar shows.
 */
export function DateRangePicker({
  range,
  from,
  to,
  onChange,
  ariaLabel = "Date range"
}: {
  range: DateRangePreset;
  from: string | null;
  to: string | null;
  onChange: (next: { range: DateRangePreset; from: string | null; to: string | null }) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftPreset, setDraftPreset] = useState<DateRangePreset>(range);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>();

  // Re-seed the draft from the committed value every time the popover opens, so
  // a cancelled edit leaves nothing behind for the next open to inherit.
  useEffect(() => {
    if (!open) return;
    const window = resolveDateWindow(range, from, to);
    setDraftPreset(range);
    setDraftRange({ from: window.from, to: window.to });
  }, [open, range, from, to]);

  const committed = resolveDateWindow(range, from, to);
  const triggerLabel =
    range === "custom"
      ? spanLabel(parseDate(from), parseDate(to))
      : `${dateRangeLabel(range)}: ${spanLabel(committed.from, committed.to)}`;

  const pickPreset = (preset: DateRangePreset) => {
    setDraftPreset(preset);
    if (preset === "custom") return; // keep whatever span is on screen to edit
    const window = resolveDateWindow(preset);
    setDraftRange({ from: window.from, to: window.to });
  };

  const canSave = draftPreset !== "custom" || Boolean(draftRange?.from && draftRange?.to);

  const save = () => {
    if (!canSave) return;
    onChange({
      range: draftPreset,
      from: draftPreset === "custom" && draftRange?.from ? toIsoDate(draftRange.from) : null,
      to: draftPreset === "custom" && draftRange?.to ? toIsoDate(draftRange.to) : null
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Same trigger as the app's one dropdown control (.sf-combobox): border,
          radius, padding, type and caret all come from that class, so a filter
          bar mixing this with School/Grade/Status reads as one row of matching
          controls rather than an outline button parked among comboboxes. */}
      <PopoverTrigger
        render={
          <button
            type="button"
            className="sf-combobox"
            aria-label={ariaLabel}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span className="sf-combobox-value">
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={15}
                strokeWidth={2}
                className="sf-combobox-lead"
              />
              {triggerLabel}
            </span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={15}
              strokeWidth={2}
              className="sf-combobox-caret"
            />
          </button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <div className="sf-daterange">
          <div className="sf-daterange-presets" role="group" aria-label="Date range presets">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={draftPreset === option.value}
                className={
                  draftPreset === option.value
                    ? "sf-daterange-preset is-active"
                    : "sf-daterange-preset"
                }
                onClick={() => pickPreset(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="sf-daterange-body">
            <p className="sf-daterange-span">{spanLabel(draftRange?.from, draftRange?.to)}</p>

            <Calendar
              /* Keyed on the preset so a preset click re-mounts the calendar and
                 its defaultMonth jumps to that span — otherwise picking "Last
                 year" would highlight dates on a month the reader can't see. */
              key={draftPreset === "custom" ? "custom" : draftPreset}
              /* No padding of its own — .sf-daterange-body owns the popover's
                 inset, so the grid shares a left edge with the span above it and
                 the buttons below. */
              className="p-0"
              mode="range"
              selected={draftRange}
              defaultMonth={draftRange?.from}
              numberOfMonths={2}
              onSelect={(next) => {
                setDraftRange(next);
                // Touching a day means this is no longer one of the presets.
                setDraftPreset("custom");
              }}
            />

            <div className="sf-daterange-actions">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={!canSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
