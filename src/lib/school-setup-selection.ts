"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  findBatch,
  findGrade,
  findSchool,
  type SetupBatch,
  type SetupGrade,
  type SetupNodeKind,
  type SetupSchool
} from "@/lib/data/schoolSetup";
import { useSchoolSetup } from "@/lib/school-setup-store";
import { useAdminScope } from "@/lib/admin-scope";

export type SetupSelectionPatch = {
  school?: string | null;
  grade?: string | null;
  batch?: string | null;
  query?: string;
  year?: string | null;
};

/**
 * Which node School Setup is looking at, held in the URL like Reporting's
 * scope — so it survives a reload, a shared link, and the Drill-down ⇄ Columns
 * tab switch (SectionTabs carries the query string across).
 *
 * Ids are resolved against the live tree on every read rather than trusted, for
 * the same reason Home widens an unknown school to the district: a link can name
 * a school someone has since deleted, and the honest answer is the nearest level
 * that still exists, not an empty panel that reads as a data outage. That also
 * makes delete-then-undo work for free — the id comes back, so the selection does.
 */
export function useSetupSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { district } = useSchoolSetup();
  /* Setup's tree carries the same school ids as `schools`, so the scope maps
     straight onto it. A school admin's root is their school, not the district:
     there is no level above it they may act on. */
  const { schoolId: scopedSchoolId } = useAdminScope();

  const selection = useMemo(() => {
    const school = scopedSchoolId
      ? findSchool(district, scopedSchoolId)
      : findSchool(district, searchParams.get("school"));
    const grade = findGrade(school, searchParams.get("grade"));
    const batch = findBatch(grade, searchParams.get("batch"));

    const kind: SetupNodeKind = batch ? "batch" : grade ? "grade" : school ? "school" : "district";

    return {
      school,
      grade,
      batch,
      kind,
      query: searchParams.get("q") ?? "",
      /** Batch-year filter on the grade's batch list. "" is every year. */
      year: searchParams.get("year") ?? ""
    };
  }, [district, searchParams, scopedSchoolId]);

  const select = useCallback(
    (patch: SetupSelectionPatch) => {
      const next = new URLSearchParams(searchParams.toString());

      const write = (key: string, value: string | null | undefined) => {
        if (value === undefined) return;
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      };

      /* Cascade first, then write: a patch that names a school *and* a grade —
         picking a grade in the Columns view does exactly that — must end up with
         both set, not with the grade cleared by its own parent's reset. */
      if ("school" in patch) {
        next.delete("grade");
        next.delete("batch");
        next.delete("year");
      }
      if ("grade" in patch) {
        next.delete("batch");
        // The year filter belongs to one grade's batch list, not to the screen.
        next.delete("year");
      }

      write("school", patch.school);
      write("grade", patch.grade);
      write("batch", patch.batch);
      write("q", patch.query);
      write("year", patch.year);

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { ...selection, select };
}
