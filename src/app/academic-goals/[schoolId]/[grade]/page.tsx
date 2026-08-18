import { Suspense } from "react";
import { notFound } from "next/navigation";
import { schools } from "@/lib/data/schools";
import { GoalsBoard } from "@/components/academic-goals/GoalsBoard";

export function generateStaticParams() {
  return schools.flatMap((school) =>
    school.grades.map((grade) => ({ schoolId: school.id, grade }))
  );
}

/** The old grade route: the board, filtered to that school and grade. */
export default async function GradeGoalsPage({
  params
}: {
  params: Promise<{ schoolId: string; grade: string }>;
}) {
  const { schoolId, grade: rawGrade } = await params;
  const grade = decodeURIComponent(rawGrade);
  const school = schools.find((entry) => entry.id === schoolId);
  if (!school || !school.grades.includes(grade)) notFound();

  return (
    <Suspense fallback={null}>
      <GoalsBoard initialSchool={schoolId} initialGrade={grade} />
    </Suspense>
  );
}
