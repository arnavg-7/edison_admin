"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminScope } from "@/lib/admin-scope";
import { canReachPath, landingHref } from "@/lib/nav";

/**
 * Keeps a signed-in account inside the sections its roles hold.
 *
 * Hiding a nav row is not access control: the URL is still typed, still
 * bookmarked, and still where you were standing when you signed in as somebody
 * else. This sends you to your own landing section instead of rendering a
 * screen the account has no business seeing.
 *
 * It follows the live role configuration, so unticking a section on Roles &
 * Access turns anyone standing in it out on the next render.
 *
 * `replace`, not `push` — the page you could not reach should not be one Back
 * away, and a redirect you can bounce straight back into is not a boundary.
 *
 * Renders nothing. It sits in the root layout because the alternative is the
 * same check pasted into nine section layouts, where the tenth would be the one
 * that got forgotten.
 *
 * TODO: with real auth this belongs in middleware, where the route is decided
 * before anything is sent. It is here because the session currently lives in
 * localStorage, which the server cannot read.
 */
export function SessionGate() {
  const { sections, schoolId } = useAdminScope();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    /* Before mount the hook reports the default Super Admin — matching what the
       server rendered — so nothing redirects until the stored account is in
       hand. */
    if (canReachPath(sections, pathname)) return;
    router.replace(landingHref(sections, schoolId));
  }, [pathname, router, schoolId, sections]);

  return null;
}
