"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { schools } from "@/lib/data/schools";
import { useAdminScope } from "@/lib/admin-scope";
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
  /* A school admin has no school picker to go back to, so the section crumb is
     a label rather than a link that would only bounce them here again. */
  const { isDistrict } = useAdminScope();
  const [, schoolId, grade] = pathname.split("/").filter(Boolean);
  const school = schoolId ? schools.find((entry) => entry.id === schoolId) : undefined;

  return (
    <section className="sf-main">
      {school ? (
        <Breadcrumb className="mb-5">
          <BreadcrumbList>
            <BreadcrumbItem>
              {isDistrict ? (
                <BreadcrumbLink render={<Link href="/skills-development" />}>
                  Skills &amp; Development
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Skills &amp; Development</BreadcrumbPage>
              )}
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
