const faculty = [
  { name: "Kenneth Blekeski", department: "Mathematics", classes: 7, status: "Active" },
  { name: "Amara Chen", department: "Art History", classes: 3, status: "Active" },
  { name: "Priya Nair", department: "Biology", classes: 5, status: "Active" },
  { name: "David Osei", department: "Computer Science", classes: 4, status: "On Leave" }
] as const;

export default function AdminFacultyPage() {
  return (
    <section className="admin-main">
      <h1>Faculty</h1>
      <p className="admin-subtitle">Manage faculty accounts and department assignments</p>

      <div className="admin-content-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Classes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {faculty.map((member) => (
              <tr key={member.name}>
                <td>{member.name}</td>
                <td>{member.department}</td>
                <td>{member.classes}</td>
                <td>
                  <span className={`admin-status admin-status--${member.status === "Active" ? "active" : "leave"}`}>
                    {member.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
