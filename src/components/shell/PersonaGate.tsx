"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminScope } from "@/lib/admin-scope";
import { canReachPath, personaLandingHref } from "@/lib/nav";

/**
 * Keeps a persona inside the sections it holds.
 *
 * Hiding a nav row is not access control: the URL is still typed, still
 * bookmarked, and still where you were standing when you switched persona. This
 * sends you to your own landing section instead of rendering a screen your
 * persona has no business seeing.
 *
 * `replace`, not `push` — the page you could not reach should not be one Back
 * away, and a redirect you can bounce straight back into is not a boundary.
 *
 * Renders nothing. It sits in the root layout because the alternative is the
 * same check pasted into nine section layouts, where the tenth would be the one
 * that got forgotten.
 *
 * TODO: with real auth this belongs in middleware, where the route is decided
 * before anything is sent. It is here because the persona currently lives in
 * localStorage, which the server cannot read.
 */
export function PersonaGate() {
  const { persona, schoolId } = useAdminScope();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    /* Before mount the hook reports Super Admin — matching what the server
       rendered — so nothing redirects until the stored persona is in hand. */
    if (canReachPath(persona, pathname)) return;
    router.replace(personaLandingHref(persona, schoolId));
  }, [pathname, persona, router, schoolId]);

  return null;
}
