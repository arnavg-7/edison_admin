const metrics = [
  { label: "Total Students", value: "1,284" },
  { label: "Total Faculty", value: "96" },
  { label: "Active Courses", value: "48" },
  { label: "Avg. Attendance", value: "92%" }
] as const;

const activity = [
  { title: "New faculty account created", detail: "Kenneth Blekeski · Mathematics", time: "2h ago" },
  { title: "Course updated", detail: "AP Spanish I · syllabus revised", time: "5h ago" },
  { title: "Attendance flagged", detail: "Biology 2 · Class 4 below 80%", time: "1d ago" },
  { title: "New student enrolled", detail: "Class 7 · Data Science", time: "2d ago" }
] as const;

export default function AdminDashboardPage() {
  return (
    <section className="admin-main">
      <h1>Welcome back, Admin</h1>

      <div className="admin-metrics">
        {metrics.map((metric) => (
          <article className="admin-metric-card" key={metric.label}>
            <h3>{metric.value}</h3>
            <p>{metric.label}</p>
          </article>
        ))}
      </div>

      <div className="admin-content-panel">
        <h2>Recent Activity</h2>
        <div className="admin-activity-list">
          {activity.map((item) => (
            <div className="admin-activity-item" key={item.title}>
              <div>
                <div className="admin-activity-title">{item.title}</div>
                <div className="admin-activity-detail">{item.detail}</div>
              </div>
              <span className="admin-activity-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
