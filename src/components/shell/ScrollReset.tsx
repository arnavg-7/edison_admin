"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * `#main-content`, not the document, is the app's real scroll container now
 * (see `.sf-main-region`/`#main-content` in theme.css — needed so a
 * sticky-bottom bar like the People page's pagination can actually pin to
 * the visible bottom edge). The browser's own scroll restoration only knows
 * about window/document scrolling, so a route change has to reset this
 * container's scroll position back to top itself, or the next page can open
 * already scrolled down to wherever the previous page was left.
 */
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    document.getElementById("main-content")?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
