import { formatDateTime } from "@/lib/format";
import { SOURCE_LABELS, type DataSource } from "@/lib/data/types";

/**
 * Per-metric "Data as of" stamp. Deliberately attached to individual metrics
 * and panels rather than rendered once per page — Genesis, Classroom and the
 * Admin DB update on different clocks, and a single shared timestamp would
 * misreport whichever source it didn't come from.
 */
export function FreshnessStamp({
  asOf,
  source,
  cadence
}: {
  asOf: string;
  source: DataSource;
  cadence?: string;
}) {
  return (
    <div className="freshness-stamp">
      <span className="freshness-stamp-main">
        Data as of {formatDateTime(asOf)} · {SOURCE_LABELS[source]}
      </span>
      {cadence ? <span className="freshness-stamp-cadence">{cadence}</span> : null}
    </div>
  );
}
