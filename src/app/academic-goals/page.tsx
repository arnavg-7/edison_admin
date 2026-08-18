import { Suspense } from "react";
import { GoalsBoard } from "@/components/academic-goals/GoalsBoard";

/**
 * Goals live on one screen at every scope level, rather than behind a
 * school → grade drill-down that could only ever produce grade goals. The old
 * routes redirect here with their school and grade pre-filtered.
 */
export default function AcademicGoalsPage() {
  return (
    <Suspense fallback={null}>
      <GoalsBoard />
    </Suspense>
  );
}
