const students = [
  { name: "Maya Torres", grade: "Grade 10", classes: 6, attendance: "95%" },
  { name: "Ethan Wu", grade: "Grade 11", classes: 7, attendance: "88%" },
  { name: "Sofia Rossi", grade: "Grade 9", classes: 6, attendance: "97%" },
  { name: "Liam Patel", grade: "Grade 12", classes: 5, attendance: "91%" }
] as const;

export default function AdminStudentsPage() {
  return (
    <section className="admin-main">
      <h1>Students</h1>
      <p className="admin-subtitle">Manage student enrollment and records</p>

      <div className="admin-content-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Classes</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.name}>
                <td>{student.name}</td>
                <td>{student.grade}</td>
                <td>{student.classes}</td>
                <td>{student.attendance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
