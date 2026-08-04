"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { schools } from "@/lib/data/schools";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

/**
 * The section tab bar is gone: sub-screens are now a school → grade drill-down
 * rather than sibling tabs, and the two editors are tabbed inside a grade.
 *
 * The breadcrumb trail lives here, above every page's own heading, so each
 * page only has to render its own title — not a title plus a repeated crumb.
 */
export default function SkillsDevelopmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [, schoolId, grade] = pathname.split("/").filter(Boolean);
  const school = schoolId ? schools.find((entry) => entry.id === schoolId) : undefined;

  return (
    <section className="sf-main">
      {school ? (
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/skills-development" />}>
                Skills &amp; Development
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {grade ? (
                <BreadcrumbLink render={<Link href={`/skills-development/${schoolId}`} />}>
                  {school.name}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{school.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {grade ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Grade {grade}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      ) : null}

      {children}
    </section>
  );
}
