import type { StudentAlert } from "@/lib/data/alerts";
import { severityTone } from "@/lib/data/alerts";
import { gradeLabel, schools } from "@/lib/data/schools";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDateTime, initials } from "@/lib/format";

export function AlertCard({ alert, onOpen }: { alert: StudentAlert; onOpen: () => void }) {
  const schoolName = schools.find((school) => school.id === alert.schoolId)?.name ?? alert.schoolId;

  return (
    <button type="button" className="alert-card" onClick={onOpen}>
      <span className="alert-card-avatar" aria-hidden>
        {initials(alert.studentName)}
      </span>
      <span className="alert-card-main">
        <span className="alert-card-head">
          <span className="alert-card-name">{alert.studentName}</span>
          <StatusBadge tone={severityTone(alert.severity)}>{alert.severity}</StatusBadge>
          <StatusBadge tone={alert.status === "Open" ? "warn" : "ok"}>{alert.status}</StatusBadge>
        </span>
        <span className="alert-card-sub">
          {schoolName} · {gradeLabel(alert.grade)} · {alert.category}
        </span>
        <span className="alert-card-desc">{alert.description}</span>
      </span>
      <span className="alert-card-time">{formatDateTime(alert.loggedAt)}</span>
    </button>
  );
}
