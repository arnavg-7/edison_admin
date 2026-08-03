import Link from "next/link";
import { notFound } from "next/navigation";
import { schools, gradeLabel } from "@/lib/data/schools";
import { GradeGoalsEditor } from "@/components/academic-goals/GradeGoalsEditor";

export function generateStaticParams() {
  return schools.flatMap((school) =>
    school.grades.map((grade) => ({ schoolId: school.id, grade }))
  );
}

/** Step three: set and edit the goals for students in one grade at one school. */
export default async function GoalsForGradePage({
  params
}: {
  params: Promise<{ schoolId: string; grade: string }>;
}) {
  const { schoolId, grade: rawGrade } = await params;
  const grade = decodeURIComponent(rawGrade);
  const school = schools.find((entry) => entry.id === schoolId);

  if (!school || !school.grades.includes(grade)) {
    notFound();
  }

  return (
    <>
      <nav className="sf-crumbs" aria-label="Breadcrumb">
        <Link href="/academic-goals">Academic Goals</Link>
        <span aria-hidden>/</span>
        <Link href={`/academic-goals/${school.id}`}>{school.name}</Link>
        <span aria-hidden>/</span>
        <span>{gradeLabel(grade)}</span>
      </nav>

      <div className="sf-scope-head">
        <h2>
          {gradeLabel(grade)} · {school.name}
        </h2>
        <p className="sf-page-sub">
          Set a goal for this grade's semester, and edit it here. Goals move to this grade's goal
          history once their semester's end date has passed.
        </p>
      </div>

      <GradeGoalsEditor schoolId={school.id} grade={grade} />
    </>
  );
}
