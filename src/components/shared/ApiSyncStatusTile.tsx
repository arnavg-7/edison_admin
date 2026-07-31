import type { ApiSyncStatus } from "@/lib/data/integrations";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

/**
 * API pattern: uptime, error rate, rate-limit headroom, last poll. A continuous
 * connection, so a different shape from the Genesis file-ingest panel.
 */
export function ApiSyncStatusTile({ api }: { api: ApiSyncStatus }) {
  return (
    <div className="admin-content-panel">
      <div className="home-panel-head">
        <h2>{api.label}</h2>
        <StatusBadge tone={api.status}>{api.statusLabel}</StatusBadge>
      </div>

      <div className="home-panel-stats">
        <div>
          <dt>Uptime</dt>
          <dd>{api.uptime}</dd>
        </div>
        <div>
          <dt>Error rate</dt>
          <dd>{api.errorRate}</dd>
        </div>
        <div>
          <dt>Records synced</dt>
          <dd>{formatNumber(api.recordsSynced)}</dd>
        </div>
      </div>

      <div className="api-meta-row">
        <span>
          Last successful sync <strong>{formatDateTime(api.lastSuccessfulSync)}</strong>
        </span>
        <span>
          Rate limit <strong>{api.rateLimit}</strong>
        </span>
      </div>
    </div>
  );
}
