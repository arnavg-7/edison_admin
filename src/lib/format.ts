// Fixed time zone so server-rendered and client-rendered strings match.
// TODO: swap to the district's configured time zone once System Settings >
// Academic Calendar owns it.
const TIME_ZONE = "America/New_York";

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

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
