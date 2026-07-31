const classes = [
  { name: "Calculus · Class 1", rate: 94 },
  { name: "Art History · Class 3", rate: 89 },
  { name: "Biology 2 · Class 4", rate: 76 },
  { name: "Computer Science · Class 2", rate: 91 }
] as const;

export default function AdminAttendancePage() {
  return (
    <section className="admin-main">
      <h1>Attendance</h1>
      <p className="admin-subtitle">School-wide attendance by class</p>

      <div className="admin-content-panel">
        <div className="admin-attendance-list">
          {classes.map((item) => (
            <div className="admin-attendance-row" key={item.name}>
              <span className="admin-attendance-label">{item.name}</span>
              <div className="admin-attendance-bar">
                <div
                  className={`admin-attendance-fill${item.rate < 80 ? " is-low" : ""}`}
                  style={{ width: `${item.rate}%` }}
                />
              </div>
              <span className="admin-attendance-value">{item.rate}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
