import Link from "next/link";
import { genesisIngest } from "@/lib/data/integrations";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Home summary of the Genesis file ingest. Intentionally shaped around "did
 * today's file arrive and what did it contain" rather than uptime — the full
 * per-file breakdown lives in Integrations.
 */
export function GenesisSummaryPanel() {
  const errorCount = genesisIngest.validationErrors.reduce((sum, item) => sum + item.count, 0);
  const totalRows = genesisIngest.files.reduce((sum, file) => sum + file.rows, 0);

  return (
    <section className="home-panel">
      <div className="home-panel-head">
        <h2>Genesis file ingest</h2>
        <StatusBadge tone={genesisIngest.status}>{genesisIngest.statusLabel}</StatusBadge>
      </div>

      <dl className="home-panel-stats">
        <div>
          <dt>Today&rsquo;s file</dt>
          <dd>{genesisIngest.arrived ? "Arrived" : "Not received"}</dd>
        </div>
        <div>
          <dt>Rows processed</dt>
          <dd>{formatNumber(totalRows)}</dd>
        </div>
        <div>
          <dt>Validation errors</dt>
          <dd>{formatNumber(errorCount)}</dd>
        </div>
      </dl>

      <p className="home-panel-foot">
        Last successful ingest {formatDateTime(genesisIngest.lastSuccessfulIngest)}
      </p>
      <Link className="home-panel-link" href="/integrations">
        View file details
      </Link>
    </section>
  );
}
