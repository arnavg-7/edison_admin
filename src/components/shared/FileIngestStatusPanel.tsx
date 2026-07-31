import { genesisIngest } from "@/lib/data/integrations";
import { formatDateTime, formatNumber } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

/**
 * File-ingest pattern: did today's file arrive, what did each file type
 * contain, and what failed validation. Deliberately not an uptime tile —
 * Genesis is a once-a-day drop, so "99.9% up" would say nothing useful.
 */
export function FileIngestStatusPanel() {
  const totalRows = genesisIngest.files.reduce((sum, file) => sum + file.rows, 0);
  const totalErrors = genesisIngest.validationErrors.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <div className="admin-content-panel">
        <div className="home-panel-head">
          <h2>Today&rsquo;s file</h2>
          <StatusBadge tone={genesisIngest.status}>{genesisIngest.statusLabel}</StatusBadge>
        </div>

        <div className="home-panel-stats ingest-stats">
          <div>
            <dt>Arrival</dt>
            <dd>{genesisIngest.arrived ? "Received" : "Not received"}</dd>
          </div>
          <div>
            <dt>Expected by</dt>
            <dd className="stat-small">{formatDateTime(genesisIngest.expectedBy)}</dd>
          </div>
          <div>
            <dt>Last successful ingest</dt>
            <dd className="stat-small">{formatDateTime(genesisIngest.lastSuccessfulIngest)}</dd>
          </div>
          <div>
            <dt>Rows processed</dt>
            <dd>{formatNumber(totalRows)}</dd>
          </div>
          <div>
            <dt>Validation errors</dt>
            <dd>{formatNumber(totalErrors)}</dd>
          </div>
        </div>
      </div>

      <div className="admin-content-panel">
        <h2>Rows per file type</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Rows</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {genesisIngest.files.map((file) => (
              <tr key={file.file}>
                <td>{file.file}</td>
                <td>{formatNumber(file.rows)}</td>
                <td>
                  <StatusBadge tone={file.status}>
                    {file.status === "ok" ? "OK" : "Warning"}
                  </StatusBadge>
                </td>
                <td>{file.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {genesisIngest.validationErrors.length > 0 ? (
        <div className="admin-content-panel">
          <h2>Validation errors</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Error</th>
                <th>Rows affected</th>
              </tr>
            </thead>
            <tbody>
              {genesisIngest.validationErrors.map((error) => (
                <tr key={`${error.file}-${error.message}`}>
                  <td>{error.file}</td>
                  <td>{error.message}</td>
                  <td>{formatNumber(error.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
