import { SALESFORCE_LAST_REFRESH } from "@/lib/data/salesforce";
import { currentTerm } from "@/lib/data/academicCalendar";
import type { DateRangePreset } from "@/lib/filters";

export type DateWindow = { from: Date; to: Date };

/**
 * Anchored to the app's own last-refresh stamp, not `Date.now()`.
 *
 * Every figure in the app is display data timestamped around 17 Jul 2026 (see
 * SALESFORCE_LAST_REFRESH, the same value the context bar shows). Resolving
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

/**
 * Turns a preset (plus the custom from/to, when set) into a concrete window.
 *
 * `custom` with either bound missing falls back to the whole current term
 * rather than to an empty window, so a half-filled custom range never blanks
 * the screen while the user is still typing the second date.
 */
export function resolveDateWindow(
  range: DateRangePreset,
  from?: string | null,
  to?: string | null
): DateWindow {
  const anchor = rangeAnchor();

  switch (range) {
    case "today":
      return { from: startOfDay(anchor), to: endOfDay(anchor) };
    case "week":
      return { from: startOfWeek(anchor), to: endOfDay(anchor) };
    case "month":
      return {
        from: startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1)),
        to: endOfDay(anchor)
      };
    case "term": {
      const term = currentTerm();
      return { from: startOfDay(new Date(term.start)), to: endOfDay(new Date(term.end)) };
    }
    case "custom": {
      if (from && to) {
        return { from: startOfDay(new Date(from)), to: endOfDay(new Date(to)) };
      }
      const term = currentTerm();
      return { from: startOfDay(new Date(term.start)), to: endOfDay(new Date(term.end)) };
    }
  }
}

export function isWithinWindow(isoTimestamp: string, window: DateWindow): boolean {
  const at = new Date(isoTimestamp).getTime();
  return at >= window.from.getTime() && at <= window.to.getTime();
}
