// Fixed time zone so server-rendered and client-rendered strings match.
// TODO: swap to the district's configured time zone once System Settings >
// Academic Calendar owns it.
const TIME_ZONE = "America/New_York";

const dayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric"
});

/**
 * The Salesforce card-footer stamp, matching the reference dashboards exactly:
 * "17-Jul-2026, 12:12 pm".
 */
export function formatSalesforceStamp(iso: string): string {
  const day = dayFormatter.format(new Date(iso)).replace(/ /g, "-");
  const time = timeFormatter.format(new Date(iso)).toLowerCase();
  return `${day}, ${time}`;
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/**
 * For date-only strings (YYYY-MM-DD), which carry no time or zone. These must
 * never touch a zone-bound formatter: formatDate reads "2026-05-22" as UTC
 * midnight and renders it in America/New_York, landing on May 21. Anchoring to
 * UTC on both sides keeps the calendar date exactly as written, whatever zone
 * the server or the reader is in.
 */
const dateOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric"
});

export function formatDateOnly(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return dateOnlyFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

/** The period a term or development area runs for. */
export function formatDateRangeOnly(from: string, to: string): string {
  return `${formatDateOnly(from)} – ${formatDateOnly(to)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** Compact form for big-number stats, e.g. 1.7k for a funnel total. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value
  );
}

/** First letter of the first two words, for an avatar placeholder — "Michael Andrew" -> "MA". */
export function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]);
  return (letters[0] ?? "") + (letters[letters.length - 1] ?? "");
}
