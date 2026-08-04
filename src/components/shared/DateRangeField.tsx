"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * The Reporting "Custom" date range as one connected calendar rather than two
 * native <input type="date"> fields that don't know about each other — picking
 * the end date highlights the whole span back to the start, same as any
 * standard date-range picker.
 */
export function DateRangeField({
  from,
  to,
  onChange
}: {
  from: string | null;
  to: string | null;
  onChange: (range: { from: string | null; to: string | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  const range: DateRange | undefined = {
    from: parseDate(from),
    to: parseDate(to)
  };

  const label = range.from
    ? range.to
      ? `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`
      : `${format(range.from, "MMM d, yyyy")} – …`
    : "Select dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="justify-start font-normal">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={14}
              strokeWidth={2}
              data-icon="inline-start"
            />
            {label}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          defaultMonth={range.from}
          numberOfMonths={2}
          onSelect={(next) => {
            onChange({
              from: next?.from ? toIsoDate(next.from) : null,
              to: next?.to ? toIsoDate(next.to) : null
            });
            // Both ends picked — close rather than making the admin dismiss
            // the popover themselves for a range that's already complete.
            if (next?.from && next?.to) {
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
