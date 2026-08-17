"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminScope } from "@/lib/admin-scope";

/**
 * Keeps a school admin off the "pick a school" screens.
 *
 * The nav already points them one level in, so this is for the ways round it —
 * a bookmark, a typed URL, a breadcrumb back to the section root. Rather than
 * render a list of five schools they can only open one of, it sends them to
 * their own.
 *
 * A client redirect because scope lives in localStorage, which the server
 * cannot read. The children are the district view and are what the server
 * rendered, so they stay mounted through the first client render and the swap
 * happens afterwards — no hydration mismatch, at the cost of one frame.
 */
export function SchoolPickerGate({
  section,
  children
}: {
  /** Section root, e.g. "/skills-development". */
  section: string;
  children: React.ReactNode;
}) {
  const { schoolId, school } = useAdminScope();
  const router = useRouter();

  useEffect(() => {
    if (schoolId) router.replace(`${section}/${schoolId}`);
  }, [router, schoolId, section]);

  if (schoolId) {
    return (
      <p className="sf-page-sub" role="status">
        Opening {school?.name ?? "your school"}&hellip;
      </p>
    );
  }

  return <>{children}</>;
}
