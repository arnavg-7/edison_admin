"use client";

import { useEffect, useState } from "react";

/**
 * False on the server and during the first client render, true afterwards.
 *
 * Use this to gate anything derived from localStorage-backed stores
 * (`UsersProvider`, `AdminUsersProvider`). Those providers already seed
 * themselves deterministically and only read storage in an effect, but they live
 * in the root layout: React can commit the provider — running its effect and
 * swapping in the stored data — before a page's own boundary hydrates. The page
 * then renders stored data against server HTML built from the seed, which React
 * reports as a hydration mismatch.
 *
 * Because this state lives in the consuming component, its effect cannot run
 * before that component hydrates, so the first client render always matches the
 * server. The stored data appears on the next render instead.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
