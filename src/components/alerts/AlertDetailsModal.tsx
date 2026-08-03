import Link from "next/link";
import type { StudentAlert } from "@/lib/data/alerts";
import { severityTone } from "@/lib/data/alerts";
import { findPerson } from "@/lib/data/people";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Modal } from "@/components/shared/Modal";
import { formatDateTime, initials } from "@/lib/format";

export function AlertDetailsModal({
  alert,
  onClose,
  onResolve
}: {
  alert: StudentAlert;
  onClose: () => void;
  onResolve: () => void;
}) {
  const facultyNames = alert.taggedFaculty.map((id) => findPerson("faculty", id)?.name ?? id);

  return (
    <Modal title="Alert Details" onClose={onClose}>
      <div className="alert-identity">
        <span className="alert-avatar" aria-hidden>
          {initials(alert.studentName)}
        </span>
        <div>
          <div className="alert-identity-name">
            {alert.studentName}
            <StatusBadge tone={severityTone(alert.severity)}>{alert.severity}</StatusBadge>
          </div>
          <div className="alert-identity-time">{formatDateTime(alert.loggedAt)}</div>
        </div>
      </div>

      <div className="alert-body-panel">
        <div className="alert-body-panel-category">{alert.category}</div>
        <div className="alert-body-panel-description">{alert.description}</div>
      </div>

      <div className="alert-meta-list">
        <div className="alert-meta-row">
          <strong>Status:</strong>
          <StatusBadge tone={alert.status === "Open" ? "warn" : "ok"}>{alert.status}</StatusBadge>
        </div>
        <div className="alert-meta-row">
          <strong>Logged by:</strong> {alert.createdBy}
        </div>
        {alert.status === "Resolved" ? (
          <>
            <div className="alert-meta-row">
              <strong>Resolved by:</strong> {alert.resolvedBy}
            </div>
            <div className="alert-meta-row">
              <strong>Resolved at:</strong> {alert.resolvedAt ? formatDateTime(alert.resolvedAt) : "—"}
            </div>
          </>
        ) : null}
        <div className="alert-meta-row">
          <strong>Tagged faculty:</strong>
        </div>
        <div className="alert-tag-list">
          {facultyNames.length === 0 ? (
            <span className="alert-card-sub">None</span>
          ) : (
            facultyNames.map((name) => (
              <span className="alert-tag-chip" key={name}>
                {name}
              </span>
            ))
          )}
        </div>
      </div>

      <Link
        href={`/people/student/${alert.studentId}`}
        className="sf-btn sf-btn--block sf-btn--center"
        onClick={onClose}
      >
        View Student Profile
      </Link>

      {alert.status === "Open" ? (
        <button
          type="button"
          className="sf-btn sf-btn--danger sf-btn--block sf-btn--center"
          onClick={onResolve}
        >
          Mark as Resolved
        </button>
      ) : null}
    </Modal>
  );
}
