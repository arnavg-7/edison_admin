"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { schools, type School } from "@/lib/data/schools";
import type { AdminActor } from "@/lib/data/goals";
import { useMounted } from "@/lib/use-mounted";

/**
 * Which slice of the district the person signed in is administering.
 *
 * Edison runs one portal for two jobs. A district Super Admin configures every
 * school; a school admin does the same work for one school and should never be
 * shown the other four — not as a list to pick from, not as a filter option,
 * and not as a row in a table they cannot act on. Hiding it is not only tidier,
 * it is the honest representation of what they can do.
 *
 * So scope is not a filter with a default of "everything". It is who you are,
 * and every screen reads it: the nav links point into the school, the pickers
 * that would have asked "which school?" are gone, and the drill-downs start one
 * level in, at the grade list.
 *
 * TODO: real scope comes from the signed-in user's record, not a switcher. The
 * switcher exists so the two views can be demonstrated from one session, and is
 * the piece to delete when authentication lands.
 */

export type AdminScope =
  | { kind: "district" }
  | { kind: "school"; schoolId: string };

const STORAGE_KEY = "edison-admin.scope.v1";

const DISTRICT: AdminScope = { kind: "district" };

function readStorage(): AdminScope {
  if (typeof window === "undefined") return DISTRICT;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DISTRICT;

    const stored = JSON.parse(raw) as AdminScope;
    if (stored?.kind === "district") return DISTRICT;
    /* A stored school that no longer exists falls back to the district rather
       than leaving an admin scoped to nothing, with every screen empty and no
       control on the page able to explain why. */
    if (stored?.kind === "school" && schools.some((entry) => entry.id === stored.schoolId)) {
      return stored;
    }
    return DISTRICT;
  } catch {
    return DISTRICT;
  }
}

type AdminScopeValue = {
  scope: AdminScope;
  /** The school being administered, or null for the whole district. */
  school: School | null;
  /** Convenience for the common case: `null` means every school. */
  schoolId: string | null;
  isDistrict: boolean;
  /** What the sidebar shows under the product name. */
  roleLabel: string;
  setScope: (scope: AdminScope) => void;
};

const AdminScopeContext = createContext<AdminScopeValue | null>(null);

export function AdminScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<AdminScope>(DISTRICT);

  // Storage is read after mount, never during render — see use-mounted.
  useEffect(() => {
    setScopeState(readStorage());
  }, []);

  const setScope = useCallback((next: AdminScope) => {
    setScopeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // A blocked or full localStorage shouldn't stop the switch taking effect
      // for this session.
    }
  }, []);

  const value = useMemo<AdminScopeValue>(() => {
    const school =
      scope.kind === "school"
        ? (schools.find((entry) => entry.id === scope.schoolId) ?? null)
        : null;

    return {
      scope,
      school,
      schoolId: school?.id ?? null,
      isDistrict: school === null,
      roleLabel: school ? "School Admin" : "Super Admin",
      setScope
    };
  }, [scope, setScope]);

  return <AdminScopeContext.Provider value={value}>{children}</AdminScopeContext.Provider>;
}

/**
 * The current scope.
 *
 * Reads as the district until the component has mounted, matching what the
 * server rendered: the provider sits in the root layout and can commit its
 * stored value before a page hydrates, and a page that read the school straight
 * away would be rendering different markup from the HTML it is hydrating into.
 */
export function useAdminScope(): AdminScopeValue {
  const context = useContext(AdminScopeContext);
  const mounted = useMounted();

  if (!context) {
    throw new Error("useAdminScope must be used inside AdminScopeProvider");
  }

  if (!mounted) {
    return { ...context, scope: DISTRICT, school: null, schoolId: null, isDistrict: true, roleLabel: "Super Admin" };
  }

  return context;
}

/**
 * The signed-in admin as the Goals permission matrix describes them.
 *
 * The matrix distinguishes district_admin from school_admin, and that is exactly
 * what the scope switcher already decides — so the two must not become separate
 * notions of who you are. Derived, never stored.
 */
export function useAdminActor(): AdminActor {
  const { schoolId } = useAdminScope();
  return schoolId
    ? { role: "school_admin", schoolId }
    : { role: "district_admin", schoolId: null };
}
