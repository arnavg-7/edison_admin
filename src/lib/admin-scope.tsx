"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { schools, type School } from "@/lib/data/schools";
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
 * Scope answers "which schools", and it is only half of who someone is. The
 * other half is `AdminPersona` — which job they are here to do. The two are
 * independent on purpose: a superintendent and a principal are the same persona
 * at two scopes, and so are the district's Super Admin and one school's.
 * Crossing them into one list would have meant a row per combination.
 *
 * TODO: real scope and persona come from the signed-in user's record, not a
 * switcher. The switcher exists so the views can be demonstrated from one
 * session, and is the piece to delete when authentication lands.
 */

export type AdminScope =
  | { kind: "district" }
  | { kind: "school"; schoolId: string };

/**
 * Which job the person signed in is here to do.
 *
 * `super-admin` is what the portal was built as and stays the default: every
 * section, full write. Scoped to one school it is the school-level admin — the
 * brief's Portal / Program Administrator, which is a scope of this job rather
 * than a job of its own, so it is not a persona here.
 *
 * `leadership` is the brief's Persona A: a read on the numbers and nothing
 * else. `it-admin` is Persona C: who has access, and whether the data is
 * arriving. What each persona reaches is in nav.ts, next to the sections it
 * names.
 */
export type AdminPersona = "super-admin" | "leadership" | "it-admin";

export const ADMIN_PERSONAS: { value: AdminPersona; label: string; detail: string }[] = [
  {
    value: "super-admin",
    label: "Super Admin",
    detail: "Every section, full write."
  },
  {
    value: "leadership",
    label: "District & School Leadership",
    detail: "Reporting only, read-only. Superintendent, principal, assistant principal."
  },
  {
    value: "it-admin",
    label: "IT / Systems Administrator",
    detail: "Who has access, and whether the data is arriving. District IT or Ken42 technical ops."
  }
];

const SCOPE_KEY = "edison-admin.scope.v1";
const PERSONA_KEY = "edison-admin.persona.v1";

const DISTRICT: AdminScope = { kind: "district" };
const DEFAULT_PERSONA: AdminPersona = "super-admin";

function readStorage(): AdminScope {
  if (typeof window === "undefined") return DISTRICT;

  try {
    const raw = window.localStorage.getItem(SCOPE_KEY);
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

function readPersona(): AdminPersona {
  if (typeof window === "undefined") return DEFAULT_PERSONA;

  try {
    const raw = window.localStorage.getItem(PERSONA_KEY) as AdminPersona | null;
    // An unknown persona falls back rather than leaving the nav empty with no
    // control on screen able to explain why.
    return ADMIN_PERSONAS.some((entry) => entry.value === raw) ? (raw as AdminPersona) : DEFAULT_PERSONA;
  } catch {
    return DEFAULT_PERSONA;
  }
}

type AdminScopeValue = {
  scope: AdminScope;
  persona: AdminPersona;
  setPersona: (persona: AdminPersona) => void;
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

/**
 * What the sidebar shows under the product name.
 *
 * Super Admin scoped to one school has always read "School Admin", and that is
 * what Edison call the job, so the scoped name wins where there is one. The
 * other two personas are the same job at either scope and keep their name.
 */
function personaLabel(persona: AdminPersona, scoped: boolean): string {
  if (persona === "super-admin") return scoped ? "School Admin" : "Super Admin";
  /* IT keeps one name at either scope: the job is the district's systems, and a
     school-scoped IT admin is the same person looking at one school's rows. */
  if (persona === "it-admin") return "IT Administrator";
  return scoped ? "School Leadership" : "District Leadership";
}

export function AdminScopeProvider({ children }: { children: React.ReactNode }) {
  const [scope, setScopeState] = useState<AdminScope>(DISTRICT);
  const [persona, setPersonaState] = useState<AdminPersona>(DEFAULT_PERSONA);

  // Storage is read after mount, never during render — see use-mounted.
  useEffect(() => {
    setScopeState(readStorage());
    setPersonaState(readPersona());
  }, []);

  const setScope = useCallback((next: AdminScope) => {
    setScopeState(next);
    try {
      window.localStorage.setItem(SCOPE_KEY, JSON.stringify(next));
    } catch {
      // A blocked or full localStorage shouldn't stop the switch taking effect
      // for this session.
    }
  }, []);

  const setPersona = useCallback((next: AdminPersona) => {
    setPersonaState(next);
    try {
      window.localStorage.setItem(PERSONA_KEY, next);
    } catch {
      // As above — the switch still holds for this session.
    }
  }, []);

  const value = useMemo<AdminScopeValue>(() => {
    const school =
      scope.kind === "school"
        ? (schools.find((entry) => entry.id === scope.schoolId) ?? null)
        : null;

    return {
      scope,
      persona,
      setPersona,
      school,
      schoolId: school?.id ?? null,
      isDistrict: school === null,
      roleLabel: personaLabel(persona, school !== null),
      setScope
    };
  }, [persona, scope, setPersona, setScope]);

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
    return {
      ...context,
      scope: DISTRICT,
      persona: DEFAULT_PERSONA,
      school: null,
      schoolId: null,
      isDistrict: true,
      roleLabel: personaLabel(DEFAULT_PERSONA, false)
    };
  }

  return context;
}
