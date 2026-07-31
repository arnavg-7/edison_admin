import Link from "next/link";
import { apiSyncStatuses } from "@/lib/data/integrations";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Home summary of the Classroom/Calendar API connections. Uptime/error-rate
 * shaped — deliberately a different shape from the Genesis file panel.
 */
export function ApiSummaryPanel() {
  return (
    <section className="home-panel">
      <div className="home-panel-head">
        <h2>Classroom &amp; Calendar sync</h2>
      </div>

      <div className="home-api-list">
        {apiSyncStatuses.map((api) => (
          <div className="home-api-row" key={api.id}>
            <div>
              <div className="home-api-name">{api.label}</div>
              <div className="home-api-meta">
                Last sync {formatDateTime(api.lastSuccessfulSync)} · {api.errorRate} errors
              </div>
            </div>
            <StatusBadge tone={api.status}>{api.statusLabel}</StatusBadge>
          </div>
        ))}
      </div>

      <Link className="home-panel-link" href="/integrations">
        View sync status
      </Link>
    </section>
  );
}
