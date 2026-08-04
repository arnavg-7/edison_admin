import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
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
      <div className="sf-scope-head">
        <h1 className="sf-page-title sf-page-title--with-back">
          <Link
            href={`/academic-goals/${school.id}`}
            className="sf-back-btn"
            aria-label={`Back to ${school.name} grades`}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
          </Link>
          {gradeLabel(grade)} · {school.name}
        </h1>
      </div>

      <GradeGoalsEditor schoolId={school.id} grade={grade} />
    </>
  );
}
