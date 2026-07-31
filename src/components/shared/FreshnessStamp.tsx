import { formatSalesforceStamp } from "@/lib/format";

/**
 * Per-report "As of" stamp for non-card surfaces.
 *
 * v2 changed what this means. In v1 it named the upstream system (Genesis /
 * Classroom / Admin DB) because Admin queried each directly. Admin now reads
 * everything through Salesforce, so the stamp reflects when that Salesforce
 * report last refreshed and names the report instead. Attributing a figure to
 * Genesis here would claim a freshness Admin can no longer observe.
 */
export function FreshnessStamp({
  asOf,
  report,
  note
}: {
  asOf: string;
  /** Salesforce report name behind the figure. */
  report: string;
  note?: string;
}) {
  return (
    <div className="freshness-stamp">
      <span className="freshness-stamp-main">
        As of {formatSalesforceStamp(asOf)} · {report}
      </span>
      {note ? <span className="freshness-stamp-cadence">{note}</span> : null}
    </div>
  );
}
