import { Suspense } from "react";
import { notFound } from "next/navigation";
import { schools } from "@/lib/data/schools";
import { GoalsBoard } from "@/components/academic-goals/GoalsBoard";

export function generateStaticParams() {
  return schools.map((school) => ({ schoolId: school.id }));
}

/**
 * Kept so links written against the old drill-down still land somewhere true —
 * the board, filtered to this school.
 */
export default async function SchoolGoalsPage({
  params
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  if (!schools.some((entry) => entry.id === schoolId)) notFound();

  return (
    <Suspense fallback={null}>
      <GoalsBoard initialSchool={schoolId} />
    </Suspense>
  );
}
