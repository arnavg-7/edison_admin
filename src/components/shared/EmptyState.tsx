export function EmptyState({
  title,
  message,
  tone = "neutral",
  action
}: {
  title: string;
  message: string;
  tone?: "neutral" | "gap";
  action?: React.ReactNode;
}) {
  return (
    <div className={`empty-state empty-state--${tone}`}>
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

/**
 * Real production gap, not a synthetic-data workaround: Genesis has homeroom
 * courses for only 1 of 5 schools and zero homeroom enrollments anywhere. This
 * state is expected to persist until the district's Genesis export is fixed, so
 * it explains the gap rather than implying a transient loading failure.
 */
export function AwaitingGenesisData({
  subject = "Homeroom mapping",
  detail
}: {
  subject?: string;
  detail?: string;
}) {
  return (
    <EmptyState
      tone="gap"
      title={`Awaiting data from Genesis — ${subject.toLowerCase()}`}
      message={
        detail ??
        "Genesis has homeroom courses for 1 of 5 schools and no homeroom enrollments in any school. This screen will populate once the district's Genesis export includes homeroom courses and enrollments."
      }
    />
  );
}

/**
 * Graceful fallback only. Attendance is covered by a synthetic dataset matching
 * the real OneRoster schema, so this should appear only if a live feed is
 * genuinely empty.
 */
export function NoAttendanceData({ scope }: { scope?: string }) {
  return (
    <EmptyState
      title="No attendance data yet"
      message={
        scope
          ? `No attendance records have been received for ${scope}. Attendance loads once daily from the Genesis file.`
          : "No attendance records have been received. Attendance loads once daily from the Genesis file."
      }
    />
  );
}
