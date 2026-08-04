import { SALESFORCE_LAST_REFRESH } from "@/lib/data/salesforce";
import type { DateRangePreset } from "@/lib/filters";

export type DateWindow = { from: Date; to: Date };

/**
 * Anchored to the app's own last-refresh stamp, not `Date.now()`.
 *
 * Every figure in the app is display data timestamped around 17 Jul 2026 (see
 * SALESFORCE_LAST_REFRESH). Resolving
 * "This Week" against the real wall clock would put the entire dataset outside
 * every preset, so every range would read as empty — which looks like a bug
 * rather than like mock data.
 *
 * TODO: switch the anchor to the real clock once the data is live.
 */
export function rangeAnchor(): Date {
  return new Date(SALESFORCE_LAST_REFRESH);
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

/** Monday-start, matching how the district's terms are laid out. */
function startOfWeek(date: Date): Date {
  const next = startOfDay(date);
  const day = next.getDay();
  const back = day === 0 ? 6 : day - 1;
  next.setDate(next.getDate() - back);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Turns a preset (plus the custom from/to, when set) into a concrete window.
 *
 * The three "last" presets are the *completed* period before the current one —
 * last week is the previous Monday-Sunday, not the trailing seven days, and
 * likewise for the previous calendar month and year. That's what an admin means
 * asking "how did last month look", and it's the only reading that doesn't move
 * under them as the week goes on.
 *
 * `custom` with either bound missing falls back to today rather than to an empty
 * window, so a half-filled range never blanks the screen mid-selection.
 */
export function resolveDateWindow(
  range: DateRangePreset,
  from?: string | null,
  to?: string | null
): DateWindow {
  const anchor = rangeAnchor();
  const today = { from: startOfDay(anchor), to: endOfDay(anchor) };

  switch (range) {
    case "today":
      return today;
    case "yesterday": {
      const yesterday = addDays(anchor, -1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "last-week": {
      const thisWeek = startOfWeek(anchor);
      return { from: addDays(thisWeek, -7), to: endOfDay(addDays(thisWeek, -1)) };
    }
    case "last-month":
      return {
        from: startOfDay(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)),
        // Day 0 of this month is the last day of the previous one.
        to: endOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 0))
      };
    case "last-year": {
      const year = anchor.getFullYear() - 1;
      return { from: startOfDay(new Date(year, 0, 1)), to: endOfDay(new Date(year, 11, 31)) };
    }
    case "custom": {
      if (from && to) {
        return { from: startOfDay(new Date(from)), to: endOfDay(new Date(to)) };
      }
      return today;
    }
  }
}

export function isWithinWindow(isoTimestamp: string, window: DateWindow): boolean {
  const at = new Date(isoTimestamp).getTime();
  return at >= window.from.getTime() && at <= window.to.getTime();
}
