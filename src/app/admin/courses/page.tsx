const courses = [
  { title: "Calculus", faculty: "Kenneth Blekeski", students: 20, tone: "purple" },
  { title: "Art History", faculty: "Amara Chen", students: 12, tone: "pink" },
  { title: "Biology 2", faculty: "Priya Nair", students: 42, tone: "blue" },
  { title: "Computer Science", faculty: "David Osei", students: 28, tone: "gold" }
] as const;

export default function AdminCoursesPage() {
  return (
    <section className="admin-main">
      <h1>Courses</h1>
      <p className="admin-subtitle">Manage course offerings across departments</p>

      <div className="admin-course-grid">
        {courses.map((course) => (
          <article className="admin-course-card" key={course.title}>
            <div className={`admin-course-top tone-${course.tone}`}>
              <h3>{course.title}</h3>
            </div>
            <div className="admin-course-bottom">
              <span>{course.faculty}</span>
              <span>{course.students} Students</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
