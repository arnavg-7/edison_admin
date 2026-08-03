import { notFound } from "next/navigation";
import { allGradeScopes, findGradeScope } from "@/lib/data/skillsDevelopment";
import { GradeScopeEditor } from "@/components/skills-development/GradeScopeEditor";

export function generateStaticParams() {
  return allGradeScopes().map((scope) => ({ schoolId: scope.schoolId, grade: scope.grade }));
}

/** Step three: the two editors, scoped to one grade at one school. */
export default async function GradeConfigPage({
  params
}: {
  params: Promise<{ schoolId: string; grade: string }>;
}) {
  const { schoolId, grade } = await params;
  const scope = findGradeScope(schoolId, decodeURIComponent(grade));

  if (!scope) {
    notFound();
  }

  return <GradeScopeEditor scope={scope} />;
}
