import type { SyncLogEntry } from "@/lib/data/integrations";
import { SOURCE_LABELS } from "@/lib/data/types";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";

const LEVEL_LABELS = {
  ok: "OK",
  warn: "Warning",
  error: "Error",
  neutral: "Info"
} as const;

export function SyncLogTable({
  entries,
  showSource = false
}: {
  entries: SyncLogEntry[];
  showSource?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No log entries"
        message="Nothing has been recorded for this source in the selected time window."
      />
    );
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>When</th>
          {showSource ? <th>Source</th> : null}
          <th>Level</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{formatDateTime(entry.at)}</td>
            {showSource ? <td>{SOURCE_LABELS[entry.source]}</td> : null}
            <td>
              <StatusBadge tone={entry.level}>{LEVEL_LABELS[entry.level]}</StatusBadge>
            </td>
            <td>{entry.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
